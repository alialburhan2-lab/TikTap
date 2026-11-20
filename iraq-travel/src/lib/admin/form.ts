import { LOCALES } from "@/i18n/config";
import type { ImageAsset } from "@/data/types";
import type { EntityConfig, FieldDef } from "./entities";

export type FormLike = { get(name: string): FormDataEntryValue | null; getAll(name: string): FormDataEntryValue[] };

const TRI = ["unknown", "yes", "no"];
const isTri = (f: FieldDef) => f.type === "select" && f.options?.length === 3 && f.options.every((o) => TRI.includes(o));
const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

export function parseImages(text: string): { images: ImageAsset[]; error?: string } {
  const images: ImageAsset[] = [];
  for (const [i, raw] of text.split("\n").map((l) => l.trim()).filter(Boolean).entries()) {
    const [url, alt = "", credit = "", license = "", sourceUrl = "", verified = "no"] = raw.split("|").map((p) => p.trim());
    if (!/^https:\/\/\S+$/.test(url) && !/^\/images\/[\w\-/.]+$/.test(url)) return { images, error: `Line ${i + 1}: image URL must start with https:// or be a local /images/... path` };
    if (!credit || !license) return { images, error: `Line ${i + 1}: credit and licence are required for every photo` };
    images.push({ url, alt, credit, license, sourceUrl, verified: /^(yes|true|1|verified)$/i.test(verified) });
  }
  return { images };
}

export function imagesToText(images: ImageAsset[] | undefined): string {
  return (images ?? []).map((i) => [i.url, i.alt, i.credit, i.license, i.sourceUrl, i.verified ? "yes" : "no"].join(" | ")).join("\n");
}

/** Convert submitted form values into a typed record according to the entity config. */
export function parseEntityForm(cfg: EntityConfig, form: FormLike): { values: Record<string, unknown>; errors: Record<string, string> } {
  const values: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  for (const f of cfg.fields) {
    const raw = str(form.get(f.name));
    switch (f.type) {
      case "localized":
      case "localizedLong": {
        const obj: Record<string, string> = {};
        for (const l of LOCALES) {
          const v = str(form.get(`${f.name}.${l}`));
          if (v) obj[l] = v;
        }
        if (!obj.en && f.required) errors[f.name] = "English text is required";
        values[f.name] = obj.en ? obj : f.required ? obj : null;
        break;
      }
      case "number": {
        if (raw === "") {
          if (f.required) errors[f.name] = "Required";
          values[f.name] = null;
        } else {
          const n = Number(raw);
          if (!Number.isFinite(n)) errors[f.name] = "Must be a number";
          values[f.name] = n;
        }
        break;
      }
      case "boolean":
        values[f.name] = form.get(f.name) === "on" || form.get(f.name) === "true";
        break;
      case "multiselect":
      case "refs": {
        const list = form.getAll(f.name).map((v) => String(v)).filter(Boolean);
        if (f.options) for (const v of list) if (!f.options.includes(v)) errors[f.name] = `Invalid option: ${v}`;
        if (f.required && list.length === 0) errors[f.name] = "Choose at least one";
        values[f.name] = list;
        break;
      }
      case "tags":
        values[f.name] = raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
        break;
      case "images": {
        const { images, error } = parseImages(raw);
        if (error) errors[f.name] = error;
        values[f.name] = images;
        break;
      }
      case "date":
        if (raw && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) errors[f.name] = "Use YYYY-MM-DD";
        if (!raw && f.required) errors[f.name] = "Required";
        values[f.name] = raw || null;
        break;
      case "datetime": {
        if (!raw) {
          if (f.required) errors[f.name] = "Required";
          values[f.name] = null;
        } else {
          const d = new Date(raw);
          if (Number.isNaN(d.getTime())) errors[f.name] = "Invalid date";
          else values[f.name] = d.toISOString();
        }
        break;
      }
      case "select":
        if (isTri(f)) {
          values[f.name] = raw === "yes" ? true : raw === "no" ? false : null;
          break;
        }
        if (raw && f.options && !f.options.includes(raw)) errors[f.name] = "Invalid option";
        if (!raw && f.required) errors[f.name] = "Required";
        values[f.name] = raw || null;
        break;
      default:
        if (!raw && f.required) errors[f.name] = "Required";
        if (raw.length > 20000) errors[f.name] = "Too long";
        values[f.name] = raw || (f.nullable ? null : "");
    }
  }
  if (typeof values.slug === "string" && values.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) errors.slug = "Lowercase letters, numbers and hyphens only";
  for (const k of ["url", "website", "sourceUrl"]) {
    const v = values[k];
    if (typeof v === "string" && v && !/^https?:\/\/\S+$/.test(v)) errors[k] = "Must be an http(s) URL";
  }
  if (typeof values.lat === "number" && (values.lat < 28 || values.lat > 38.5)) errors.lat = "Latitude outside Iraq";
  if (typeof values.lng === "number" && (values.lng < 38 || values.lng > 49.5)) errors.lng = "Longitude outside Iraq";
  if (typeof values.min === "number" && typeof values.avg === "number" && typeof values.max === "number" && !(values.min <= values.avg && values.avg <= values.max)) errors.avg = "Must satisfy min ≤ average ≤ max";
  if (typeof values.rating === "number" && (values.rating < 1 || values.rating > 5)) errors.rating = "1–5";
  return { values, errors };
}

const LEVEL_RANK = { unverified: 0, contact_verified: 1, documents_checked: 2, license_verified: 3 } as const;
export type Level = keyof typeof LEVEL_RANK;

/** A provider level may only be raised to a level backed by an APPROVED verification document. */
export function maxApprovedLevel(docs: { status: string; requestedLevel: Level }[]): Level {
  let best: Level = "unverified";
  for (const d of docs) if (d.status === "approved" && LEVEL_RANK[d.requestedLevel] > LEVEL_RANK[best]) best = d.requestedLevel;
  return best;
}
export function levelAllowed(requested: Level, docs: { status: string; requestedLevel: Level }[]): boolean {
  return LEVEL_RANK[requested] <= LEVEL_RANK[maxApprovedLevel(docs)];
}

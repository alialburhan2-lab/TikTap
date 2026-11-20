"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import type { ArticleStatus } from "@prisma/client";
import { saveArticleAction } from "@/actions/admin/articles";
import type { ActionState } from "@/lib/action-result";
import { STATUS_LABELS } from "@/lib/permissions";
import { ImagePicker } from "./ImagePicker";
import { RichEditor } from "./RichEditor";
import { FieldError, FormMessage } from "./ui";

export interface ArticleFormValues {
  id?: string;
  title: string;
  slug: string;
  subtitle: string;
  excerpt: string;
  content: string;
  coverImage: string;
  coverImageAlt: string;
  categoryId: string;
  tags: string;
  status: ArticleStatus;
  publishedAt: string | null; // ISO
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ArticleForm({
  values,
  categories,
  statuses,
  canFeature,
  created,
}: {
  values: ArticleFormValues;
  categories: { id: string; name: string }[];
  statuses: ArticleStatus[];
  canFeature: boolean;
  created?: boolean;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveArticleAction, created ? { ok: true, message: "تم إنشاء المقال بنجاح" } : {});
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<ArticleStatus>(values.status);
  const [publishedLocal, setPublishedLocal] = useState(toLocalInput(values.publishedAt));
  const [seoTitle, setSeoTitle] = useState(values.seoTitle);
  const [seoDesc, setSeoDesc] = useState(values.seoDescription);

  const publishedIso = publishedLocal ? new Date(publishedLocal).toISOString() : "";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className="grid gap-6 xl:grid-cols-[1fr_20rem]"
      noValidate
    >
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="publishedAt" value={publishedIso} />

      <div className="min-w-0 space-y-5">
        <FormMessage state={state} />
        <div>
          <label htmlFor="title" className="label">العنوان *</label>
          <input id="title" name="title" defaultValue={values.title} required maxLength={250} className="input text-lg font-bold" />
          <FieldError state={state} name="title" />
        </div>
        <div>
          <label htmlFor="subtitle" className="label">العنوان الفرعي</label>
          <input id="subtitle" name="subtitle" defaultValue={values.subtitle} maxLength={300} className="input" />
          <FieldError state={state} name="subtitle" />
        </div>
        <div>
          <span className="label">المحتوى</span>
          <RichEditor name="content" defaultValue={values.content} />
          <FieldError state={state} name="content" />
        </div>
        <div>
          <label htmlFor="excerpt" className="label">الملخص</label>
          <textarea id="excerpt" name="excerpt" defaultValue={values.excerpt} rows={3} maxLength={600} className="input" placeholder="يُولّد تلقائياً من المحتوى إن تُرك فارغاً" />
          <FieldError state={state} name="excerpt" />
        </div>

        <fieldset className="card space-y-4 p-5">
          <legend className="px-2 text-sm font-extrabold text-navy-900">تحسين محركات البحث (SEO)</legend>
          <div>
            <label htmlFor="slug" className="label">الرابط (Slug)</label>
            <input id="slug" name="slug" defaultValue={values.slug} maxLength={120} className="input" placeholder="يُولّد تلقائياً من العنوان" />
            <p className="mt-1 text-xs text-muted">حروف عربية أو إنجليزية وأرقام وشرطات فقط. مثال: تحليل-المشهد-السياسي</p>
            <FieldError state={state} name="slug" />
          </div>
          <div>
            <label htmlFor="seoTitle" className="label">عنوان SEO <span className="text-xs font-normal text-muted">({seoTitle.length}/70)</span></label>
            <input id="seoTitle" name="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={70} className="input" />
            <FieldError state={state} name="seoTitle" />
          </div>
          <div>
            <label htmlFor="seoDescription" className="label">وصف SEO <span className="text-xs font-normal text-muted">({seoDesc.length}/170)</span></label>
            <textarea id="seoDescription" name="seoDescription" value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={2} maxLength={170} className="input" />
            <FieldError state={state} name="seoDescription" />
          </div>
        </fieldset>
      </div>

      <aside className="space-y-5">
        <div className="card space-y-4 p-5">
          <div>
            <label htmlFor="status" className="label">الحالة</label>
            <select id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value as ArticleStatus)} className="input">
              {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            {!statuses.includes("PUBLISHED") && (
              <p className="mt-1 text-xs text-muted">أرسل المقال «قيد المراجعة» ليقوم المالك بنشره.</p>
            )}
            <FieldError state={state} name="status" />
          </div>
          {(status === "SCHEDULED" || status === "PUBLISHED" || publishedLocal) && (
            <div>
              <label htmlFor="publishedAtLocal" className="label">{status === "SCHEDULED" ? "موعد النشر المجدول *" : "تاريخ النشر"}</label>
              <input id="publishedAtLocal" type="datetime-local" value={publishedLocal} onChange={(e) => setPublishedLocal(e.target.value)} className="input" />
              <p className="mt-1 text-xs text-muted">{status === "PUBLISHED" ? "اتركه فارغاً للنشر الآن." : "بتوقيت جهازك."}</p>
              <FieldError state={state} name="publishedAt" />
            </div>
          )}
          {canFeature && (
            <label className="flex items-center gap-2 text-sm font-bold text-navy-900">
              <input type="checkbox" name="featured" defaultChecked={values.featured} className="h-4 w-4 accent-navy-900" />
              مقال رئيسي مميز في الصفحة الرئيسية
            </label>
          )}
          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? "جارٍ الحفظ…" : values.id ? "حفظ التغييرات" : "حفظ المقال"}
          </button>
          {values.id && (
            <Link href={`/admin/articles/${values.id}/preview`} target="_blank" className="btn-outline w-full">معاينة</Link>
          )}
        </div>

        <div className="card space-y-4 p-5">
          <div>
            <label htmlFor="categoryId" className="label">التصنيف</label>
            <select id="categoryId" name="categoryId" defaultValue={values.categoryId} className="input">
              <option value="">— بدون تصنيف —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <FieldError state={state} name="categoryId" />
          </div>
          <div>
            <label htmlFor="tags" className="label">الوسوم</label>
            <input id="tags" name="tags" defaultValue={values.tags} className="input" placeholder="افصل بينها بفاصلة ،" />
            <FieldError state={state} name="tags" />
          </div>
        </div>

        <div className="card p-5">
          <ImagePicker name="coverImage" altName="coverImageAlt" defaultValue={values.coverImage} defaultAlt={values.coverImageAlt} label="صورة الغلاف" />
          <FieldError state={state} name="coverImage" />
        </div>
      </aside>
    </form>
  );
}

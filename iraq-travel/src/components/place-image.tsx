import type { ImageAsset, SiteCategory } from "@/data/types";
import type { Dictionary } from "@/i18n/dictionary";

const MOTIF: Record<string, string> = {
  archaeological: "M10 70 L30 70 L30 58 L40 58 L40 46 L60 46 L60 58 L70 58 L70 70 L90 70 L90 74 L10 74 Z M44 46 L44 36 L56 36 L56 46",
  religious: "M30 74 L30 50 Q50 18 70 50 L70 74 Z M48 22 L52 22 L52 14 L48 14 Z M20 74 L20 40 L24 34 L28 40 L28 74 Z M72 74 L72 40 L76 34 L80 40 L80 74 Z",
  natural: "M5 74 Q20 60 35 74 Q50 60 65 74 Q80 60 95 74 Z M20 66 L20 36 M26 66 L26 30 M32 66 L32 40 M70 66 L70 34 M76 66 L76 28",
  museum: "M15 74 L85 74 L85 70 L15 70 Z M20 70 L20 46 M35 70 L35 46 M50 70 L50 46 M65 70 L65 46 M80 70 L80 46 M12 46 L50 26 L88 46 Z",
  historic_city: "M10 74 L10 44 L20 44 L20 38 L30 38 L30 44 L40 44 L40 30 L60 30 L60 44 L70 44 L70 38 L80 38 L80 44 L90 44 L90 74 Z",
  default: "M10 74 Q50 30 90 74 Z",
};

/**
 * Shows the first editor-verified photo with credit/licence, otherwise an illustrated
 * placeholder that is clearly NOT a photograph of the place.
 */
export function PlaceImage({ images, category, alt, t, className = "", showCaption = false }: {
  images: ImageAsset[]; category?: SiteCategory | string; alt: string; t: Dictionary; className?: string; showCaption?: boolean;
}) {
  const img = images.find((i) => i.verified && (i.url.startsWith("https://") || /^\/images\/[\w\-/.]+$/.test(i.url)));
  if (img) {
    return (
      <figure className={`relative overflow-hidden bg-sand-200 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.url} alt={img.alt || alt} loading="lazy" className="h-full w-full object-cover" />
        <figcaption className="absolute bottom-0 end-0 max-w-full truncate rounded-ss-lg bg-black/55 px-2 py-0.5 text-[10px] text-white">
          {img.credit} · {img.license}
        </figcaption>
      </figure>
    );
  }
  const path = MOTIF[category ?? "default"] ?? MOTIF.default;
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-river-900 via-river-800 to-river-700 ${className}`} role="img" aria-label={`${alt} — ${t.common.photoPending}`}>
      <svg viewBox="0 0 100 80" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id="tiles" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 4 L4 0 L8 4 L4 8 Z" fill="none" stroke="rgba(217,178,95,0.12)" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100" height="80" fill="url(#tiles)" />
        <circle cx="76" cy="22" r="8" fill="rgba(229,197,126,0.35)" />
        <path d={path} fill="rgba(229,197,126,0.55)" stroke="rgba(229,197,126,0.8)" strokeWidth="0.6" />
      </svg>
      {showCaption && (
        <span className="absolute bottom-2 start-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-sand-100 backdrop-blur">
          {t.common.photoPending}
        </span>
      )}
    </div>
  );
}

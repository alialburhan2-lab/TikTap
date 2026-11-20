import Image from "next/image";

/** صورة الغلاف أو بديل بصري بهوية المنصة عند غيابها */
export function CoverImage({
  src,
  alt,
  sizes,
  priority,
  className = "",
  label,
}: {
  src?: string | null;
  alt?: string | null;
  sizes: string;
  priority?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-navy-900 ${className}`}>
      {src ? (
        <Image src={src} alt={alt || ""} fill sizes={sizes} priority={priority} className="object-cover transition duration-500 group-hover:scale-[1.03]" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#2e4c62,#172a38_60%)]">
          <span className="font-display text-3xl font-extrabold text-gold-500/80">{label ?? "غ"}</span>
        </div>
      )}
    </div>
  );
}

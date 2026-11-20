export function PageHeader({ kicker, title, description }: { kicker?: string; title: string; description?: string | null }) {
  return (
    <div className="border-b border-line bg-white">
      <div className="container-page py-10 sm:py-14">
        {kicker && <p className="kicker mb-2">{kicker}</p>}
        <h1 className="text-3xl font-extrabold text-navy-900 sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl leading-8 text-muted">{description}</p>}
        <div className="mt-6 h-1 w-16 rounded-full bg-gold-500" />
      </div>
    </div>
  );
}

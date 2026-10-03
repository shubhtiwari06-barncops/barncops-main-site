import { cn } from "@/lib/cn";

export function SiteImage({
  src,
  alt,
  className,
  label,
}: {
  src: string;
  alt: string;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("photo-frame", className)}>
      <img src={src} alt={alt} className="photo-crop-img" loading="lazy" decoding="async" />
      <div className="photo-grade" />
      {label ? (
        <p className="absolute bottom-4 left-4 z-10 font-mono text-xs tracking-wide text-fg/80">
          {label}
        </p>
      ) : null}
    </div>
  );
}

import { cn } from "@/lib/cn";

const SIZES = {
  md: "size-32 sm:size-36 lg:size-40",
  xl: "size-56 sm:size-64 lg:size-80",
} as const;

export function GlowAvatar({
  src,
  alt,
  glow = "teal",
  size = "md",
}: {
  src: string;
  alt: string;
  glow?: "teal" | "strike";
  size?: keyof typeof SIZES;
  kind?: "portrait" | "upper" | "logo";
}) {
  return (
    <div
      className={cn(
        "relative flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-full",
        SIZES[size],
        glow === "strike" ? "avatar-glow-strike" : "avatar-glow",
      )}
    >
      <img src={src} alt={alt} className="h-full w-full object-cover object-center" loading="lazy" decoding="async" />
    </div>
  );
}

import { ConstituencyCarousel } from "@/components/firm/constituency-carousel";
import { cn } from "@/lib/cn";

export function OsMock({ className }: { className?: string }) {
  return <ConstituencyCarousel className={cn("min-h-80", className)} />;
}

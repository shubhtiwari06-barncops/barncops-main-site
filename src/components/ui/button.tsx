import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex min-h-11 w-full items-center justify-center gap-2 font-medium transition-[opacity,background-color,color,box-shadow] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40 select-none sm:w-auto",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-fg shadow-[var(--shadow-glow)] hover:opacity-90",
        secondary:
          "bg-transparent text-strike shadow-[0_0_0_1px_var(--color-strike)] hover:bg-strike hover:text-fg",
        ghost: "bg-transparent text-muted hover:text-fg hover:bg-elevated",
        accent: "bg-accent text-accent-fg shadow-[var(--shadow-glow)] hover:opacity-90",
        strike: "bg-strike text-fg shadow-[var(--shadow-glow-strike)] hover:opacity-90",
      },
      size: {
        md: "h-11 px-5 text-sm",
        sm: "h-9 px-3.5 text-sm",
        lg: "h-12 px-6 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-[inset_0_1px_0_#ffffff26] hover:bg-[#345fda]",
        accent: "bg-primary text-primary-foreground shadow-[inset_0_1px_0_#ffffff26] hover:bg-[#345fda]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-[#dce5fa]",
        outline: "border border-[#dce5fa] bg-white text-foreground hover:bg-secondary",
        ghost: "text-[#4d5a83] hover:bg-secondary hover:text-[#4574ec]",
        verified: "bg-verified text-verified-foreground",
      },
      size: {
        md: "min-h-11 px-5 text-sm",
        sm: "min-h-11 px-3.5 text-sm",
        lg: "min-h-12 px-6 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };

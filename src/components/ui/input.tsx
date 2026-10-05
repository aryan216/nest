import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-xl border border-input bg-card px-3 text-base text-foreground shadow-sm placeholder:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

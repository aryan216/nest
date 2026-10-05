import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn("min-h-28 w-full rounded-xl border border-input bg-card px-3 py-3 text-base text-foreground shadow-sm", className)}
      {...props}
    />
  );
}

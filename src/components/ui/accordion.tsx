import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FaqAccordion({ items }: { items: { id: string; question: string; answer: string }[] }) {
  return (
    <Accordion.Root type="single" collapsible className="divide-y divide-border rounded-2xl border border-border bg-card">
      {items.map((item) => (
        <Accordion.Item key={item.id} value={item.id} className="px-4 sm:px-6">
          <Accordion.Header>
            <Accordion.Trigger className="group flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left text-base font-semibold">
              {item.question}
              <ChevronDown className="h-5 w-5 shrink-0 transition duration-200 group-data-[state=open]:rotate-180" aria-hidden />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="pb-5 text-sm leading-6 text-muted-foreground">{item.answer}</Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#7a94df]", className)}>
      <span className="h-2 w-2 rounded-full bg-[#4673eb]" aria-hidden />
      {children}
    </p>
  );
}

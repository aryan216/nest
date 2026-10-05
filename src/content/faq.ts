import { brand } from "@/config/brand";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const soon = brand.comingSoonCities.map((city) => city.name).join(", ");

export const faqs: FaqItem[] = [
  {
    id: "buying",
    question: "How do I buy a verified home?",
    answer: `Every public listing in ${brand.city} has been visited by a ${brand.name} inspector. Shortlist a home, send an enquiry, and our desk arranges the visit with you. The price you see is the price the partner has put on record.`,
  },
  {
    id: "brokerage",
    question: "Do buyers pay brokerage?",
    answer: `No. Buyers do not pay brokerage on ${brand.name}. When a partner is paid, that commission is agreed in writing with the partner before the listing goes live. It is not added as a fee for the buyer.`,
  },
  {
    id: "privacy",
    question: "Who can see my phone number?",
    answer: `Your number is shared only with ${brand.name}, never with owners or agents. Partner accounts cannot open enquiry phone numbers. We use the number to confirm the visit and nothing else.`,
  },
  {
    id: "coverage",
    question: "Which cities do you cover?",
    answer: `Verified property is live in ${brand.city} only. ${soon} are coming soon. We do not publish homes for a city we have not launched, and we do not describe this desk as India-wide.`,
  },
  {
    id: "listing",
    question: "I want to list a property. How does that work?",
    answer: `Apply through Become a Partner. There is no joining fee. After the application is accepted, you submit the home with photos and papers. It stays off the public site until an inspector visits and the checklist passes.`,
  },
];

export function faqJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

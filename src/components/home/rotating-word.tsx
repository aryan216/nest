"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ROTATING_WORDS } from "@/config/catalog";

export function RotatingWord() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % ROTATING_WORDS.length);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [reduce]);

  const word = ROTATING_WORDS[reduce ? 0 : index] ?? "Flat";

  return (
    <span className="inline-grid align-bottom text-primary">
      {ROTATING_WORDS.map((item) => (
        <span key={item} className="invisible col-start-1 row-start-1" aria-hidden="true">
          {item}
        </span>
      ))}
      {reduce ? (
        <span className="col-start-1 row-start-1">{word}</span>
      ) : (
        <AnimatePresence mode="wait">
          <motion.span
            key={word}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="col-start-1 row-start-1"
          >
            {word}
          </motion.span>
        </AnimatePresence>
      )}
    </span>
  );
}

"use client";

import Image from "next/image";
import { useState } from "react";
import { BLUR_DATA_URL } from "@/lib/utils";

export function ListingPhoto({
  src,
  alt,
  priority = false,
  sizes,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <div className="absolute inset-0 bg-secondary" role="img" aria-label={alt} />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}

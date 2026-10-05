"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ListingPhoto } from "@/components/property/listing-photo";
import type { ListingImage } from "@/types/domain";

export function PropertyGallery({ images, title }: { images: ListingImage[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const photo = images[index] ?? images[0];
  if (!photo) return <div className="aspect-[4/3] rounded-3xl bg-muted" role="img" aria-label={`${title} photos unavailable`} />;

  const step = (direction: number) => setIndex((current) => (current + direction + images.length) % images.length);

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-4">
        <button type="button" className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted md:col-span-3" onClick={() => setOpen(true)} aria-label={`Open photo of ${title}`}>
          <ListingPhoto src={photo.url} alt={photo.alt} priority sizes="(max-width: 768px) 100vw, 70vw" />
        </button>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
          {images.slice(0, 3).map((image, imageIndex) => (
            <button key={image.url} type="button" className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted" onClick={() => { setIndex(imageIndex); setOpen(true); }} aria-label={`Show photo ${imageIndex + 1} of ${title}`}>
              <ListingPhoto src={image.url} alt="" sizes="20vw" />
            </button>
          ))}
        </div>
      </div>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-foreground/80" />
          <Dialog.Content className="fixed inset-0 z-[80] flex items-center justify-center p-4" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">{title} photos</Dialog.Title>
            <div className="relative aspect-[4/3] w-full max-w-5xl">
              <ListingPhoto src={photo.url} alt={photo.alt} sizes="100vw" />
            </div>
            {images.length > 1 ? (
              <>
                <button type="button" className="absolute left-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-card" aria-label="Previous photo" onClick={() => step(-1)}>
                  <ChevronLeft aria-hidden />
                </button>
                <button type="button" className="absolute right-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-card" aria-label="Next photo" onClick={() => step(1)}>
                  <ChevronRight aria-hidden />
                </button>
              </>
            ) : null}
            <Dialog.Close className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-card" aria-label="Close photos">
              <X aria-hidden />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

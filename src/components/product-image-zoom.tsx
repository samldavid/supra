"use client";

import { useRef } from "react";
import Image from "next/image";
import { Maximize2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ProductImageZoomProps {
  src: string;
  alt: string;
}

export function ProductImageZoom({ src, alt }: ProductImageZoomProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-[0_16px_55px_rgba(55,16,63,.1)] focus-visible:ring-4 focus-visible:ring-ring/20"
        aria-label="Ampliar imagen del producto"
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-2 transition duration-500 group-hover:scale-[1.035]"
          priority
        />
        <span className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-primary shadow-md backdrop-blur">
          <Maximize2 className="size-4" /> Ampliar
        </span>
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto max-h-[94vh] w-[min(94vw,70rem)] rounded-[1.75rem] bg-white p-2 shadow-2xl backdrop:bg-[#210026]/80 backdrop:backdrop-blur-sm"
      >
        <form method="dialog" className="absolute top-5 right-5 z-10">
          <Button type="submit" variant="white" size="icon" aria-label="Cerrar imagen ampliada">
            <X />
          </Button>
        </form>
        <div className="relative h-[min(86vh,52rem)] w-full overflow-hidden rounded-[1.25rem] bg-white">
          <Image src={src} alt={alt} fill sizes="94vw" className="object-contain" />
        </div>
      </dialog>
    </>
  );
}

import Image from "next/image";

import type { ChemicalPictogramCode } from "@/lib/product-safety";
import { cn } from "@/lib/utils";

interface ChemicalHazardPictogramProps {
  code: ChemicalPictogramCode;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "size-9",
  md: "size-12",
  lg: "size-16",
};

const pictogramSources: Record<ChemicalPictogramCode, string> = {
  GHS01: "/pictogramas/ghs/ghs01.png",
  GHS02: "/pictogramas/ghs/ghs02.png",
  GHS03: "/pictogramas/ghs/ghs03.png",
  GHS04: "/pictogramas/ghs/ghs04.png",
  GHS05: "/pictogramas/ghs/ghs05.png",
  GHS06: "/pictogramas/ghs/ghs06.png",
  GHS07: "/pictogramas/ghs/ghs07.png",
  GHS08: "/pictogramas/ghs/ghs08.png",
  GHS09: "/pictogramas/ghs/ghs09.png",
};

export function ChemicalHazardPictogram({
  code,
  label,
  size = "md",
  className,
}: ChemicalHazardPictogramProps) {
  return (
    <Image
      src={pictogramSources[code]}
      alt={label ? `${label} (${code})` : `Pictograma de precaución química (${code})`}
      width={72}
      height={72}
      className={cn("shrink-0 object-contain", sizeClasses[size], className)}
    />
  );
}

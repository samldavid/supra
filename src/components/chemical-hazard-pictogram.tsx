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

function PictogramSymbol({ code }: { code: ChemicalPictogramCode }) {
  switch (code) {
    case "GHS01":
      return (
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
          <circle cx="36" cy="39" r="7" fill="currentColor" />
          <path d="M42 31l7-8M48 31l8-4M27 31l-7-8M24 39h-9M31 48l-6 8M43 48l6 8M36 24v-9" />
          <path d="M49 23l2 6 5-5-6-1z" fill="currentColor" stroke="none" />
        </g>
      );
    case "GHS02":
      return (
        <path
          d="M37 55c-8 0-15-6-15-15 0-7 4-12 10-18 0 5 3 8 6 10 2-5 1-10-1-15 8 5 14 13 14 23 0 9-6 15-14 15z"
          fill="currentColor"
        />
      );
    case "GHS03":
      return (
        <g fill="currentColor">
          <path d="M36 47a12 12 0 1 0 0-24 12 12 0 0 0 0 24zm0-6a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" />
          <path d="M37 57c-8 0-14-5-14-13 0-5 3-9 7-13 0 4 2 6 5 8 2-4 1-8 0-12 7 5 12 10 12 18 0 7-4 12-10 12z" />
        </g>
      );
    case "GHS04":
      return (
        <g fill="none" stroke="currentColor" strokeWidth="5">
          <rect x="18" y="29" width="36" height="16" rx="8" />
          <path d="M24 29v16M48 29v16" />
        </g>
      );
    case "GHS05":
      return (
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
          <path d="M18 50h22M43 50h12M24 41l10 4M47 39l9 4" />
          <path d="M21 26l18 7M44 24l17 7M22 24l19 8M45 22l18 8" />
          <path d="M35 38l-2 5M56 36l-2 5" />
          <path d="M22 52c5 4 12 4 18 0" />
        </g>
      );
    case "GHS06":
      return (
        <g fill="currentColor">
          <path d="M36 18c-9 0-15 6-15 14 0 5 2 8 6 10v7h18v-7c4-2 6-5 6-10 0-8-6-14-15-14zM30 35a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm12 0a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm-9 8 3-5 3 5h-6z" />
          <path d="M21 51 51 61M51 51 21 61" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
        </g>
      );
    case "GHS07":
      return (
        <g fill="currentColor">
          <rect x="32" y="17" width="8" height="30" rx="4" />
          <circle cx="36" cy="55" r="5" />
        </g>
      );
    case "GHS08":
      return (
        <g fill="currentColor">
          <circle cx="36" cy="20" r="8" />
          <path d="M20 57c2-16 9-25 16-25s14 9 16 25H20z" />
          <path d="m36 37 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" fill="white" />
        </g>
      );
    case "GHS09":
      return (
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
          <path d="M20 51c10-7 24-7 34 0M18 56h37" />
          <path d="M33 46V22M33 36l-11-8M33 33l11-10" />
          <path d="M21 28c3 1 6 3 9 8M46 23c-3 3-6 6-13 9" />
          <path d="M42 48c5-7 10-8 14-3-3 5-8 6-14 3z" />
        </g>
      );
  }
}

export function ChemicalHazardPictogram({
  code,
  label,
  size = "md",
  className,
}: ChemicalHazardPictogramProps) {
  return (
    <svg
      viewBox="0 0 72 72"
      role="img"
      aria-label={label ? `${label} (${code})` : code}
      className={cn("shrink-0 text-black", sizeClasses[size], className)}
    >
      <rect
        x="12"
        y="12"
        width="48"
        height="48"
        transform="rotate(45 36 36)"
        fill="white"
        stroke="#d71920"
        strokeWidth="5"
      />
      <PictogramSymbol code={code} />
    </svg>
  );
}

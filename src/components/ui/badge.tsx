import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold",
  {
    variants: {
      variant: {
        default: "border-primary/10 bg-primary/8 text-primary",
        accent: "border-accent/30 bg-accent/18 text-[#5a4000]",
        outline: "border-border bg-background text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

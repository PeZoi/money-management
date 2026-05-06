import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium leading-none whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-transparent text-foreground",
        /** Workspace owner — nhấn mạnh màu chủ đạo */
        owner: "border-primary/35 bg-primary/12 text-primary",
        admin: "border-blue-500/35 bg-blue-500/10 text-blue-700 dark:text-blue-300",
        member: "border-border bg-muted/90 text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

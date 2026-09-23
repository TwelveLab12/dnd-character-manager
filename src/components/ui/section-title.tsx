import * as React from "react";
import { cn } from "cn";

function SectionTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="section-title"
      className={cn("font-heading text-lg font-medium", className)}
      {...props}
    />
  );
}

export { SectionTitle };

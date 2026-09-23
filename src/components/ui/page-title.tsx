import * as React from "react";
import { cn } from "cn";

function PageTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="page-title"
      className={cn("font-heading text-2xl font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export { PageTitle };

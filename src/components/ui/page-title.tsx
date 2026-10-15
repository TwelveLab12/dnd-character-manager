import * as React from "react";
import { cn } from "cn";

function PageTitle({ className, children, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="page-title"
      className={cn("font-heading text-2xl font-semibold tracking-tight", className)}
      {...props}
    >
      {children}
    </h1>
  );
}

export { PageTitle };

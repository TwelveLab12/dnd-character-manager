import type { ZodError } from "zod";

/** Messages d'erreur zod, un par problème, préfixés du chemin du champ concerné. */
export function humanizeZodError(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join(".") || "(racine)";
    return `${path} : ${issue.message}`;
  });
}

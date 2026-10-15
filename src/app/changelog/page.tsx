import type { Metadata } from "next";
import { ChangelogPage } from "@/features/changelog/changelog-page";
import { PageMain } from "@/features/shared/main-landmark";

export const metadata: Metadata = { title: "Nouveautés" };

export default function Changelog() {
  return (
    <PageMain>
      <ChangelogPage />
    </PageMain>
  );
}

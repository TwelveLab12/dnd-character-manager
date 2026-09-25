import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Version du service worker hors ligne (`/sw.js?v=…`, voir docs/adr/0045) : un identifiant par
    // déploiement, pour que chaque build reparte de caches neufs.
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA ?? Date.now().toString(36),
  },
};

export default nextConfig;

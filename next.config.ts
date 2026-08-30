import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // A package-lock.json exists in a parent folder; pin the workspace root to
  // this project so Next doesn't infer the wrong one.
  turbopack: { root: projectRoot },
  // Static export so the whole site can be deployed to Cloudflare Pages as
  // plain static assets (output in `out/`). No backend required.
  output: "export",
  // Required for `next/image` when using static export (no image optimization server).
  images: {
    unoptimized: true,
    // Placeholder cover art is shipped as local SVG; allow it through next/image.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
  },
  // Clean URLs as directories (e.g. /experiences/ -> /experiences/index.html),
  // which plays nicely with static hosting on Cloudflare Pages.
  trailingSlash: true,
};

export default nextConfig;

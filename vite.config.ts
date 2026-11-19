// vite.config.ts
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile(),
    {
      name: "open-archive-preview-assets",
      transformIndexHtml: {
        order: "post",
        handler(html) {
          const domain =
            process.env.SITE_URL ||
            process.env.VERCEL_PROJECT_PRODUCTION_URL ||
            process.env.VERCEL_URL;

          const origin = domain
            ? new URL(
                /^https?:\/\//i.test(domain) ? domain : `https://${domain}`
              ).origin
            : "";

          return html
            .replace('href="./favicon.ico?', 'href="/favicon.ico?')
            .replace(
              /content="\.?\/open-archive-og\.png"/g,
              `content="${origin}/open-archive-og.png"`
            );
        },
      },
    },
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

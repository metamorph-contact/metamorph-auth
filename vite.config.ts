import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

const release = JSON.parse(
  readFileSync(new URL('./catalog/identity-ui-release.development.json', import.meta.url), 'utf8'),
) as { scriptSha256: string[] }

const securityHeaders = (development: boolean) => ({
  "Cache-Control": "no-store",
  "Pragma": "no-cache",
  "Expires": "0",
  "Content-Security-Policy": [
    "default-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    `script-src 'self'${development
      ? " 'unsafe-inline'"
      : release.scriptSha256.map((hash) => ` '${hash}'`).join('')}`,
    `style-src-elem 'self'${development ? " 'unsafe-inline'" : ''}`,
    "style-src-attr 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data: blob: http://assets.identity.localhost:1422",
    "connect-src 'self' http://local-a.controller.identity.localhost:1423 http://local-a.api.identity.localhost:1424 ws://auth.identity.localhost:1422",
  ].join("; "),
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-site",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), browsing-topics=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
});

export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  server: {
    host: "auth.identity.localhost",
    port: 1422,
    strictPort: true,
    // Vite's React refresh preamble is inline in development only. Production
    // scripts remain external/hash-pinnable; component style attributes have a
    // separate CSP3 allowance and cannot execute script.
    headers: securityHeaders(command === 'serve'),
  },
  preview: {
    host: "auth.identity.localhost",
    port: 1422,
    strictPort: true,
    headers: securityHeaders(false),
  },
  build: {
    sourcemap: false,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/ajv') || id.includes('/node_modules/ajv-formats')) return 'protocol-validation'
          if (id.includes('/node_modules/react-aria') || id.includes('/node_modules/react-stately') ||
              id.includes('/node_modules/@internationalized/') || id.includes('/node_modules/@radix-ui/react-select') ||
              id.includes('/node_modules/@radix-ui/react-popover') || id.includes('/node_modules/@radix-ui/react-slider')) return 'signup-controls'
          if (id.includes('/polymorph/packages/ui/src/identity-signup') ||
              id.includes('/polymorph/packages/ui/src/controls/ColorInput') ||
              id.includes('/polymorph/packages/ui/src/controls/ImageEditor') ||
              id.includes('/polymorph/packages/ui/src/controls/Select') ||
              id.includes('/polymorph/packages/ui/src/controls/Slider') ||
              id.includes('/polymorph/packages/ui/src/overlays/Popover') ||
              id.includes('/polymorph/packages/ui/src/overlays/sheet')) return 'signup-controls'
          if (id.includes('/polymorph/packages/')) return 'polymorph'
          if (id.includes('/node_modules/@tanstack/')) return 'router'
          if (id.includes('/node_modules/react') || id.includes('/node_modules/scheduler')) return 'react'
          return undefined
        },
      },
    },
  },
}));

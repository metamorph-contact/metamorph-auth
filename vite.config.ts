import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = dirname(fileURLToPath(import.meta.url));
const deploymentCatalog = JSON.parse(
  readFileSync(resolve(repositoryRoot, '../metamorph-saas/config/central-identity/identity-catalog.development.json'), 'utf8'),
) as { catalogVersion: string }
const publicationRoot = resolve(repositoryRoot, 'catalog/publication', deploymentCatalog.catalogVersion)

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

function catalogPublication(): Plugin {
  const installMiddleware = (middlewares: { use: (handler: (request: { url?: string; headers: { host?: string } }, response: { setHeader: (name: string, value: string) => void; statusCode: number; end: (body?: string | Buffer) => void }, next: () => void) => void) => void }) => {
    middlewares.use((request, response, next) => {
      const pathname = new URL(request.url ?? '/', 'http://auth.identity.localhost').pathname
      if (request.headers.host === 'assets.identity.localhost:1422' && pathname.startsWith('/auth-assets/')) {
        response.setHeader('Access-Control-Allow-Origin', 'http://auth.identity.localhost:1422')
        response.setHeader('Vary', 'Origin')
      }
      if (!pathname.includes('/auth-catalogs/') && !pathname.startsWith('/auth-keysets/')) {
        next()
        return
      }
      let decoded: string
      try {
        decoded = decodeURIComponent(pathname)
      } catch {
        response.statusCode = 400
        response.end()
        return
      }
      const path = resolve(publicationRoot, `.${decoded}`)
      if (!path.startsWith(`${publicationRoot}${sep}`) || !existsSync(path) || !statSync(path).isFile()) {
        response.statusCode = 404
        response.end()
        return
      }
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('Cache-Control', 'no-store')
      response.setHeader('X-Content-Type-Options', 'nosniff')
      response.end(readFileSync(path))
    })
  }
  return {
    name: 'metamorph-signed-catalog-publication',
    configureServer(server) { installMiddleware(server.middlewares) },
    configurePreviewServer(server) { installMiddleware(server.middlewares) },
    writeBundle(options) {
      const outputRoot = resolve(repositoryRoot, options.dir ?? 'dist')
      const localeDirectories = readdirSync(publicationRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && existsSync(resolve(publicationRoot, entry.name, 'auth-catalogs')))
        .map((entry) => entry.name)
      for (const directory of [...localeDirectories, 'auth-keysets']) {
        const target = resolve(outputRoot, directory)
        rmSync(target, { recursive: true, force: true })
        cpSync(resolve(publicationRoot, directory), target, { recursive: true, errorOnExist: true })
      }
    },
  }
}

export default defineConfig(({ command }) => ({
  plugins: [catalogPublication(), react()],
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

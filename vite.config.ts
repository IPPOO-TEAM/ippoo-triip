import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Résout les imports virtuels `figma:asset/<hash>.png` (spécifiques au build
// Figma Make) vers les fichiers réels du dossier /assets, afin qu'un build Vite
// standard (Cloudflare Pages, etc.) fonctionne de façon autonome.
function figmaAssetResolver() {
  const PREFIX = 'figma:asset/'
  return {
    name: 'figma-asset-resolver',
    enforce: 'pre' as const,
    resolveId(id: string) {
      if (id.startsWith(PREFIX)) {
        return path.resolve(__dirname, 'assets', id.slice(PREFIX.length))
      }
      return null
    },
  }
}

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(self), camera=(self), microphone=()',
    },
  },

  build: {
    rollupOptions: {
      output: {
        // Ensure service workers and manifest are not hashed
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.json')) return '[name][extname]';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
})

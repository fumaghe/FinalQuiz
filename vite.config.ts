import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  /* ------------------------------------------------------------------ */
  /* Server (sviluppo)                                                   */
  /* ------------------------------------------------------------------ */
  server: {
    host: '::', // ascolta su tutte le interfacce IPv4/IPv6
    port: 8080,
  },

  /* ------------------------------------------------------------------ */
  /* Base URL                                                            */
  /*  - '/'           in dev (vite dev)                                  */
  /*  - '/FinalQuiz/' in build deployata su GitHub Pages                 */
  /* ------------------------------------------------------------------ */
  base: mode === 'development' ? '/' : '/FinalQuiz/',

  /* ------------------------------------------------------------------ */
  /* Plugin React SWC + tagger in dev                                    */
  /* ------------------------------------------------------------------ */
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),

  /* ------------------------------------------------------------------ */
  /* Alias import "@/…" → src/…                                          */
  /* ------------------------------------------------------------------ */
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  /* ------------------------------------------------------------------ */
  /* Build                                                               */
  /*  - sourcemap: true  → genera mappe sorgente per debug in prod       */
  /*  - outDir: 'dist'   → cartella default, indicata anche nello script */
  /* ------------------------------------------------------------------ */
  build: {
    sourcemap: true,
    outDir: 'dist',
  },
}));

import { defineConfig } from 'vite';

// Relative base so the same build works at /kankakombat/, /KankaKombat/ or any other path.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', assetsInlineLimit: 0, sourcemap: false, target: 'es2020' },
  server: { port: 5173 },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
} as any);

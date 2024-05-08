import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['cjs', 'esm'], // Build for commonJS and ESmodules
  dts: 'src/index.ts', // Generate declaration file (.d.ts)
  splitting: false,
  sourcemap: false,
  clean: true,
  bundle: true,
  shims: true,
  silent: false,
  minify: true,
  keepNames: true,
  platform: 'node',
  target: 'node20',
  external: ['@povio/scaffold']
});

import fs from 'node:fs';
import { defineConfig } from 'tsup';

const version = JSON.parse(fs.readFileSync('package.json', 'utf-8')).version;

export default defineConfig({
  entry: ['src/*.ts', 'src/plugins/*.ts'],
  // Build for commonJS and ESmodules
  format: ['cjs'],
  // Generate declaration file (.d.ts)
  dts: {
    resolve: ['src/*', 'src/plugins/*'],
  },
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
  external: ['@povio/scaffold'],
  define: {
    'process.env.SCAFFOLD_VERSION': `"${version}"`,
  },
});

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/*.ts',
    'src/plugins/*.ts',
  ],
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
  external: ['@povio/scaffold']
});

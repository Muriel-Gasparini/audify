import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['dist/content.js', 'dist/popup.js'],
  bundle: true,
  outdir: 'dist',
  platform: 'browser',
  target: 'es2020',
  allowOverwrite: true,
  format: 'iife',
  logLevel: 'info',
};

if (isWatch) {
  const context = await esbuild.context(buildOptions);
  await context.watch();
  console.log(`⚡ Watching for changes... (v${packageJson.version})`);
} else {
  await esbuild.build(buildOptions);
  console.log(`✅ Build completo! (v${packageJson.version})`);
}

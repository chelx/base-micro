#!/usr/bin/env ts-node

/**
 * generate:app — Sinh một microservice NestJS mới hoàn chỉnh trong apps/
 *
 * Usage:
 *   npx ts-node tools/generators/generate-app.ts --name=<name> [--port=<port>]
 *
 * Examples:
 *   npx ts-node tools/generators/generate-app.ts --name=auth-service
 *   npx ts-node tools/generators/generate-app.ts --name=user-service --port=3002
 *   npm run generate:app -- --name=notification-service --port=3003
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { parseArgs, buildContext, renderTemplate, ensureDir } from './utils';

/**
 * Chạy Prettier để format lại tất cả file vừa generate.
 */
function formatGenerated(files: string[]): void {
  const filePaths = files.join(' ');
  try {
    execSync(`npx prettier --write ${filePaths}`, {
      stdio: 'pipe',
      cwd: path.resolve(__dirname, '..', '..'),
    });
  } catch {
    console.warn('⚠️  Prettier formatting skipped (prettier not available)');
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args['name']) {
    console.error('❌ Missing required argument: --name=<app-name>');
    console.error(
      'Usage: npm run generate:app -- --name=auth-service [--port=3001]',
    );
    process.exit(1);
  }

  const port = args['port'] || '3001';
  const context = buildContext(args['name'], { port });

  const appDir = path.resolve(__dirname, '..', '..', 'apps', context.name);

  // ── Guard: Ngăn ghi đè app đã tồn tại ──
  if (fs.existsSync(appDir)) {
    console.error(
      `❌ App "${context.name}" already exists at apps/${context.name}/`,
    );
    process.exit(1);
  }

  console.log(`\n🚀 Generating microservice: ${context.className}`);
  console.log(`   Target: apps/${context.name}/`);
  console.log(`   Port:   ${port}\n`);

  const templateDir = path.resolve(__dirname, 'templates', 'app');
  const generated: string[] = [];

  // ── Root config files ──
  const rootTemplates = [
    { template: 'project.json.ejs', output: 'project.json' },
    { template: 'webpack.config.js.ejs', output: 'webpack.config.js' },
    { template: 'tsconfig.json.ejs', output: 'tsconfig.json' },
    { template: 'tsconfig.app.json.ejs', output: 'tsconfig.app.json' },
  ];

  for (const { template, output } of rootTemplates) {
    const out = await renderTemplate(
      path.join(templateDir, template),
      path.join(appDir, output),
      context,
    );
    generated.push(out);
  }

  // ── Source files ──
  const srcTemplates = [
    { template: 'src/main.ts.ejs', output: 'src/main.ts' },
    { template: 'src/app/app.module.ts.ejs', output: 'src/app/app.module.ts' },
    {
      template: 'src/app/app.controller.ts.ejs',
      output: 'src/app/app.controller.ts',
    },
    {
      template: 'src/app/app.service.ts.ejs',
      output: 'src/app/app.service.ts',
    },
  ];

  for (const { template, output } of srcTemplates) {
    const out = await renderTemplate(
      path.join(templateDir, template),
      path.join(appDir, output),
      context,
    );
    generated.push(out);
  }

  // ── Tạo thư mục assets với .gitkeep (webpack cần ít nhất 1 file) ──
  const assetsDir = path.join(appDir, 'src', 'assets');
  ensureDir(assetsDir);
  fs.writeFileSync(path.join(assetsDir, '.gitkeep'), '', 'utf-8');

  // ── Auto-format bằng Prettier ──
  console.log('🎨 Formatting generated files...');
  formatGenerated(generated);

  console.log('✅ Generated files:');
  generated.forEach((f) =>
    console.log(`   → ${path.relative(process.cwd(), f)}`),
  );
  console.log(`\n💡 Run: npx nx serve ${context.name}\n`);
}

main().catch((err) => {
  console.error('❌ Generation failed:', err.message);
  process.exit(1);
});

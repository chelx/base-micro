#!/usr/bin/env ts-node

/**
 * generate:api — Sinh module NestJS chuẩn (Controller + Service + Module)
 *
 * Usage:
 *   npx ts-node tools/generators/generate-api.ts --name=<name> [--app=<app>]
 *
 * Examples:
 *   npx ts-node tools/generators/generate-api.ts --name=task --app=sample-api
 *   npm run generate:api -- --name=user-profile
 */

import * as path from 'path';
import { parseArgs, buildContext, renderAllTemplates } from './utils';

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args['name']) {
    console.error('❌ Missing required argument: --name=<module-name>');
    console.error(
      'Usage: npx ts-node tools/generators/generate-api.ts --name=task [--app=sample-api]',
    );
    process.exit(1);
  }

  const appName = args['app'] || 'sample-api';
  const context = buildContext(args['name']);

  const templateDir = path.resolve(__dirname, 'templates', 'api');
  const outputDir = path.resolve(
    __dirname,
    '..',
    '..',
    'apps',
    appName,
    'src',
    context.name,
  );

  console.log(`\n🚀 Generating API module: ${context.className}`);
  console.log(`   Target: apps/${appName}/src/${context.name}/\n`);

  const files = await renderAllTemplates(templateDir, outputDir, context);

  console.log('✅ Generated files:');
  files.forEach((f) => console.log(`   → ${path.relative(process.cwd(), f)}`));
  console.log(
    `\n💡 Don't forget to import ${context.className}Module in AppModule!\n`,
  );
}

main().catch((err) => {
  console.error('❌ Generation failed:', err.message);
  process.exit(1);
});

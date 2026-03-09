#!/usr/bin/env ts-node

/**
 * generate:worker — Sinh module xử lý sự kiện Kafka (Consumer pattern)
 *
 * Usage:
 *   npx ts-node --project tools/generators/tsconfig.json tools/generators/generate-worker.ts --name=<name> [--app=<app>]
 */

import * as path from 'path';
import { parseArgs, buildContext, renderAllTemplates } from './utils';

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args['name']) {
    console.error('❌ Missing required argument: --name=<worker-name>');
    console.error(
      'Usage: npm run generate:worker -- --name=order-processor [--app=sample-api]',
    );
    process.exit(1);
  }

  const appName = args['app'] || 'sample-api';
  const context = buildContext(args['name']);

  const templateDir = path.resolve(__dirname, 'templates', 'worker');
  const outputDir = path.resolve(
    __dirname,
    '..',
    '..',
    'apps',
    appName,
    'src',
    context.name,
  );

  console.log(`\n🚀 Generating Worker module: ${context.className}`);
  console.log(`   Target: apps/${appName}/src/${context.name}/\n`);

  const files = await renderAllTemplates(templateDir, outputDir, context);

  console.log('✅ Generated files:');
  files.forEach((f) => console.log(`   → ${path.relative(process.cwd(), f)}`));
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Import ${context.className}Module in AppModule`);
  console.log(`   2. Configure Kafka microservice transport in main.ts\n`);
}

main().catch((err) => {
  console.error('❌ Generation failed:', err.message);
  process.exit(1);
});

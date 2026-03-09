import * as fs from 'fs';
import * as path from 'path';
import * as ejs from 'ejs';

// ─── String Helpers ────────────────────────────────────────────

/** "user-profile" → "UserProfile" */
export function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/** "UserProfile" → "user-profile" */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/** "user-profile" → "userProfile" */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// ─── File Operations ───────────────────────────────────────────

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export interface TemplateContext {
  name: string; // kebab-case: "user-profile"
  className: string; // PascalCase: "UserProfile"
  propertyName: string; // camelCase:  "userProfile"
  [key: string]: unknown;
}

export function buildContext(
  name: string,
  extra: Record<string, unknown> = {},
): TemplateContext {
  const kebab = toKebabCase(name);
  return {
    name: kebab,
    className: toPascalCase(kebab),
    propertyName: toCamelCase(kebab),
    ...extra,
  };
}

/**
 * Render một EJS template file và ghi ra đĩa.
 * @param templatePath – đường dẫn tuyệt đối tới file .ejs
 * @param outputPath   – đường dẫn tuyệt đối tới file output
 * @param context      – data object truyền vào template
 */
export async function renderTemplate(
  templatePath: string,
  outputPath: string,
  context: TemplateContext,
): Promise<string> {
  const template = fs.readFileSync(templatePath, 'utf-8');
  const content = ejs.render(template, context);
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, content, 'utf-8');
  return outputPath;
}

/**
 * Render tất cả templates trong một thư mục,
 * ghi output sang thư mục đích theo naming convention.
 */
export async function renderAllTemplates(
  templateDir: string,
  outputDir: string,
  context: TemplateContext,
): Promise<string[]> {
  const files = fs.readdirSync(templateDir).filter((f) => f.endsWith('.ejs'));
  const results: string[] = [];

  for (const file of files) {
    // "controller.ts.ejs" → "<name>.controller.ts"
    const outputName = file
      .replace('.ejs', '')
      .replace(/^/, `${context.name}.`);
    const outputPath = path.join(outputDir, outputName);
    await renderTemplate(path.join(templateDir, file), outputPath, context);
    results.push(outputPath);
  }

  return results;
}

// ─── CLI Arg Parser (minimal) ──────────────────────────────────

export function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (const arg of argv) {
    const match = arg.match(/^--(\w[\w-]*)=(.+)$/);
    if (match) {
      args[match[1]] = match[2];
    }
  }
  return args;
}

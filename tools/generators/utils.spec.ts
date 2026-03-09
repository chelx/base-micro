import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  toPascalCase,
  toKebabCase,
  toCamelCase,
  buildContext,
  renderTemplate,
  renderAllTemplates,
  parseArgs,
  ensureDir,
} from './utils';

describe('String Helpers', () => {
  describe('toPascalCase', () => {
    it('converts kebab-case', () =>
      expect(toPascalCase('user-profile')).toBe('UserProfile'));
    it('converts snake_case', () =>
      expect(toPascalCase('user_profile')).toBe('UserProfile'));
    it('converts single word', () => expect(toPascalCase('user')).toBe('User'));
    it('converts multi-segment', () =>
      expect(toPascalCase('my-complex-name')).toBe('MyComplexName'));
  });

  describe('toKebabCase', () => {
    it('converts PascalCase', () =>
      expect(toKebabCase('UserProfile')).toBe('user-profile'));
    it('converts camelCase', () =>
      expect(toKebabCase('userProfile')).toBe('user-profile'));
    it('keeps kebab-case', () =>
      expect(toKebabCase('user-profile')).toBe('user-profile'));
    it('converts spaces', () =>
      expect(toKebabCase('User Profile')).toBe('user-profile'));
  });

  describe('toCamelCase', () => {
    it('converts kebab-case', () =>
      expect(toCamelCase('user-profile')).toBe('userProfile'));
    it('converts single word', () => expect(toCamelCase('user')).toBe('user'));
  });
});

describe('buildContext', () => {
  it('builds correct context from kebab input', () => {
    const ctx = buildContext('user-profile');
    expect(ctx.name).toBe('user-profile');
    expect(ctx.className).toBe('UserProfile');
    expect(ctx.propertyName).toBe('userProfile');
  });

  it('builds correct context from PascalCase input', () => {
    const ctx = buildContext('UserProfile');
    expect(ctx.name).toBe('user-profile');
    expect(ctx.className).toBe('UserProfile');
    expect(ctx.propertyName).toBe('userProfile');
  });

  it('merges extra properties', () => {
    const ctx = buildContext('task', { tableName: 'tasks' });
    expect(ctx.tableName).toBe('tasks');
  });
});

describe('renderTemplate', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('renders EJS template and writes to file', async () => {
    const templatePath = path.join(tmpDir, 'test.ts.ejs');
    fs.writeFileSync(templatePath, 'export class <%= className %>Service {}');

    const outputPath = path.join(tmpDir, 'out', 'test.service.ts');
    const ctx = buildContext('user');

    await renderTemplate(templatePath, outputPath, ctx);

    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.readFileSync(outputPath, 'utf-8')).toBe(
      'export class UserService {}',
    );
  });
});

describe('renderAllTemplates', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-all-'));
    fs.writeFileSync(
      path.join(tmpDir, 'controller.ts.ejs'),
      'class <%= className %>Controller {}',
    );
    fs.writeFileSync(
      path.join(tmpDir, 'service.ts.ejs'),
      'class <%= className %>Service {}',
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('renders all .ejs files with correct naming', async () => {
    const outDir = path.join(tmpDir, 'output');
    const ctx = buildContext('task');
    const files = await renderAllTemplates(tmpDir, outDir, ctx);

    expect(files).toHaveLength(2);
    expect(fs.existsSync(path.join(outDir, 'task.controller.ts'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'task.service.ts'))).toBe(true);
  });
});

describe('parseArgs', () => {
  it('parses --key=value args', () => {
    expect(parseArgs(['--name=user', '--app=sample-api'])).toEqual({
      name: 'user',
      app: 'sample-api',
    });
  });

  it('ignores invalid args', () => {
    expect(parseArgs(['something', '--name=user', '-v'])).toEqual({
      name: 'user',
    });
  });
});

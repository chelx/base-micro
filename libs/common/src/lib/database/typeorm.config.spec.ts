import { createTypeOrmConfig } from './typeorm.config';

describe('createTypeOrmConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should use provided options over env variables', () => {
    process.env['DB_HOST'] = 'env-host';
    process.env['DB_PORT'] = '1111';

    const config = createTypeOrmConfig({
      host: 'opt-host',
      port: 2222,
    }) as any;

    expect(config.host).toBe('opt-host');
    expect(config.port).toBe(2222);
  });

  it('should fallback to env variables when options not provided', () => {
    process.env['DB_HOST'] = 'env-host';
    process.env['DB_PORT'] = '1111';

    const config = createTypeOrmConfig({}) as any;

    expect(config.host).toBe('env-host');
    expect(config.port).toBe(1111);
  });

  it('should fallback to defaults when nothing is provided', () => {
    delete process.env['DB_HOST'];
    delete process.env['DB_PORT'];
    delete process.env['DB_USERNAME'];
    delete process.env['DB_PASSWORD'];
    delete process.env['DB_NAME'];

    const config = createTypeOrmConfig({}) as any;

    expect(config.host).toBe('localhost');
    expect(config.port).toBe(5432);
    expect(config.username).toBe('postgres');
    expect(config.password).toBe('postgres');
    expect(config.database).toBe('postgres');
  });

  it('should set synchronize to false in production by default', () => {
    process.env['NODE_ENV'] = 'production';
    const config = createTypeOrmConfig({}) as any;
    expect(config.synchronize).toBe(false);
    expect(config.logging).toBe(false);
  });
});

import { BaseLogger } from './base-logger.service';

jest.mock('pino', () => {
  return {
    pino: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
    }),
  };
});

describe('BaseLogger', () => {
  let logger: BaseLogger;

  beforeEach(() => {
    logger = new BaseLogger();
  });

  it('should be defined', () => {
    expect(logger).toBeDefined();
  });

  it('should call info on log', () => {
    logger.log('test log', 'context');
    // Using any to forcefully access private property for test verification
    expect((logger as any).logger.info).toHaveBeenCalledWith(
      { context: 'context' },
      'test log',
    );
  });

  it('should call error on error', () => {
    logger.error('test error', 'stack trace', 'context');
    expect((logger as any).logger.error).toHaveBeenCalledWith(
      { context: 'context', trace: 'stack trace' },
      'test error',
    );
  });
});

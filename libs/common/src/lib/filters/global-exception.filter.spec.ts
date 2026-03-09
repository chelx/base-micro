import { GlobalExceptionFilter } from './global-exception.filter';
import { BaseLogger } from '../logger/base-logger.service';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BusinessErrorCode } from 'interfaces';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockLogger: jest.Mocked<BaseLogger>;

  beforeEach(() => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;
    filter = new GlobalExceptionFilter(mockLogger);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should catch unhandled exceptions', () => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = jest.fn().mockReturnValue({
      status: mockStatus,
    });
    const mockGetRequest = jest.fn().mockReturnValue({
      url: '/test',
      method: 'GET',
    });
    const mockHttpArgumentsHost = jest.fn().mockReturnValue({
      getResponse: mockGetResponse,
      getRequest: mockGetRequest,
    });
    const mockArgumentsHost = {
      switchToHttp: mockHttpArgumentsHost,
    } as unknown as ArgumentsHost;

    const exception = new Error('Test error');
    filter.catch(exception, mockArgumentsHost);

    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: BusinessErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      }),
    );
  });

  it('should catch HttpExceptions', () => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = jest.fn().mockReturnValue({
      status: mockStatus,
    });
    const mockGetRequest = jest.fn().mockReturnValue({
      url: '/test',
      method: 'GET',
    });
    const mockHttpArgumentsHost = jest.fn().mockReturnValue({
      getResponse: mockGetResponse,
      getRequest: mockGetRequest,
    });
    const mockArgumentsHost = {
      switchToHttp: mockHttpArgumentsHost,
    } as unknown as ArgumentsHost;

    const exception = new HttpException(
      'Bad Request Test',
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: BusinessErrorCode.BAD_REQUEST,
        message: 'Bad Request Test',
      }),
    );
  });
});

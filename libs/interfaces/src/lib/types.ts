export enum BusinessErrorCode {
  SUCCESS = 200,

  // Client Errors (4xx)
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,

  // Server Errors (5xx)
  INTERNAL_SERVER_ERROR = 500,

  // Custom Business Errors (1000+)
  USER_NOT_FOUND = 1001,
  USER_ALREADY_EXISTS = 1002,
  INVALID_CREDENTIALS = 1003,
  TOKEN_EXPIRED = 1004,
  FILE_UPLOAD_FAILED = 2001,
}

export interface BaseResponseDTO<T = any> {
  statusCode: number;
  message: string;
  data?: T;
  errorCode?: BusinessErrorCode;
}

export interface PaginationDTO {
  page: number;
  limit: number;
  total?: number;
}

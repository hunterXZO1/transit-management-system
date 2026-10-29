export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const DB_MESSAGES = {
  ER_DUP_ENTRY: () => ({ status: 409, message: 'A record with this unique value already exists.' }),
  ER_ROW_IS_REFERENCED_2: () => ({ status: 409, message: 'This record is referenced by other records and cannot be deleted.' }),
  ER_NO_REFERENCED_ROW_2: () => ({ status: 400, message: 'Referenced record does not exist.' }),
  ER_BAD_NULL_ERROR: () => ({ status: 400, message: 'A required field is missing.' }),
  ER_DATA_TOO_LONG: () => ({ status: 400, message: 'A field value is longer than the column allows.' }),
  ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: () => ({ status: 400, message: 'A field value has the wrong type or an unsupported enum value.' }),
  WARN_DATA_OUT_OF_RANGE: () => ({ status: 400, message: 'A numeric value is out of range.' }),
};

export function toApiError(err) {
  if (err instanceof ApiError) return err;
  const mapper = DB_MESSAGES[err.code];
  if (mapper) {
    const { status, message } = mapper();
    return new ApiError(status, message, err.sqlMessage);
  }
  return new ApiError(500, err.sqlMessage || err.message || 'Unexpected server error.');
}

export function sendJson(res, status, body) {
  res.status(status).json({ success: status < 400, ...body });
}

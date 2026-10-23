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

const NEO4J_OFFLINE_CODES = [
  'ServiceUnavailable',
  'Neo.TransientError.General.DatabaseUnavailable',
  'ECONNREFUSED',
  'UND_ERR_CONNECT_TIMEOUT',
  'UNAVAILABLE',
];

// Neo4j outages must never be reported as a MySQL failure: the relational API
// keeps serving CRUD while the graph layer degrades to 503.
function neo4jError(err) {
  const isNeo4j = err.name === 'Neo4jError' || String(err.code || '').startsWith('Neo.');
  if (!isNeo4j && !NEO4J_OFFLINE_CODES.includes(err.code)) return null;
  if (NEO4J_OFFLINE_CODES.includes(err.code) || /Failed to connect/i.test(err.message)) {
    return new ApiError(503, 'The Neo4j graph database is unavailable. MySQL CRUD is unaffected.', err.message);
  }
  if (String(err.code || '').startsWith('Neo.ClientError.Security')) {
    return new ApiError(503, 'Neo4j rejected the configured credentials. Check NEO4J_USER and NEO4J_PASSWORD.', err.message);
  }
  return null;
}

export function toApiError(err) {
  if (err instanceof ApiError) return err;
  const graphError = neo4jError(err);
  if (graphError) return graphError;
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

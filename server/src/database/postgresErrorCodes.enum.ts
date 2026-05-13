export enum PostgresErrorCode {
  // Data integrity
  UniqueViolation = '23505', // duplicate key
  ForeignKeyViolation = '23503', // invalid FK reference
  NotNullViolation = '23502', // null in non-null column
  CheckViolation = '23514', // check constraint failed

  // Query/runtime issues
  NoDataFound = 'P0002', // no rows found (functions/procedures)
  UndefinedColumn = '42703', // column does not exist
  UndefinedTable = '42P01', // table does not exist
  InvalidTextRepresentation = '22P02', // invalid input (e.g., UUID format)

  // Connection / system
  ConnectionException = '08000',
  ConnectionFailure = '08006',

  // Optional but useful
  DeadlockDetected = '40P01',
  SerializationFailure = '40001',
}

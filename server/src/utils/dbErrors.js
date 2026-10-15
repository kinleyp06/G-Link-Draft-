// Turns low-level MySQL / network errors into plain words.

const MESSAGES = {
  ECONNREFUSED:
    'Cannot reach MySQL: the connection was refused. Is the MySQL server running, and are DB_HOST and DB_PORT in server/.env correct?',
  ENOTFOUND:
    'Cannot find the database host. Check DB_HOST in server/.env.',
  ER_ACCESS_DENIED_ERROR:
    'MySQL refused the login. Check DB_USER and DB_PASSWORD in server/.env.',
  ER_DBACCESS_DENIED_ERROR:
    'This MySQL login has no access to that database. Check DB_NAME in server/.env and that your login was granted access to g_link.',
  ER_BAD_DB_ERROR:
    'The database does not exist. Check DB_NAME in server/.env, or run database/schema/00_create_database.sql.',
  ETIMEDOUT:
    'Connecting to MySQL took too long. Check DB_HOST and DB_PORT in server/.env and that the server is reachable.',
};

export function describeDbError(err) {
  const code = err?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  return `Could not connect to the database${code ? ` (${code})` : ''}.`;
}

export { MESSAGES as DB_ERROR_MESSAGES };

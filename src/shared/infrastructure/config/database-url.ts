export interface DatabaseConnection {
  DB_HOST: string;
  DB_PORT: number | string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
}

export function databaseUrl(connection: DatabaseConnection): string {
  const user = encodeURIComponent(connection.DB_USER);
  const password = encodeURIComponent(connection.DB_PASSWORD);
  const { DB_HOST, DB_PORT, DB_NAME } = connection;
  return `postgresql://${user}:${password}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`;
}

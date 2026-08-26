import { DataSourceOptions } from "typeorm";
import { ALL_ENTITIES } from "./entities";
import { ALL_MIGRATIONS } from "./migrations";

/** Minimal shape both the NestJS ConfigService and plain process.env satisfy. */
export interface DbEnv {
  DB_TYPE?: string;
  DB_SQLITE_PATH?: string;
  DB_HOST?: string;
  DB_PORT?: string;
  DB_USERNAME?: string;
  DB_PASSWORD?: string;
  DB_DATABASE?: string;
  // "true" to negotiate TLS with the Postgres server at all. Off by default so a
  // bare local Postgres (no cert) keeps working with zero config.
  DB_SSL?: string;
  // Certificate verification is ON by default whenever DB_SSL=true — this must be
  // explicitly opted out of, never silently disabled, since that would accept a
  // MITM'd connection to whatever's on the other end of DB_HOST.
  DB_SSL_REJECT_UNAUTHORIZED?: string;
  // Optional PEM contents of a provider-specific root CA, when the server's
  // certificate isn't already covered by Node's built-in trust store.
  DB_SSL_CA?: string;
  NODE_ENV?: string;
}

/** Single source of truth for TypeORM connection config, shared by the NestJS
 *  DatabaseModule (runtime) and the CLI data source (migration:generate/run). Keeping
 *  this in one place is what guarantees a migration generated via the CLI actually
 *  matches what the running app connects with. */
export function buildDataSourceOptions(env: DbEnv): DataSourceOptions {
  const dbType = env.DB_TYPE ?? "sqlite";
  const nodeEnv = env.NODE_ENV ?? "development";

  // synchronize auto-alters the schema to match entities on every boot — safe only
  // for a throwaway local SQLite dev DB. Every other case (Postgres, or any
  // non-development NODE_ENV) must go through versioned migrations instead.
  const synchronize = dbType === "sqlite" && nodeEnv === "development";

  if (dbType === "postgres") {
    const sslEnabled = env.DB_SSL === "true";
    // Secure by default: certificate verification stays on unless explicitly
    // disabled, and only ever disable it because the provider's own docs call for
    // it (e.g. a self-signed cert with no CA to pin) — never as a default.
    const rejectUnauthorized = env.DB_SSL_REJECT_UNAUTHORIZED !== "false";

    return {
      type: "postgres",
      host: env.DB_HOST ?? "localhost",
      port: Number(env.DB_PORT ?? 5432),
      username: env.DB_USERNAME ?? "quickbite",
      password: env.DB_PASSWORD ?? "quickbite",
      database: env.DB_DATABASE ?? "quickbite",
      entities: ALL_ENTITIES,
      migrations: ALL_MIGRATIONS,
      synchronize,
      ssl: sslEnabled
        ? { rejectUnauthorized, ca: env.DB_SSL_CA || undefined }
        : false,
      // gen_random_uuid() has been a Postgres core built-in since v13 — no
      // extension needed. Using the "uuid-ossp" default instead would require the
      // app's DB role to have CREATE EXTENSION rights, which a managed provider
      // may not grant; this avoids depending on that privilege at all.
      uuidExtension: "pgcrypto",
      installExtensions: false,
    };
  }

  return {
    type: "better-sqlite3",
    database: env.DB_SQLITE_PATH ?? "./quickbite.sqlite",
    entities: ALL_ENTITIES,
    migrations: ALL_MIGRATIONS,
    synchronize,
  };
}

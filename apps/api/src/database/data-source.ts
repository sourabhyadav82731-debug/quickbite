// TypeORM CLI entry point (migration:generate / migration:run / migration:revert).
// Not used by the running NestJS app — see database.module.ts for that. Both
// share buildDataSourceOptions so the CLI always targets the same schema shape
// the app itself connects with.
import "dotenv/config";
import { DataSource } from "typeorm";
import { buildDataSourceOptions } from "./data-source-options";

export default new DataSource(buildDataSourceOptions(process.env));

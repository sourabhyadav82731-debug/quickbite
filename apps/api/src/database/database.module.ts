import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { buildDataSourceOptions, DbEnv } from "./data-source-options";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        // Pulled individually (rather than passed whole) so each key still goes
        // through ConfigService, keeping it the single point of truth for env
        // access inside the Nest app — buildDataSourceOptions itself stays
        // framework-agnostic so the CLI data source can reuse it directly.
        const env: DbEnv = {
          DB_TYPE: config.get<string>("DB_TYPE"),
          DB_SQLITE_PATH: config.get<string>("DB_SQLITE_PATH"),
          DB_HOST: config.get<string>("DB_HOST"),
          DB_PORT: config.get<string>("DB_PORT"),
          DB_USERNAME: config.get<string>("DB_USERNAME"),
          DB_PASSWORD: config.get<string>("DB_PASSWORD"),
          DB_DATABASE: config.get<string>("DB_DATABASE"),
          DB_SSL: config.get<string>("DB_SSL"),
          DB_SSL_REJECT_UNAUTHORIZED: config.get<string>("DB_SSL_REJECT_UNAUTHORIZED"),
          DB_SSL_CA: config.get<string>("DB_SSL_CA"),
          NODE_ENV: config.get<string>("NODE_ENV"),
        };
        return buildDataSourceOptions(env) as TypeOrmModuleOptions;
      },
    }),
  ],
})
export class DatabaseModule {}

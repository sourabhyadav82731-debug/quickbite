import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ALL_ENTITIES } from "./entities";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const dbType = config.get<string>("DB_TYPE", "sqlite");
        if (dbType === "postgres") {
          return {
            type: "postgres",
            host: config.get<string>("DB_HOST", "localhost"),
            port: config.get<number>("DB_PORT", 5432),
            username: config.get<string>("DB_USERNAME", "quickbite"),
            password: config.get<string>("DB_PASSWORD", "quickbite"),
            database: config.get<string>("DB_DATABASE", "quickbite"),
            entities: ALL_ENTITIES,
            synchronize: true,
          };
        }
        return {
          type: "better-sqlite3",
          database: config.get<string>("DB_SQLITE_PATH", "./quickbite.sqlite"),
          entities: ALL_ENTITIES,
          synchronize: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}

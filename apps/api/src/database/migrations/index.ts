import { MigrationInterface } from "typeorm";
import { InitialSchema1787752965858 } from "./1787752965858-InitialSchema";

// Explicit list (not a glob) so migration loading behaves the same whether run via
// ts-node in dev or from compiled output later — add each generated migration here.
export const ALL_MIGRATIONS: (new () => MigrationInterface)[] = [InitialSchema1787752965858];

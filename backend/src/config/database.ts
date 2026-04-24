import "reflect-metadata";
import { DataSource } from "typeorm";
import { Mockup } from "../entities/Mockup";
import { Config } from "../entities/Config";
import { Project } from "../entities/Project";

// Conexión SQLite local — sin servidor requerido para v1.
export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "designlink.sqlite",
  synchronize: true, // En producción usar migraciones en vez de synchronize
  logging: false,
  entities: [Mockup, Config, Project],
});

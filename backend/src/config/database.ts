import "reflect-metadata";
import { DataSource } from "typeorm";
import { Mockup } from "../entities/Mockup";

// Conexión SQLite local — sin servidor requerido para v1.
export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "designlink.sqlite",
  synchronize: true, // En producción usar migraciones en vez de synchronize
  logging: false,
  entities: [Mockup],
});

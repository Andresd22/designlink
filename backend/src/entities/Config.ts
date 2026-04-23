import { Entity, PrimaryColumn, Column, UpdateDateColumn } from "typeorm";

// Almacena configuración del agente como pares clave-valor JSON.
// Key "config" contiene umbrales de alertas y estados permitidos.
@Entity("config")
export class Config {
  @PrimaryColumn({ type: "varchar", length: 100 })
  key!: string;

  @Column({ type: "text" })
  value!: string; // JSON.stringify del objeto

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "varchar", length: 150, nullable: true })
  updatedBy!: string | null;
}

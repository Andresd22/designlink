import { Entity, PrimaryColumn, Column, UpdateDateColumn } from "typeorm";

// Almacena configuración y versiones del agente como pares clave-valor JSON.
// version: incremental por key por escritura — equivalente al version de DynamoDB en Betty Finance.
@Entity("config")
export class Config {
  @PrimaryColumn({ type: "varchar", length: 100 })
  key!: string;

  @Column({ type: "text" })
  value!: string; // JSON.stringify del objeto

  @Column({ type: "integer", default: 1 })
  version!: number;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "varchar", length: 150, nullable: true })
  updatedBy!: string | null;
}

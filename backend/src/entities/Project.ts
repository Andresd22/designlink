import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

// Catálogo de proyectos. Equivalente al state key "teams" de Betty Finance.
// MockupService valida que proyectoSlug exista aquí antes de registrar un mockup.
@Entity("projects")
export class Project {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 150, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Column({ type: "varchar", length: 150 })
  cliente!: string;

  @Column({ type: "varchar", length: 150, nullable: true })
  lead!: string | null;

  @Column({ type: "boolean", default: true })
  active!: boolean;

  @CreateDateColumn()
  creadoEn!: Date;

  @UpdateDateColumn()
  actualizadoEn!: Date;
}

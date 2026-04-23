import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum FeedbackEstado {
  PENDIENTE = "Pendiente",
  EN_REVISION = "En revisión",
  APROBADO = "Aprobado",
  RECHAZADO = "Rechazado",
}

// Representa un mockup registrado en el sistema.
// Equivalente al State Key "mockups" en el agente DesignLink.
@Entity("mockups")
export class Mockup {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 150 })
  proyecto!: string;

  @Column({ type: "varchar", length: 150 })
  cliente!: string;

  @Column({ type: "text" })
  descripcion!: string;

  @Column({
    type: "varchar",
    enum: FeedbackEstado,
    default: FeedbackEstado.PENDIENTE,
  })
  feedbackEstado!: FeedbackEstado;

  @Column({ type: "text", nullable: true })
  feedbackComentario!: string | null;

  @Column({ type: "varchar", length: 100 })
  diseno!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  url!: string | null;

  @Column({ type: "boolean", default: true })
  disponible!: boolean;

  @Column({ type: "varchar", length: 150, nullable: true })
  actualizadoPor!: string | null;

  @CreateDateColumn()
  creadoEn!: Date;

  @UpdateDateColumn()
  actualizadoEn!: Date;
}

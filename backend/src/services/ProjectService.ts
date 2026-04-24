import { Project } from "../entities/Project";
import { ProjectRepository } from "../repositories/ProjectRepository";

export interface CreateProjectDTO {
  name: string;
  slug: string;
  cliente: string;
  lead?: string;
}

export interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export class ProjectService {
  private repository: ProjectRepository;

  constructor() {
    this.repository = new ProjectRepository();
  }

  async getAll(): Promise<ServiceResult<Project[]>> {
    const data = await this.repository.findAll();
    return { ok: true, data };
  }

  async getActive(): Promise<ServiceResult<Project[]>> {
    const data = await this.repository.findActive();
    return { ok: true, data };
  }

  async getBySlug(slug: string): Promise<ServiceResult<Project>> {
    const project = await this.repository.findBySlug(slug);
    if (!project) return { ok: false, error: `Proyecto slug="${slug}" no encontrado en el catálogo.` };
    return { ok: true, data: project };
  }

  async create(dto: CreateProjectDTO): Promise<ServiceResult<Project>> {
    if (!dto.name?.trim()) return { ok: false, error: "Bloqueado: el campo 'name' es obligatorio." };
    if (!dto.slug?.trim()) return { ok: false, error: "Bloqueado: el campo 'slug' es obligatorio." };
    if (!dto.cliente?.trim()) return { ok: false, error: "Bloqueado: el campo 'cliente' es obligatorio." };

    const existing = await this.repository.findBySlug(dto.slug);
    if (existing) return { ok: false, error: `Bloqueado: ya existe un proyecto con slug="${dto.slug}".` };

    const project = this.repository.create({ ...dto, active: true });
    const saved = await this.repository.save(project);
    return { ok: true, data: saved };
  }

  async deactivate(id: number): Promise<ServiceResult<Project>> {
    const project = await this.repository.findById(id);
    if (!project) return { ok: false, error: `Proyecto id=${id} no encontrado.` };

    project.active = false;
    const saved = await this.repository.save(project);
    return { ok: true, data: saved };
  }

  // Usado por MockupService para validar proyectoSlug antes de persistir.
  async validateSlug(slug: string): Promise<{ valid: boolean; error?: string }> {
    const project = await this.repository.findBySlug(slug);
    if (!project) return { valid: false, error: `Bloqueado: proyectoSlug="${slug}" no existe en el catálogo de proyectos. Crea el proyecto primero.` };
    if (!project.active) return { valid: false, error: `Bloqueado: el proyecto "${project.name}" está inactivo. Reactívalo antes de registrar mockups.` };
    return { valid: true };
  }
}

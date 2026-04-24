import { Mockup, FeedbackEstado } from "../entities/Mockup";
import { MockupRepository } from "../repositories/MockupRepository";
import { ProjectService } from "./ProjectService";

export interface CreateMockupDTO {
  proyectoSlug: string;
  proyecto: string;
  cliente: string;
  descripcion: string;
  diseno: string;
  url?: string;
  feedbackComentario?: string;
  actualizadoPor?: string;
}

export interface UpdateMockupDTO {
  proyecto?: string;
  cliente?: string;
  descripcion?: string;
  diseno?: string;
  url?: string;
  feedbackEstado?: FeedbackEstado;
  feedbackComentario?: string;
  disponible?: boolean;
  actualizadoPor?: string;
}

export interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export class MockupService {
  private repository: MockupRepository;
  private projectService: ProjectService;

  constructor() {
    this.repository = new MockupRepository();
    this.projectService = new ProjectService();
  }

  async getAll(): Promise<ServiceResult<Mockup[]>> {
    return { ok: true, data: await this.repository.findAll() };
  }

  async getById(id: number): Promise<ServiceResult<Mockup>> {
    const mockup = await this.repository.findById(id);
    if (!mockup) return { ok: false, error: `Mockup id=${id} no encontrado.` };
    return { ok: true, data: mockup };
  }

  async create(dto: CreateMockupDTO): Promise<ServiceResult<Mockup>> {
    // Validación de campos obligatorios
    if (!dto.proyectoSlug?.trim()) return { ok: false, error: "Bloqueado: el campo 'proyectoSlug' es obligatorio." };
    if (!dto.proyecto?.trim())     return { ok: false, error: "Bloqueado: el campo 'proyecto' es obligatorio." };
    if (!dto.cliente?.trim())      return { ok: false, error: "Bloqueado: el campo 'cliente' es obligatorio." };
    if (!dto.descripcion?.trim())  return { ok: false, error: "Bloqueado: el campo 'descripcion' es obligatorio." };
    if (!dto.diseno?.trim())       return { ok: false, error: "Bloqueado: el campo 'diseno' es obligatorio." };

    // Validación contra catálogo de proyectos — equivalente a la validación de team slug en Betty Finance
    const slugValidation = await this.projectService.validateSlug(dto.proyectoSlug);
    if (!slugValidation.valid) return { ok: false, error: slugValidation.error };

    const mockup = this.repository.create({
      ...dto,
      url: dto.url || null,
      feedbackComentario: dto.feedbackComentario || null,
      feedbackEstado: FeedbackEstado.PENDIENTE,
      disponible: true,
    });

    const saved = await this.repository.save(mockup);
    return { ok: true, data: saved };
  }

  async update(id: number, dto: UpdateMockupDTO): Promise<ServiceResult<Mockup>> {
    const result = await this.getById(id);
    if (!result.ok || !result.data) return result as ServiceResult<Mockup>;

    const mockup = result.data;

    // Regla: no se puede marcar Aprobado sin URL
    if (dto.feedbackEstado === FeedbackEstado.APROBADO) {
      const urlFinal = dto.url ?? mockup.url;
      if (!urlFinal?.trim()) {
        return { ok: false, error: "Bloqueado: no se puede marcar Aprobado — url está vacío. Agrega la URL antes de cambiar el estado." };
      }
    }

    Object.assign(mockup, dto);
    const saved = await this.repository.save(mockup);
    return { ok: true, data: saved };
  }

  async toggleDisponible(id: number, disponible: boolean): Promise<ServiceResult<Mockup>> {
    const result = await this.getById(id);
    if (!result.ok || !result.data) return result as ServiceResult<Mockup>;
    result.data.disponible = disponible;
    return { ok: true, data: await this.repository.save(result.data) };
  }

  async getSummary(): Promise<ServiceResult<Record<string, unknown>>> {
    const mockups = await this.repository.findAll();
    const porEstado = mockups.reduce<Record<string, number>>((acc, m) => {
      acc[m.feedbackEstado] = (acc[m.feedbackEstado] || 0) + 1;
      return acc;
    }, {});

    const sinUrlDisponibles = mockups.filter((m) => m.disponible && !m.url);
    const ahora = new Date();
    const pendientesEstancados = mockups.filter((m) => {
      if (m.feedbackEstado !== FeedbackEstado.PENDIENTE) return false;
      return (ahora.getTime() - new Date(m.creadoEn).getTime()) / (1000 * 60 * 60 * 24) > 7;
    });

    return {
      ok: true,
      data: {
        total: mockups.length,
        porEstado,
        disponibles: mockups.filter((m) => m.disponible).length,
        noDisponibles: mockups.filter((m) => !m.disponible).length,
        alertas: {
          sinUrlDisponibles: sinUrlDisponibles.length,
          pendientesEstancados: pendientesEstancados.length,
        },
        estadoLeido: new Date().toISOString(),
      },
    };
  }
}

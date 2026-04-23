import { Mockup, FeedbackEstado } from "../entities/Mockup";
import { MockupRepository } from "../repositories/MockupRepository";

export interface CreateMockupDTO {
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

// Capa de lógica de negocio. Aplica las reglas del agente DesignLink antes de persistir.
export class MockupService {
  private repository: MockupRepository;

  constructor() {
    this.repository = new MockupRepository();
  }

  async getAll(): Promise<ServiceResult<Mockup[]>> {
    const data = await this.repository.findAll();
    return { ok: true, data };
  }

  async getById(id: number): Promise<ServiceResult<Mockup>> {
    const mockup = await this.repository.findById(id);
    if (!mockup) return { ok: false, error: `Mockup id=${id} no encontrado.` };
    return { ok: true, data: mockup };
  }

  async create(dto: CreateMockupDTO): Promise<ServiceResult<Mockup>> {
    // Regla: proyecto es campo obligatorio
    if (!dto.proyecto?.trim()) {
      return { ok: false, error: "Bloqueado: el campo 'proyecto' es obligatorio." };
    }
    if (!dto.cliente?.trim()) {
      return { ok: false, error: "Bloqueado: el campo 'cliente' es obligatorio." };
    }
    if (!dto.descripcion?.trim()) {
      return { ok: false, error: "Bloqueado: el campo 'descripcion' es obligatorio." };
    }
    if (!dto.diseno?.trim()) {
      return { ok: false, error: "Bloqueado: el campo 'diseno' es obligatorio." };
    }

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

    // Regla: no se puede marcar Aprobado sin URL cargada
    if (dto.feedbackEstado === FeedbackEstado.APROBADO) {
      const urlFinal = dto.url ?? mockup.url;
      if (!urlFinal?.trim()) {
        return {
          ok: false,
          error: "Bloqueado: no se puede marcar Aprobado — el campo 'url' está vacío. Agrega la URL antes de cambiar el estado.",
        };
      }
    }

    Object.assign(mockup, dto);
    const saved = await this.repository.save(mockup);
    return { ok: true, data: saved };
  }

  // Desactiva sin eliminar — equivalente a set disponible: false
  async toggleDisponible(id: number, disponible: boolean): Promise<ServiceResult<Mockup>> {
    const result = await this.getById(id);
    if (!result.ok || !result.data) return result as ServiceResult<Mockup>;

    result.data.disponible = disponible;
    const saved = await this.repository.save(result.data);
    return { ok: true, data: saved };
  }

  async getSummary(): Promise<ServiceResult<Record<string, unknown>>> {
    const mockups = await this.repository.findAll();

    const porEstado = mockups.reduce<Record<string, number>>((acc, m) => {
      acc[m.feedbackEstado] = (acc[m.feedbackEstado] || 0) + 1;
      return acc;
    }, {});

    // Alerta: registros disponible:true sin URL
    const sinUrlDisponibles = mockups.filter((m) => m.disponible && !m.url);

    // Alerta: pendientes con más de 7 días sin actualización
    const umbralDias = 7;
    const hoy = new Date();
    const pendientesEstancados = mockups.filter((m) => {
      if (m.feedbackEstado !== FeedbackEstado.PENDIENTE) return false;
      const diasDesdeCreacion = (hoy.getTime() - new Date(m.creadoEn).getTime()) / (1000 * 60 * 60 * 24);
      return diasDesdeCreacion > umbralDias;
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

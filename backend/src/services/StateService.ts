import { AppDataSource } from "../config/database";
import { Mockup, FeedbackEstado } from "../entities/Mockup";
import { Project } from "../entities/Project";
import { Config } from "../entities/Config";

export type StateKey = "mockups" | "projects" | "config";

export interface StateResult {
  ok: boolean;
  data?: unknown;
  error?: string;
}

export interface SetStateResult {
  ok: boolean;
  updatedAt?: string;
  version?: number;
  alerts?: AlertSnapshot[];
  error?: string;
}

export interface AlertSnapshot {
  id: string;
  label: string;
  triggered: boolean;
  severity: string;
  action: string;
  affectedIds: (string | number)[];
  count: number;
  triggeredAt: string | null;
  notifyTo: string[];
}

// Implementa get_state y set_state con version tracking y evaluación de alertas.
// BettyMind llama estos métodos cuando el agente invoca las herramientas.
export class StateService {

  async getState(key?: StateKey): Promise<StateResult> {
    if (key === "mockups")   return { ok: true, data: await this.readMockups() };
    if (key === "projects")  return { ok: true, data: await this.readProjects() };
    if (key === "config")    return { ok: true, data: await this.readConfig() };
    if (!key) {
      return {
        ok: true,
        data: {
          mockups:  await this.readMockups(),
          projects: await this.readProjects(),
          config:   await this.readConfig(),
        },
      };
    }
    return { ok: false, error: `Key desconocida: "${key}". Valores aceptados: mockups, projects, config.` };
  }

  // set_state: persiste, incrementa versión, evalúa alertas y actualiza snapshots.
  async setState(key: StateKey, value: unknown, updatedBy?: string): Promise<SetStateResult> {
    let version = 1;

    if (key === "mockups") {
      const error = await this.syncMockups(value as Partial<Mockup>[]);
      if (error) return { ok: false, error };
      version = await this.incrementVersion("mockups", updatedBy);
    } else if (key === "projects") {
      const error = await this.syncProjects(value as Partial<Project>[]);
      if (error) return { ok: false, error };
      version = await this.incrementVersion("projects", updatedBy);
    } else if (key === "config") {
      await this.writeConfig(value, updatedBy);
      version = await this.getVersion("config");
    } else {
      return { ok: false, error: `Key desconocida: "${key}". Valores aceptados: mockups, projects, config.` };
    }

    // Evalúa todas las alertas activas después de cada set_state (on_every_set_state)
    const alerts = await this.evaluateAlerts();

    const updatedAt = new Date().toISOString();
    return { ok: true, updatedAt, version, alerts };
  }

  // Evalúa todas las alertas activas definidas en config y actualiza sus snapshots.
  private async evaluateAlerts(): Promise<AlertSnapshot[]> {
    const config = await this.readConfig() as { alertas: AlertConfig[] };
    if (!config?.alertas?.length) return [];

    const mockups = await this.readMockups();
    const snapshots: AlertSnapshot[] = [];
    const updatedAlertas = [...config.alertas];

    for (let i = 0; i < updatedAlertas.length; i++) {
      const alerta = updatedAlertas[i];
      if (!alerta.active) continue;

      let snapshot: AlertSnapshot = {
        id: alerta.id,
        label: alerta.label,
        triggered: false,
        severity: alerta.severity,
        action: alerta.action,
        affectedIds: [],
        count: 0,
        triggeredAt: null,
        notifyTo: alerta.notifyTo ?? [],
      };

      if (alerta.alertWhen.condition === "pendiente_sin_actualizar") {
        const diasUmbral = this.getThresholdDias(alerta, "warning");
        const ahora = new Date();
        const afectados = (mockups as Mockup[]).filter((m) => {
          if (m.feedbackEstado !== FeedbackEstado.PENDIENTE) return false;
          const dias = (ahora.getTime() - new Date(m.creadoEn).getTime()) / (1000 * 60 * 60 * 24);
          return dias > diasUmbral;
        });
        snapshot = {
          ...snapshot,
          triggered: afectados.length > 0,
          affectedIds: afectados.map((m) => m.id),
          count: afectados.length,
          triggeredAt: afectados.length > 0 ? new Date().toISOString() : null,
        };
      }

      if (alerta.alertWhen.condition === "disponible_sin_url") {
        const afectados = (mockups as Mockup[]).filter((m) => m.disponible && !m.url);
        snapshot = {
          ...snapshot,
          triggered: afectados.length > 0,
          affectedIds: afectados.map((m) => m.id),
          count: afectados.length,
          triggeredAt: afectados.length > 0 ? new Date().toISOString() : null,
        };
      }

      // Actualiza el snapshot en la config persistida
      updatedAlertas[i] = { ...alerta, snapshot };
      snapshots.push(snapshot);
    }

    // Persiste los snapshots actualizados sin incrementar versión
    await this.writeConfig({ ...config, alertas: updatedAlertas }, undefined);
    return snapshots.filter((s) => s.triggered);
  }

  private getThresholdDias(alerta: AlertConfig, type: string): number {
    const level = alerta.threshold?.levels?.find((l) => l.type === type);
    return level?.diasUmbral ?? 7;
  }

  private async readMockups(): Promise<Mockup[]> {
    return AppDataSource.getRepository(Mockup).find({ order: { creadoEn: "DESC" } });
  }

  private async readProjects(): Promise<Project[]> {
    return AppDataSource.getRepository(Project).find({ order: { name: "ASC" } });
  }

  private async syncMockups(incoming: Partial<Mockup>[]): Promise<string | null> {
    if (!Array.isArray(incoming)) return "El valor para key 'mockups' debe ser un array.";
    const repo = AppDataSource.getRepository(Mockup);
    for (const record of incoming) {
      const existing = record.id ? await repo.findOneBy({ id: Number(record.id) }) : null;
      existing ? Object.assign(existing, record) && await repo.save(existing)
               : await repo.save(repo.create(record));
    }
    const incomingIds = incoming.map((r) => Number(r.id)).filter(Boolean);
    if (incomingIds.length > 0) {
      const all = await repo.find();
      const toDelete = all.filter((r) => !incomingIds.includes(r.id));
      if (toDelete.length) await repo.remove(toDelete);
    }
    return null;
  }

  private async syncProjects(incoming: Partial<Project>[]): Promise<string | null> {
    if (!Array.isArray(incoming)) return "El valor para key 'projects' debe ser un array.";
    const repo = AppDataSource.getRepository(Project);
    for (const record of incoming) {
      const existing = record.id ? await repo.findOneBy({ id: Number(record.id) }) : null;
      existing ? Object.assign(existing, record) && await repo.save(existing)
               : await repo.save(repo.create(record));
    }
    return null;
  }

  private async readConfig(): Promise<unknown> {
    const repo = AppDataSource.getRepository(Config);
    const row = await repo.findOneBy({ key: "config" });
    if (!row) return this.defaultConfig();
    return JSON.parse(row.value);
  }

  private async writeConfig(value: unknown, updatedBy?: string): Promise<void> {
    const repo = AppDataSource.getRepository(Config);
    let row = await repo.findOneBy({ key: "config" });
    if (!row) {
      row = repo.create({ key: "config", version: 1, updatedBy: updatedBy ?? null });
    } else {
      row.version = (row.version ?? 0) + 1;
    }
    row.value = JSON.stringify(value);
    if (updatedBy) row.updatedBy = updatedBy;
    await repo.save(row);
  }

  // Incrementa el contador de versión para un key dado y lo persiste.
  private async incrementVersion(key: string, updatedBy?: string): Promise<number> {
    const repo = AppDataSource.getRepository(Config);
    const versionKey = `__version__${key}`;
    let row = await repo.findOneBy({ key: versionKey });
    if (!row) {
      row = repo.create({ key: versionKey, value: "1", version: 1, updatedBy: updatedBy ?? null });
    } else {
      const next = (row.version ?? 0) + 1;
      row.version = next;
      row.value = String(next);
      if (updatedBy) row.updatedBy = updatedBy;
    }
    await repo.save(row);
    return row.version;
  }

  private async getVersion(key: string): Promise<number> {
    const repo = AppDataSource.getRepository(Config);
    const row = await repo.findOneBy({ key });
    return row?.version ?? 1;
  }

  private defaultConfig(): object {
    return {
      alertas: [
        {
          id: "alert-001",
          key: "mockups",
          label: "Mockups pendientes estancados",
          threshold: {
            levels: [
              { type: "warning",  diasUmbral: 7,  action: "warn" },
              { type: "critical", diasUmbral: 14, action: "escalate" },
            ],
          },
          alertWhen: { condition: "pendiente_sin_actualizar", evaluationFrequency: "on_every_set_state" },
          severity: "warning",
          action: "warn",
          notifyTo: [],
          cooldownHours: 24,
          active: true,
          snapshot: { affectedIds: [], count: 0, triggeredAt: null, triggered: false },
        },
        {
          id: "alert-002",
          key: "mockups",
          label: "Mockups disponibles sin URL",
          threshold: {
            levels: [
              { type: "warning",  count: 1, action: "warn" },
              { type: "critical", count: 5, action: "escalate" },
            ],
          },
          alertWhen: { condition: "disponible_sin_url", evaluationFrequency: "on_every_set_state" },
          severity: "warning",
          action: "warn",
          notifyTo: [],
          cooldownHours: 0,
          active: true,
          snapshot: { affectedIds: [], count: 0, triggeredAt: null, triggered: false },
        },
      ],
      feedbackEstados: ["Pendiente", "En revisión", "Aprobado", "Rechazado"],
      updatedAt: new Date().toISOString(),
      updatedBy: null,
    };
  }
}

// Tipos internos para la configuración de alertas
interface AlertConfig {
  id: string;
  key: string;
  label: string;
  threshold: { levels: { type: string; diasUmbral?: number; count?: number; action: string }[] };
  alertWhen: { condition: string; evaluationFrequency: string };
  severity: string;
  action: string;
  notifyTo?: string[];
  cooldownHours: number;
  active: boolean;
  snapshot?: unknown;
}

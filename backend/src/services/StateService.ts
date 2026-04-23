import { AppDataSource } from "../config/database";
import { Mockup } from "../entities/Mockup";
import { Config } from "../entities/Config";

export type StateKey = "mockups" | "config";

export interface StateResult {
  ok: boolean;
  data?: unknown;
  error?: string;
}

export interface SetStateResult {
  ok: boolean;
  updatedAt?: string;
  error?: string;
}

// Implementa get_state y set_state tal como los define el agente DesignLink.
// BettyMind llama estos métodos cuando el agente invoca las herramientas.
export class StateService {
  // get_state(key?) — lee el estado persistido de la key solicitada.
  // Si key es omitida, retorna el estado completo.
  async getState(key?: StateKey): Promise<StateResult> {
    if (key === "mockups" || key === undefined) {
      const mockups = await this.readMockups();
      if (key === "mockups") return { ok: true, data: mockups };
      const config = await this.readConfig();
      return { ok: true, data: { mockups, config } };
    }

    if (key === "config") {
      const config = await this.readConfig();
      return { ok: true, data: config };
    }

    return { ok: false, error: `Key desconocida: "${key}". Valores aceptados: mockups, config.` };
  }

  // set_state(key, value) — persiste el nuevo valor para la key indicada.
  // Para "mockups": sincroniza el array completo (upsert + eliminación de registros removidos).
  // Para "config": reemplaza el objeto de configuración.
  async setState(key: StateKey, value: unknown, updatedBy?: string): Promise<SetStateResult> {
    if (key === "mockups") {
      const error = await this.syncMockups(value as Partial<Mockup>[]);
      if (error) return { ok: false, error };
    } else if (key === "config") {
      await this.writeConfig(value, updatedBy);
    } else {
      return { ok: false, error: `Key desconocida: "${key}". Valores aceptados: mockups, config.` };
    }

    const updatedAt = new Date().toISOString();
    return { ok: true, updatedAt };
  }

  // Lee todos los mockups de la base de datos como array plano.
  private async readMockups(): Promise<Mockup[]> {
    return AppDataSource.getRepository(Mockup).find({ order: { creadoEn: "DESC" } });
  }

  // Sincroniza el array de mockups recibido con la base de datos:
  // - Upsert de cada registro presente en el array.
  // - Eliminación de registros cuyo id no está en el array.
  private async syncMockups(incoming: Partial<Mockup>[]): Promise<string | null> {
    if (!Array.isArray(incoming)) {
      return "El valor para key 'mockups' debe ser un array.";
    }

    const repo = AppDataSource.getRepository(Mockup);

    // Upsert de cada registro recibido
    for (const record of incoming) {
      const existing = record.id ? await repo.findOneBy({ id: record.id }) : null;
      if (existing) {
        Object.assign(existing, record);
        await repo.save(existing);
      } else {
        await repo.save(repo.create(record));
      }
    }

    // Eliminación de registros que ya no están en el array
    const incomingIds = incoming.map((r) => r.id).filter(Boolean) as number[];
    if (incomingIds.length > 0) {
      const allRecords = await repo.find();
      const toDelete = allRecords.filter((r) => !incomingIds.includes(r.id));
      if (toDelete.length > 0) {
        await repo.remove(toDelete);
      }
    }

    return null;
  }

  // Lee la configuración del agente desde la tabla config.
  private async readConfig(): Promise<unknown> {
    const repo = AppDataSource.getRepository(Config);
    const row = await repo.findOneBy({ key: "config" });
    if (!row) return this.defaultConfig();
    return JSON.parse(row.value);
  }

  // Persiste el objeto de configuración en la tabla config.
  private async writeConfig(value: unknown, updatedBy?: string): Promise<void> {
    const repo = AppDataSource.getRepository(Config);
    let row = await repo.findOneBy({ key: "config" });
    if (!row) {
      row = repo.create({ key: "config", updatedBy: updatedBy ?? null });
    }
    row.value = JSON.stringify(value);
    row.updatedBy = updatedBy ?? null;
    await repo.save(row);
  }

  // Configuración inicial del agente si no existe en la base de datos.
  private defaultConfig() {
    return {
      alertas: {
        diasPendienteUmbral: 7,
        accion: "warn",
        notificarA: [],
      },
      feedbackEstados: ["Pendiente", "En revisión", "Aprobado", "Rechazado"],
      updatedAt: new Date().toISOString(),
      updatedBy: null,
    };
  }
}

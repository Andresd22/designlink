import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Mockup } from "../entities/Mockup";

// Capa de acceso a datos. Única responsabilidad: operaciones CRUD sobre la tabla mockups.
export class MockupRepository {
  private repo: Repository<Mockup>;

  constructor() {
    this.repo = AppDataSource.getRepository(Mockup);
  }

  findAll(): Promise<Mockup[]> {
    return this.repo.find({ order: { creadoEn: "DESC" } });
  }

  findById(id: number): Promise<Mockup | null> {
    return this.repo.findOneBy({ id });
  }

  findByProyecto(proyecto: string): Promise<Mockup[]> {
    return this.repo.findBy({ proyecto });
  }

  findByCliente(cliente: string): Promise<Mockup[]> {
    return this.repo.findBy({ cliente });
  }

  save(mockup: Mockup): Promise<Mockup> {
    return this.repo.save(mockup);
  }

  create(data: Partial<Mockup>): Mockup {
    return this.repo.create(data);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}

import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Project } from "../entities/Project";

export class ProjectRepository {
  private repo: Repository<Project>;

  constructor() {
    this.repo = AppDataSource.getRepository(Project);
  }

  findAll(): Promise<Project[]> {
    return this.repo.find({ order: { name: "ASC" } });
  }

  findActive(): Promise<Project[]> {
    return this.repo.findBy({ active: true });
  }

  findBySlug(slug: string): Promise<Project | null> {
    return this.repo.findOneBy({ slug });
  }

  findById(id: number): Promise<Project | null> {
    return this.repo.findOneBy({ id });
  }

  create(data: Partial<Project>): Project {
    return this.repo.create(data);
  }

  save(project: Project): Promise<Project> {
    return this.repo.save(project);
  }
}

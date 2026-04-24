import { Request, Response } from "express";
import { ProjectService } from "../services/ProjectService";

export class ProjectController {
  private service: ProjectService;

  constructor() {
    this.service = new ProjectService();
  }

  getAll = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.service.getAll();
    res.json(result);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.create(req.body);
    res.status(result.ok ? 201 : 400).json(result);
  };

  deactivate = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    const result = await this.service.deactivate(id);
    res.status(result.ok ? 200 : 404).json(result);
  };
}

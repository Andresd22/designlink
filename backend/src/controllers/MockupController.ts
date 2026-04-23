import { Request, Response } from "express";
import { MockupService } from "../services/MockupService";

// Capa HTTP. Única responsabilidad: leer request, llamar service, escribir response.
export class MockupController {
  private service: MockupService;

  constructor() {
    this.service = new MockupService();
  }

  getAll = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.service.getAll();
    res.json(result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    const result = await this.service.getById(id);
    res.status(result.ok ? 200 : 404).json(result);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.create(req.body);
    res.status(result.ok ? 201 : 400).json(result);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    const result = await this.service.update(id, req.body);
    res.status(result.ok ? 200 : 400).json(result);
  };

  toggleDisponible = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    const { disponible } = req.body;
    const result = await this.service.toggleDisponible(id, disponible);
    res.status(result.ok ? 200 : 400).json(result);
  };

  getSummary = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.service.getSummary();
    res.json(result);
  };
}

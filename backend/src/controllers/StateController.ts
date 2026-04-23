import { Request, Response } from "express";
import { StateService, StateKey } from "../services/StateService";

// Expone get_state y set_state como endpoints HTTP para BettyMind.
export class StateController {
  private service: StateService;

  constructor() {
    this.service = new StateService();
  }

  // GET /api/state?key=mockups  →  get_state("mockups")
  // GET /api/state              →  get_state()
  getState = async (req: Request, res: Response): Promise<void> => {
    const key = req.query.key as StateKey | undefined;
    const result = await this.service.getState(key);
    res.status(result.ok ? 200 : 400).json(result);
  };

  // POST /api/state  →  set_state(key, value)
  // Body: { key: "mockups" | "config", value: unknown, updatedBy?: string }
  setState = async (req: Request, res: Response): Promise<void> => {
    const { key, value, updatedBy } = req.body;

    if (!key || value === undefined) {
      res.status(400).json({ ok: false, error: "Body requerido: { key, value }." });
      return;
    }

    const result = await this.service.setState(key, value, updatedBy);
    res.status(result.ok ? 200 : 400).json(result);
  };
}

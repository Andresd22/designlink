import { Router } from "express";
import { StateController } from "../controllers/StateController";

const router = Router();
const controller = new StateController();

// GET  /api/state?key=mockups  →  get_state
// GET  /api/state              →  get_state (estado completo)
// POST /api/state              →  set_state

router.get("/", controller.getState);
router.post("/", controller.setState);

export default router;

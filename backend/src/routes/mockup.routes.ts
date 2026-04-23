import { Router } from "express";
import { MockupController } from "../controllers/MockupController";

const router = Router();
const controller = new MockupController();

// GET  /api/mockups           — listar todos
// POST /api/mockups           — crear nuevo
// GET  /api/mockups/summary   — resumen del board + alertas
// GET  /api/mockups/:id       — obtener uno
// PATCH /api/mockups/:id      — editar campos
// PATCH /api/mockups/:id/disponibilidad — toggle disponible

router.get("/summary", controller.getSummary);
router.get("/", controller.getAll);
router.post("/", controller.create);
router.get("/:id", controller.getById);
router.patch("/:id", controller.update);
router.patch("/:id/disponibilidad", controller.toggleDisponible);

export default router;

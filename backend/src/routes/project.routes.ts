import { Router } from "express";
import { ProjectController } from "../controllers/ProjectController";

const router = Router();
const controller = new ProjectController();

// GET  /api/projects      — listar todos los proyectos
// POST /api/projects      — crear proyecto nuevo
// PATCH /api/projects/:id/deactivate — desactivar proyecto

router.get("/", controller.getAll);
router.post("/", controller.create);
router.patch("/:id/deactivate", controller.deactivate);

export default router;

import { Request, Response, NextFunction } from "express";

// Captura errores no manejados y devuelve respuesta estandarizada.
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err.message);
  res.status(500).json({ ok: false, error: "Error interno del servidor." });
}

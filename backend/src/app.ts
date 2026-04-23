import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./config/database";
import mockupRoutes from "./routes/mockup.routes";
import stateRoutes from "./routes/state.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use("/api/mockups", mockupRoutes);
app.use("/api/state", stateRoutes);  // endpoints get_state / set_state para BettyMind
app.use(errorHandler);

AppDataSource.initialize()
  .then(() => {
    console.log("Base de datos SQLite conectada.");
    app.listen(PORT, () => {
      console.log(`DesignLink API corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error al conectar la base de datos:", err);
    process.exit(1);
  });

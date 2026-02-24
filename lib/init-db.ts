import { sequelize } from "./db";
import "../models/Deployment";

export async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log("[DB] Connection has been established successfully.");

    // Auto-migrate tables based on model definitions
    await sequelize.sync({ alter: true });

    console.log("[DB] Models successfully synchronized.");
  } catch (error) {
    console.error("[DB] Unable to connect to the database:", error);
  }
}

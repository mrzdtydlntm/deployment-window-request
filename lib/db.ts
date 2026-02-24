import { Sequelize } from "sequelize";
import pg from "pg";

const getDatabaseUrl = () => {
  return process.env.DATABASE_URL || "postgresql://localhost:5432/deployment_window";
};

const databaseUrl = getDatabaseUrl();
const isNeon = databaseUrl.includes("neon.tech");

const globalForSequelize = global as unknown as { sequelize: Sequelize };

export const sequelize =
  globalForSequelize.sequelize ||
  new Sequelize(databaseUrl, {
    dialect: "postgres",
    dialectModule: pg,
    dialectOptions: isNeon
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
    logging: false,
  });

if (process.env.NODE_ENV !== "production") globalForSequelize.sequelize = sequelize;

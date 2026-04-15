import mysql from "mysql2/promise";
import type { PoolOptions } from "mysql2/promise";

const poolConfig: PoolOptions = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ktdevelop_db",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
};

export const dbPool = mysql.createPool(poolConfig);

export async function pingDatabase(): Promise<boolean> {
  try {
    await dbPool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

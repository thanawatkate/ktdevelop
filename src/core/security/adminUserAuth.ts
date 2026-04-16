import { createHash } from "crypto";
import { RowDataPacket } from "mysql2";
import { dbPool } from "../../infrastructure/db";

interface AdminUserRow extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  is_active: number;
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export async function validateDbAdminPasswordLogin(usernameOrEmail: string, password: string): Promise<boolean> {
  const normalized = usernameOrEmail.trim().toLowerCase();
  if (!normalized || !password) {
    return false;
  }

  const [rows] = await dbPool.query<AdminUserRow[]>(
    `SELECT id, username, email, password_hash, is_active
     FROM admin_users
     WHERE is_active = 1 AND (LOWER(username) = ? OR LOWER(email) = ?)
     LIMIT 1`,
    [normalized, normalized]
  );

  if (!rows.length) {
    return false;
  }

  const hashedPassword = sha256(password);
  return rows[0].password_hash === hashedPassword;
}

export async function isDbAdminEmailAllowed(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT id
     FROM admin_users
     WHERE is_active = 1 AND LOWER(email) = ?
     LIMIT 1`,
    [normalized]
  );

  return rows.length > 0;
}

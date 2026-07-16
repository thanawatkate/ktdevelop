import bcrypt from "bcryptjs";
import { RowDataPacket } from "mysql2";
import { dbPool } from "../../infrastructure/db";

const BCRYPT_ROUNDS = 12;

interface AdminUserRow extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  is_active: number;
}

/**
 * Hashes a plaintext password using bcrypt.
 * Used by seed scripts and password-reset flows.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
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
    // Run a dummy bcrypt compare to prevent user-enumeration via timing
    await bcrypt.compare(password, "$2b$12$invalidhashpaddingtopreventienumeation00000000000000000");
    return false;
  }

  return bcrypt.compare(password, rows[0].password_hash);
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

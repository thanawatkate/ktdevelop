#!/usr/bin/env node

require("dotenv").config({ path: ".env" });
const crypto = require("crypto");
const mysql = require("mysql2/promise");

const {
  DB_HOST = "localhost",
  DB_PORT = "3306",
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_NAME = "ktdevelop_db",
  ADMIN_SEED_USERNAME,
  ADMIN_SEED_EMAIL,
  ADMIN_SEED_PASSWORD,
} = process.env;

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function run() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  const username = (ADMIN_SEED_USERNAME || "admin").trim();
  const email = (ADMIN_SEED_EMAIL || "admin@ktdevelop.local").trim();
  const password = ADMIN_SEED_PASSWORD || "Admin123!";
  const passwordHash = sha256(password);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS user_groups (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      code VARCHAR(50) NOT NULL,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_user_groups_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_group_id INT UNSIGNED NOT NULL,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_hash CHAR(64) NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_admin_users_username (username),
      UNIQUE KEY uq_admin_users_email (email),
      KEY idx_admin_users_group (user_group_id),
      CONSTRAINT fk_admin_users_user_group
        FOREIGN KEY (user_group_id) REFERENCES user_groups(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(
    `INSERT INTO user_groups (code, name)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = CURRENT_TIMESTAMP`,
    ["admin", "Administrators"]
  );

  const [[groupRow]] = await conn.query(
    "SELECT id FROM user_groups WHERE code = ? LIMIT 1",
    ["admin"]
  );

  await conn.query(
    `INSERT INTO admin_users (user_group_id, username, email, password_hash, is_active)
     VALUES (?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       user_group_id = VALUES(user_group_id),
       email = VALUES(email),
       password_hash = VALUES(password_hash),
       is_active = 1,
       updated_at = CURRENT_TIMESTAMP`,
    [groupRow.id, username, email, passwordHash]
  );

  const [[summary]] = await conn.query(
    `SELECT
      (SELECT COUNT(*) FROM user_groups) AS user_group_count,
      (SELECT COUNT(*) FROM admin_users) AS admin_user_count`
  );

  console.log(`[db:seed:admin] Upserted admin user: ${username}`);
  console.log(`[db:seed:admin] user_groups: ${summary.user_group_count}, admin_users: ${summary.admin_user_count}`);
  console.log("[db:seed:admin] DB admin auth is ready. Login now validates against admin_users.");

  await conn.end();
}

run().catch((error) => {
  console.error("[db:seed:admin] Failed:", error.message);
  process.exit(1);
});

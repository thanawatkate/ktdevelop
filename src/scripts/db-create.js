#!/usr/bin/env node
// Script สร้าง database ถ้ายังไม่มี ก่อนรัน migration

require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'ktdevelop_db',
} = process.env;

(async () => {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
  });

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(`[db:create] Database "${DB_NAME}" is ready.`);
  await conn.end();
})().catch((err) => {
  console.error('[db:create] Failed:', err.message);
  process.exit(1);
});

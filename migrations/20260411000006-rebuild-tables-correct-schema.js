'use strict';

// Migration 006: Rebuild all tables to match repository column names
// ปัญหา: migration 001-003 ใช้ camelCase / ชื่อ column ผิด
// Repository ต้องการ snake_case และ schema แตกต่างออกไป

exports.up = function (db, callback) {
  db.runSql(
    `-- 1. Drop tables ที่ขึ้นกัน (FK order)
    DROP TABLE IF EXISTS portfolio_tags;
    DROP TABLE IF EXISTS contact_audits;
    DROP TABLE IF EXISTS contacts;
    DROP TABLE IF EXISTS portfolios;

    -- 2. Recreate portfolios (ตาม PortfolioRepository)
    CREATE TABLE portfolios (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      title        VARCHAR(255) NOT NULL,
      description  TEXT,
      client_name  VARCHAR(255) NOT NULL DEFAULT '',
      image_url    VARCHAR(500),
      is_published TINYINT(1)   NOT NULL DEFAULT 0,
      created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_portfolios_is_published (is_published),
      INDEX idx_portfolios_created_at   (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- 3. Recreate contacts (ตาม ContactRepository)
    CREATE TABLE contacts (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      sender_name VARCHAR(255) NOT NULL,
      email       VARCHAR(255) NOT NULL,
      subject     VARCHAR(255) NOT NULL,
      message     TEXT         NOT NULL,
      file_url    VARCHAR(500),
      status      VARCHAR(20)  NOT NULL DEFAULT 'new',
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_contacts_email      (email),
      INDEX idx_contacts_status     (status),
      INDEX idx_contacts_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- 4. Create contact_status_audits (ContactRepository ใช้ชื่อนี้)
    CREATE TABLE contact_status_audits (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      contact_id  INT          NOT NULL,
      old_status  VARCHAR(20),
      new_status  VARCHAR(20)  NOT NULL,
      changed_by  VARCHAR(255) NOT NULL DEFAULT 'admin',
      changed_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_status_audits_contact_id  (contact_id),
      INDEX idx_status_audits_changed_at  (changed_at),
      CONSTRAINT fk_status_audits_contact_id
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- 5. Recreate portfolio_tags (many-to-many)
    CREATE TABLE portfolio_tags (
      portfolio_id INT NOT NULL,
      tag_id       INT NOT NULL,
      PRIMARY KEY (portfolio_id, tag_id),
      CONSTRAINT fk_pt_portfolio
        FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
      CONSTRAINT fk_pt_tag
        FOREIGN KEY (tag_id)       REFERENCES tags(id)       ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    callback
  );
};

exports.down = function (db, callback) {
  db.runSql(
    `DROP TABLE IF EXISTS portfolio_tags;
     DROP TABLE IF EXISTS contact_status_audits;
     DROP TABLE IF EXISTS contacts;
     DROP TABLE IF EXISTS portfolios;`,
    callback
  );
};

exports._meta = { version: 1 };

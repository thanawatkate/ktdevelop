'use strict';

// Consolidated migration: Full initial schema
// รวม migration 001–015 เข้าเป็นไฟล์เดียว

exports.up = function (db, callback) {
  db.runSql(
    `-- 1. user_groups
    CREATE TABLE IF NOT EXISTS user_groups (
      id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
      code       VARCHAR(50)  NOT NULL,
      name       VARCHAR(100) NOT NULL,
      created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_user_groups_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    INSERT INTO user_groups (code, name)
    VALUES ('admin', 'Administrators')
    ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = CURRENT_TIMESTAMP;

    -- 2. admin_users
    CREATE TABLE IF NOT EXISTS admin_users (
      id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_group_id INT UNSIGNED NOT NULL,
      username      VARCHAR(255) NOT NULL,
      email         VARCHAR(255) NOT NULL,
      password_hash CHAR(64)     NOT NULL,
      is_active     TINYINT(1)   NOT NULL DEFAULT 1,
      created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_admin_users_username (username),
      UNIQUE KEY uq_admin_users_email (email),
      KEY idx_admin_users_group (user_group_id),
      CONSTRAINT fk_admin_users_user_group
        FOREIGN KEY (user_group_id) REFERENCES user_groups (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- 3. portfolios
    CREATE TABLE IF NOT EXISTS portfolios (
      id           INT         AUTO_INCREMENT PRIMARY KEY,
      title        VARCHAR(255) NOT NULL,
      description  TEXT,
      client_name  VARCHAR(255) NOT NULL DEFAULT '',
      image_url    VARCHAR(500),
      is_published TINYINT(1)   NOT NULL DEFAULT 0,
      created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at   DATETIME     NULL DEFAULT NULL,
      INDEX idx_portfolios_is_published (is_published),
      INDEX idx_portfolios_created_at   (created_at),
      INDEX idx_portfolios_deleted_at   (deleted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- 4. tags
    CREATE TABLE IF NOT EXISTS tags (
      id   INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL,
      UNIQUE KEY uq_tags_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- 5. contacts
    CREATE TABLE IF NOT EXISTS contacts (
      id               INT         AUTO_INCREMENT PRIMARY KEY,
      sender_name      VARCHAR(255) NOT NULL,
      email            VARCHAR(255) NOT NULL,
      phone            VARCHAR(20)  NULL,
      line_id          VARCHAR(255) NULL,
      facebook_url     VARCHAR(500) NULL,
      instagram_handle VARCHAR(255) NULL,
      subject          VARCHAR(255) NOT NULL,
      message          TEXT         NOT NULL,
      file_url         VARCHAR(500),
      status           VARCHAR(20)  NOT NULL DEFAULT 'new',
      created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at       DATETIME     NULL DEFAULT NULL,
      INDEX idx_contacts_email      (email),
      INDEX idx_contacts_status     (status),
      INDEX idx_contacts_created_at (created_at),
      INDEX idx_contacts_deleted_at (deleted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- 6. contact_status_audits
    CREATE TABLE IF NOT EXISTS contact_status_audits (
      id         INT         AUTO_INCREMENT PRIMARY KEY,
      contact_id INT         NOT NULL,
      old_status VARCHAR(20),
      new_status VARCHAR(20) NOT NULL,
      changed_by VARCHAR(255) NOT NULL DEFAULT 'admin',
      changed_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_status_audits_contact_id (contact_id),
      INDEX idx_status_audits_changed_at (changed_at),
      CONSTRAINT fk_status_audits_contact_id
        FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- 7. portfolio_tags
    CREATE TABLE IF NOT EXISTS portfolio_tags (
      portfolio_id INT NOT NULL,
      tag_id       INT NOT NULL,
      PRIMARY KEY (portfolio_id, tag_id),
      CONSTRAINT fk_pt_portfolio
        FOREIGN KEY (portfolio_id) REFERENCES portfolios (id) ON DELETE CASCADE,
      CONSTRAINT fk_pt_tag
        FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- 8. localized_content
    CREATE TABLE IF NOT EXISTS localized_content (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      locale     VARCHAR(5)   NOT NULL,
      section    VARCHAR(50)  NOT NULL,
      key_name   VARCHAR(100) NOT NULL,
      content    LONGTEXT     NOT NULL,
      createdAt  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME     NULL DEFAULT NULL,
      UNIQUE KEY unique_locale_section_key (locale, section, key_name),
      INDEX idx_locale_section              (locale, section),
      INDEX idx_localized_content_deleted_at (deleted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    callback
  );
};

exports.down = function (db, callback) {
  db.runSql(
    `DROP TABLE IF EXISTS portfolio_tags;
     DROP TABLE IF EXISTS contact_status_audits;
     DROP TABLE IF EXISTS contacts;
     DROP TABLE IF EXISTS portfolios;
     DROP TABLE IF EXISTS tags;
     DROP TABLE IF EXISTS localized_content;
     DROP TABLE IF EXISTS admin_users;
     DROP TABLE IF EXISTS user_groups;`,
    callback
  );
};

exports._meta = { version: 1 };

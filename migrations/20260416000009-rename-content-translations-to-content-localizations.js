'use strict';

exports.up = function (db, callback) {
  db.runSql(
    `CREATE TABLE IF NOT EXISTS content_localizations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      locale VARCHAR(5) NOT NULL,
      section VARCHAR(50) NOT NULL,
      key_name VARCHAR(100) NOT NULL,
      content LONGTEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_locale_section_key (locale, section, key_name),
      INDEX idx_locale_section (locale, section)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    INSERT INTO content_localizations (locale, section, key_name, content, createdAt, updatedAt)
    SELECT locale, section, key_name, content, createdAt, updatedAt
    FROM content_translations
    ON DUPLICATE KEY UPDATE
      content = VALUES(content),
      updatedAt = VALUES(updatedAt);

    DROP TABLE IF EXISTS content_translations;`,
    callback
  );
};

exports.down = function (db, callback) {
  db.runSql(
    `CREATE TABLE IF NOT EXISTS content_translations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      locale VARCHAR(5) NOT NULL,
      section VARCHAR(50) NOT NULL,
      key_name VARCHAR(100) NOT NULL,
      content LONGTEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_locale_section_key (locale, section, key_name),
      INDEX idx_locale_section (locale, section)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    INSERT INTO content_translations (locale, section, key_name, content, createdAt, updatedAt)
    SELECT locale, section, key_name, content, createdAt, updatedAt
    FROM content_localizations
    ON DUPLICATE KEY UPDATE
      content = VALUES(content),
      updatedAt = VALUES(updatedAt);

    DROP TABLE IF EXISTS content_localizations;`,
    callback
  );
};

exports._meta = { version: 1 };

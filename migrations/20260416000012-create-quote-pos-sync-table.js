'use strict';

exports.up = function (db, callback) {
  db.runSql(
    `CREATE TABLE IF NOT EXISTS quote_pos_sync (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      quote_id INT NOT NULL,
      quote_number VARCHAR(50) NOT NULL,
      status ENUM('pending', 'synced', 'failed') NOT NULL DEFAULT 'pending',
      attempt_count INT NOT NULL DEFAULT 0,
      last_error TEXT,
      last_attempt_at DATETIME NULL,
      next_retry_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_quote_pos_sync_quote_id (quote_id),
      UNIQUE KEY uq_quote_pos_sync_quote_number (quote_number),
      KEY idx_quote_pos_sync_status_retry (status, next_retry_at),
      CONSTRAINT fk_quote_pos_sync_quote
        FOREIGN KEY (quote_id) REFERENCES quotes(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    callback
  );
};

exports.down = function (db, callback) {
  db.runSql('DROP TABLE IF EXISTS quote_pos_sync;', callback);
};

exports._meta = { version: 1 };

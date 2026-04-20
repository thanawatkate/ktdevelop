'use strict';

exports.up = function (db, callback) {
  db.runSql(
    `DROP TABLE IF EXISTS quote_pos_sync;
     DROP TABLE IF EXISTS quote_items;
     DROP TABLE IF EXISTS quotes;
     DROP TABLE IF EXISTS service_packages;`,
    callback
  );
};

exports.down = function (db, callback) {
  db.runSql(
    `CREATE TABLE IF NOT EXISTS service_packages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      base_price DECIMAL(10, 2) NOT NULL,
      features JSON,
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_active (is_active),
      KEY idx_sort_order (sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS quotes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      quote_number VARCHAR(50) UNIQUE NOT NULL,
      client_name VARCHAR(255) NOT NULL,
      client_email VARCHAR(255) NOT NULL,
      client_phone VARCHAR(20),
      service_package_id INT NOT NULL,
      base_price DECIMAL(10, 2) NOT NULL,
      additional_requirements TEXT,
      total_price DECIMAL(10, 2) NOT NULL,
      discount_percent DECIMAL(5, 2) DEFAULT 0,
      discount_amount DECIMAL(10, 2) DEFAULT 0,
      final_price DECIMAL(10, 2) NOT NULL,
      status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired') DEFAULT 'draft',
      notes TEXT,
      valid_until DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (service_package_id) REFERENCES service_packages(id),
      KEY idx_status (status),
      KEY idx_client_email (client_email),
      KEY idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS quote_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      quote_id INT NOT NULL,
      description VARCHAR(255) NOT NULL,
      quantity DECIMAL(10, 2) DEFAULT 1,
      unit_price DECIMAL(10, 2) NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL,
      item_type ENUM('base', 'addon', 'extra') DEFAULT 'base',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
      KEY idx_quote_id (quote_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS quote_pos_sync (
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

exports._meta = { version: 1 };
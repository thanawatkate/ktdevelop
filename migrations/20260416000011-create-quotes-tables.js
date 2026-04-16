/**
 * Migration: Create quotes and packages tables
 * Description: Creates tables for storing service packages and generated quotes
 * 
 * Tables:
 * - service_packages: Predefined packages with base pricing
 * - quotes: Generated quotes with package selection and customization
 * - quote_items: Line items within each quote (base package + add-ons)
 */

exports.up = async function(db) {
  // Create service_packages table
  await db.runSql(`
    CREATE TABLE IF NOT EXISTS service_packages (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Create quotes table
  await db.runSql(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Create quote_items table
  await db.runSql(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

exports.down = async function(db) {
  await db.runSql('DROP TABLE IF EXISTS quote_items');
  await db.runSql('DROP TABLE IF EXISTS quotes');
  await db.runSql('DROP TABLE IF EXISTS service_packages');
};

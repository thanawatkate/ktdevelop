CREATE DATABASE IF NOT EXISTS ktdevelop_db;
USE ktdevelop_db;

DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS portfolios;
DROP TABLE IF EXISTS contact_status_audits;

CREATE TABLE portfolios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  image_url VARCHAR(500) NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_portfolios_is_published (is_published),
  INDEX idx_portfolios_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contacts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sender_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  file_url VARCHAR(500) NULL,
  status ENUM('new', 'in_progress', 'closed') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_contacts_email (email),
  INDEX idx_contacts_status (status),
  INDEX idx_contacts_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contact_status_audits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  contact_id INT UNSIGNED NOT NULL,
  old_status ENUM('new', 'in_progress', 'closed') NULL,
  new_status ENUM('new', 'in_progress', 'closed') NOT NULL,
  changed_by VARCHAR(255) NOT NULL DEFAULT 'admin',
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_contact_status_audits_contact_id (contact_id),
  INDEX idx_contact_status_audits_changed_at (changed_at),
  CONSTRAINT fk_contact_status_audits_contact_id
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO portfolios (title, description, client_name, image_url, is_published) VALUES
  (
    'Multi-Branch ERP Rollout',
    'Built a procurement, inventory, and finance ERP platform for a manufacturing group across 12 plants with role-based approvals and KPI dashboards.',
    'Siam Industrial Components Co., Ltd.',
    'https://images.example.com/portfolio/erp-rollout.jpg',
    1
  ),
  (
    'B2B e-Ordering Portal',
    'Developed a self-service wholesale ordering portal integrated with SAP and dynamic pricing rules for tiered distributors in Southeast Asia.',
    'Nexa Consumer Distribution Public Co., Ltd.',
    'https://images.example.com/portfolio/b2b-ordering.jpg',
    1
  ),
  (
    'Logistics Visibility Platform',
    'Implemented shipment tracking with milestone alerts, ETA prediction, and SLA analytics for domestic and cross-border freight operations.',
    'TransBridge Logistics Group',
    'https://images.example.com/portfolio/logistics-visibility.jpg',
    1
  ),
  (
    'Corporate Data Lake Modernization',
    'Delivered cloud data ingestion pipelines, governed BI data marts, and executive scorecards for quarterly business review workflows.',
    'Aurora Energy Services',
    'https://images.example.com/portfolio/data-lake-modernization.jpg',
    0
  );

USE ktdevelop_db;

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS status ENUM('new', 'in_progress', 'closed') NOT NULL DEFAULT 'new' AFTER file_url;

ALTER TABLE contacts
  ADD INDEX IF NOT EXISTS idx_contacts_status (status);

CREATE TABLE IF NOT EXISTS contact_status_audits (
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
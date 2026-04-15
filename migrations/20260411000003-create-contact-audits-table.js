'use strict';

exports.up = function (db, callback) {
  db.runSql(
    `CREATE TABLE IF NOT EXISTS contact_audits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      contactId INT NOT NULL,
      previousStatus VARCHAR(20),
      newStatus VARCHAR(20) NOT NULL,
      changedBy VARCHAR(255),
      reason TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_contact_audits_contactId
        FOREIGN KEY (contactId) REFERENCES contacts(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    callback
  );
};

exports.down = function (db, callback) {
  db.runSql('DROP TABLE IF EXISTS contact_audits;', callback);
};

exports._meta = { version: 1 };


'use strict';

// เพิ่ม INDEX ทุก column ที่ใช้ filter/join บ่อย
exports.up = function (db, callback) {
  db.runSql(
    `-- contacts: ค้นหาตาม email, กรองตาม status, เรียงตาม createdAt
    ALTER TABLE contacts
      ADD INDEX idx_contacts_email    (email),
      ADD INDEX idx_contacts_status   (status),
      ADD INDEX idx_contacts_created  (createdAt);

    -- contact_audits: join กลับหา contacts, เรียงตาม createdAt
    ALTER TABLE contact_audits
      ADD INDEX idx_audits_contactId  (contactId),
      ADD INDEX idx_audits_created    (createdAt);

    -- portfolios: เรียงตาม createdAt (แสดง grid)
    ALTER TABLE portfolios
      ADD INDEX idx_portfolios_created (createdAt);`,
    callback
  );
};

exports.down = function (db, callback) {
  db.runSql(
    `ALTER TABLE contacts
      DROP INDEX idx_contacts_email,
      DROP INDEX idx_contacts_status,
      DROP INDEX idx_contacts_created;

    ALTER TABLE contact_audits
      DROP INDEX idx_audits_contactId,
      DROP INDEX idx_audits_created;

    ALTER TABLE portfolios
      DROP INDEX idx_portfolios_created;`,
    callback
  );
};

exports._meta = { version: 1 };

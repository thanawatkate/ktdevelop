'use strict';

exports.up = function (db, callback) {
  db.runSql(
    `ALTER TABLE contacts
      ADD COLUMN phone VARCHAR(20) NULL AFTER email,
      ADD COLUMN line_id VARCHAR(255) NULL AFTER phone,
      ADD COLUMN facebook_url VARCHAR(500) NULL AFTER line_id,
      ADD COLUMN instagram_handle VARCHAR(255) NULL AFTER facebook_url;`,
    callback
  );
};

exports.down = function (db, callback) {
  db.runSql(
    `ALTER TABLE contacts
      DROP COLUMN IF EXISTS phone,
      DROP COLUMN IF EXISTS line_id,
      DROP COLUMN IF EXISTS facebook_url,
      DROP COLUMN IF EXISTS instagram_handle;`,
    callback
  );
};

exports._meta = { version: 1 };

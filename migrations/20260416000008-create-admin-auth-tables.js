'use strict';

exports.up = function (db, callback) {
  db.runSql(
    `CREATE TABLE IF NOT EXISTS user_groups (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      code VARCHAR(50) NOT NULL,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_user_groups_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS admin_users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_group_id INT UNSIGNED NOT NULL,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_hash CHAR(64) NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_admin_users_username (username),
      UNIQUE KEY uq_admin_users_email (email),
      KEY idx_admin_users_group (user_group_id),
      CONSTRAINT fk_admin_users_user_group
        FOREIGN KEY (user_group_id) REFERENCES user_groups(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    INSERT INTO user_groups (code, name)
    VALUES ('admin', 'Administrators')
    ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = CURRENT_TIMESTAMP;`,
    callback
  );
};

exports.down = function (db, callback) {
  db.runSql(
    `DROP TABLE IF EXISTS admin_users;
     DROP TABLE IF EXISTS user_groups;`,
    callback
  );
};

exports._meta = {
  version: 1,
};

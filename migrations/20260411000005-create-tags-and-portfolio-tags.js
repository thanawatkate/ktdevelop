'use strict';

// tags: ตาราง master สำหรับ label เช่น "React", "Node.js", "UI/UX"
// portfolio_tags: many-to-many ระหว่าง portfolios <-> tags
exports.up = function (db, callback) {
  db.runSql(
    `CREATE TABLE IF NOT EXISTS tags (
      id    INT AUTO_INCREMENT PRIMARY KEY,
      name  VARCHAR(100) NOT NULL,
      slug  VARCHAR(100) NOT NULL,
      UNIQUE KEY uq_tags_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS portfolio_tags (
      portfolioId INT NOT NULL,
      tagId       INT NOT NULL,
      PRIMARY KEY (portfolioId, tagId),
      CONSTRAINT fk_pt_portfolio
        FOREIGN KEY (portfolioId) REFERENCES portfolios(id) ON DELETE CASCADE,
      CONSTRAINT fk_pt_tag
        FOREIGN KEY (tagId)       REFERENCES tags(id)       ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    callback
  );
};

exports.down = function (db, callback) {
  db.runSql(
    `DROP TABLE IF EXISTS portfolio_tags;
     DROP TABLE IF EXISTS tags;`,
    callback
  );
};

exports._meta = { version: 1 };

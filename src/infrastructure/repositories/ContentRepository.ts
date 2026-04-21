import { dbPool } from '../db';

interface ContentRow {
  id: number;
  locale: string;
  section: string;
  key_name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export class ContentRepository {
  async getBySection(locale: string, section: string): Promise<Record<string, string>> {
    try {
      const [rows] = await dbPool.query(
        'SELECT key_name, content FROM localized_content WHERE locale = ? AND section = ?',
        [locale, section]
      );

      const result: Record<string, string> = {};
      (rows as ContentRow[]).forEach((row) => {
        result[row.key_name] = row.content;
      });

      return result;
    } catch (error) {
      console.error('Error fetching content:', error);
      return {};
    }
  }

  async getByKey(locale: string, section: string, key: string): Promise<string | null> {
    try {
      const [rows] = await dbPool.query(
        'SELECT content FROM localized_content WHERE locale = ? AND section = ? AND key_name = ?',
        [locale, section, key]
      );

      const result = rows as ContentRow[];
      return result.length > 0 ? result[0].content : null;
    } catch (error) {
      console.error('Error fetching content:', error);
      return null;
    }
  }

  async upsert(locale: string, section: string, key: string, content: string): Promise<boolean> {
    try {
      await dbPool.query(
        `INSERT INTO localized_content (locale, section, key_name, content)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE content = VALUES(content), updatedAt = CURRENT_TIMESTAMP`,
        [locale, section, key, content]
      );
      return true;
    } catch (error) {
      console.error('Error upserting content:', error);
      return false;
    }
  }

  async getAllSections(locale: string): Promise<Record<string, Record<string, string>>> {
    try {
      const [rows] = await dbPool.query(
        'SELECT section, key_name, content FROM localized_content WHERE locale = ? ORDER BY section, key_name',
        [locale]
      );

      const result: Record<string, Record<string, string>> = {};
      (rows as ContentRow[]).forEach((row) => {
        if (!result[row.section]) {
          result[row.section] = {};
        }
        result[row.section][row.key_name] = row.content;
      });

      return result;
    } catch (error) {
      console.error('Error fetching all sections:', error);
      return {};
    }
  }

  async upsertMany(locale: string, section: string, entries: Record<string, string>): Promise<boolean> {
    const keys = Object.keys(entries);
    if (keys.length === 0) {
      return true;
    }

    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      for (const key of keys) {
        const value = entries[key];
        await connection.query(
          `INSERT INTO localized_content (locale, section, key_name, content)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE content = VALUES(content), updatedAt = CURRENT_TIMESTAMP`,
          [locale, section, key, value]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error("Error upserting section content:", error);
      return false;
    } finally {
      connection.release();
    }
  }

  async deleteKeys(locale: string, section: string, keys: string[]): Promise<boolean> {
    if (keys.length === 0) return true;
    try {
      await dbPool.query(
        `DELETE FROM localized_content WHERE locale = ? AND section = ? AND key_name IN (${keys.map(() => "?").join(",")})`,
        [locale, section, ...keys]
      );
      return true;
    } catch (error) {
      console.error("Error deleting content keys:", error);
      return false;
    }
  }
}

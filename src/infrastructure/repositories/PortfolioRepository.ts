import { RowDataPacket, ResultSetHeader } from "mysql2";
import { dbPool } from "../db";
import { sanitizeMultilineInput, sanitizeOptionalUrl, sanitizeTextInput } from "../../core/security/sanitize";

export interface Portfolio {
  id: number;
  title: string;
  description: string;
  client_name: string;
  image_url: string | null;
  is_published: number;
  created_at: Date;
}

export interface CreatePortfolioInput {
  title: string;
  description: string;
  client_name: string;
  image_url?: string | null;
  is_published?: boolean;
}

export interface UpdatePortfolioInput {
  title?: string;
  description?: string;
  client_name?: string;
  image_url?: string | null;
  is_published?: boolean;
}

export class PortfolioRepository {
  private sanitizeCreateInput(input: CreatePortfolioInput) {
    return {
      title: sanitizeTextInput(input.title, 255),
      description: sanitizeMultilineInput(input.description, 5000),
      client_name: sanitizeTextInput(input.client_name, 255),
      image_url: sanitizeOptionalUrl(input.image_url),
      is_published: Boolean(input.is_published),
    };
  }

  private sanitizeUpdateInput(input: UpdatePortfolioInput) {
    return {
      title: input.title === undefined ? undefined : sanitizeTextInput(input.title, 255),
      description: input.description === undefined ? undefined : sanitizeMultilineInput(input.description, 5000),
      client_name: input.client_name === undefined ? undefined : sanitizeTextInput(input.client_name, 255),
      image_url: input.image_url === undefined ? undefined : sanitizeOptionalUrl(input.image_url),
      is_published: input.is_published,
    };
  }

  async getAll(): Promise<Portfolio[]> {
    const [rows] = await dbPool.query<(Portfolio & RowDataPacket)[]>(
      "SELECT id, title, description, client_name, image_url, is_published, created_at FROM portfolios ORDER BY created_at DESC"
    );
    return rows;
  }

  async getAllPublished(): Promise<Portfolio[]> {
    const [rows] = await dbPool.query<(Portfolio & RowDataPacket)[]>(
      "SELECT id, title, description, client_name, image_url, is_published, created_at FROM portfolios WHERE is_published = 1 ORDER BY created_at DESC"
    );
    return rows;
  }

  async getById(id: number): Promise<Portfolio | null> {
    const [rows] = await dbPool.query<(Portfolio & RowDataPacket)[]>(
      "SELECT id, title, description, client_name, image_url, is_published, created_at FROM portfolios WHERE id = ? LIMIT 1",
      [id]
    );
    return rows[0] || null;
  }

  async create(input: CreatePortfolioInput): Promise<Portfolio> {
    const sanitizedInput = this.sanitizeCreateInput(input);

    const [result] = await dbPool.execute<ResultSetHeader>(
      "INSERT INTO portfolios (title, description, client_name, image_url, is_published) VALUES (?, ?, ?, ?, ?)",
      [
        sanitizedInput.title,
        sanitizedInput.description,
        sanitizedInput.client_name,
        sanitizedInput.image_url,
        sanitizedInput.is_published ? 1 : 0,
      ]
    );

    const created = await this.getById(result.insertId);
    if (!created) {
      throw new Error("Failed to create portfolio.");
    }
    return created;
  }

  async update(id: number, input: UpdatePortfolioInput): Promise<Portfolio | null> {
    const sanitizedInput = this.sanitizeUpdateInput(input);
    const current = await this.getById(id);
    if (!current) {
      return null;
    }

    await dbPool.execute<ResultSetHeader>(
      "UPDATE portfolios SET title = ?, description = ?, client_name = ?, image_url = ?, is_published = ? WHERE id = ?",
      [
        sanitizedInput.title ?? current.title,
        sanitizedInput.description ?? current.description,
        sanitizedInput.client_name ?? current.client_name,
        sanitizedInput.image_url ?? current.image_url,
        typeof sanitizedInput.is_published === "boolean" ? (sanitizedInput.is_published ? 1 : 0) : current.is_published,
        id,
      ]
    );

    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      "DELETE FROM portfolios WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }
}

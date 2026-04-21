import { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../db";
import { sanitizeEmail, sanitizeMultilineInput, sanitizeOptionalUrl, sanitizeTextInput } from "../../core/security/sanitize";

export interface Contact {
  id: number;
  sender_name: string;
  email: string;
  phone: string | null;
  line_id: string | null;
  facebook_url: string | null;
  instagram_handle: string | null;
  subject: string;
  message: string;
  file_url: string | null;
  status: ContactStatus;
  created_at: Date;
}

export type ContactStatus = "new" | "in_progress" | "closed";

export interface CreateContactInput {
  sender_name: string;
  email: string;
  phone?: string | null;
  line_id?: string | null;
  facebook_url?: string | null;
  instagram_handle?: string | null;
  subject: string;
  message: string;
  file_url?: string | null;
  status?: ContactStatus;
}

export interface UpdateContactInput {
  sender_name?: string;
  email?: string;
  phone?: string | null;
  line_id?: string | null;
  facebook_url?: string | null;
  instagram_handle?: string | null;
  subject?: string;
  message?: string;
  file_url?: string | null;
  status?: ContactStatus;
}

export interface ContactListFilters {
  search?: string;
  limit?: number;
  offset?: number;
  fromDate?: string;
  toDate?: string;
  status?: ContactStatus | "all";
}

export interface ContactStatusAudit {
  id: number;
  contact_id: number;
  old_status: ContactStatus | null;
  new_status: ContactStatus;
  changed_by: string;
  changed_at: Date;
}

export interface ContactLeadKpi {
  total: number;
  newCount: number;
  inProgressCount: number;
  closedCount: number;
  overdueNewCount: number;
}

export interface ContactLeadTrendPoint {
  date: string;
  total: number;
}

export class ContactRepository {
  private sanitizeStatus(value: unknown): ContactStatus | null {
    if (value === "new" || value === "in_progress" || value === "closed") {
      return value;
    }

    return null;
  }

  private sanitizeActor(value: unknown): string {
    if (typeof value !== "string") {
      return "admin";
    }

    const actor = sanitizeTextInput(value, 255);
    return actor || "admin";
  }

  private sanitizeCreateInput(input: CreateContactInput) {
    return {
      sender_name: sanitizeTextInput(input.sender_name, 255),
      email: sanitizeEmail(input.email),
      phone: input.phone ? sanitizeTextInput(input.phone, 20) : null,
      line_id: input.line_id ? sanitizeTextInput(input.line_id, 255) : null,
      facebook_url: input.facebook_url ? sanitizeOptionalUrl(input.facebook_url) : null,
      instagram_handle: input.instagram_handle ? sanitizeTextInput(input.instagram_handle, 255) : null,
      subject: sanitizeTextInput(input.subject, 255),
      message: sanitizeMultilineInput(input.message, 5000),
      file_url: sanitizeOptionalUrl(input.file_url),
      status: this.sanitizeStatus(input.status) ?? "new",
    };
  }

  private sanitizeUpdateInput(input: UpdateContactInput) {
    return {
      sender_name: input.sender_name === undefined ? undefined : sanitizeTextInput(input.sender_name, 255),
      email: input.email === undefined ? undefined : sanitizeEmail(input.email),
      phone: input.phone === undefined ? undefined : (input.phone ? sanitizeTextInput(input.phone, 20) : null),
      line_id: input.line_id === undefined ? undefined : (input.line_id ? sanitizeTextInput(input.line_id, 255) : null),
      facebook_url: input.facebook_url === undefined ? undefined : (input.facebook_url ? sanitizeOptionalUrl(input.facebook_url) : null),
      instagram_handle: input.instagram_handle === undefined ? undefined : (input.instagram_handle ? sanitizeTextInput(input.instagram_handle, 255) : null),
      subject: input.subject === undefined ? undefined : sanitizeTextInput(input.subject, 255),
      message: input.message === undefined ? undefined : sanitizeMultilineInput(input.message, 5000),
      file_url: input.file_url === undefined ? undefined : sanitizeOptionalUrl(input.file_url),
      status: input.status === undefined ? undefined : this.sanitizeStatus(input.status),
    };
  }

  private buildFilterQuery(filters: ContactListFilters = {}) {
    const search = filters.search ? sanitizeTextInput(filters.search, 200) : "";
    const fromDate = filters.fromDate ? sanitizeTextInput(filters.fromDate, 10) : "";
    const toDate = filters.toDate ? sanitizeTextInput(filters.toDate, 10) : "";
    const status = this.sanitizeStatus(filters.status);

    const params: Array<string | number> = [];
    const whereClauses: string[] = ["deleted_at IS NULL"];

    if (search) {
      const likeQuery = `%${search}%`;
      whereClauses.push("(sender_name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)");
      params.push(likeQuery, likeQuery, likeQuery, likeQuery);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) {
      whereClauses.push("DATE(created_at) >= ?");
      params.push(fromDate);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
      whereClauses.push("DATE(created_at) <= ?");
      params.push(toDate);
    }

    if (status) {
      whereClauses.push("status = ?");
      params.push(status);
    }

    return {
      whereSql: whereClauses.length > 0 ? ` WHERE ${whereClauses.join(" AND ")}` : "",
      params,
    };
  }

  async getAll(): Promise<Contact[]> {
    const [rows] = await dbPool.query<(Contact & RowDataPacket)[]>(
      "SELECT id, sender_name, email, phone, line_id, facebook_url, instagram_handle, subject, message, file_url, status, created_at FROM contacts WHERE deleted_at IS NULL ORDER BY created_at DESC"
    );
    return rows;
  }

  async getAllWithFilters(filters: ContactListFilters = {}): Promise<Contact[]> {
    const limit = Math.max(1, Math.min(100, filters.limit ?? 20));
    const offset = Math.max(0, filters.offset ?? 0);
    const { whereSql, params } = this.buildFilterQuery(filters);
    let sql = "SELECT id, sender_name, email, phone, line_id, facebook_url, instagram_handle, subject, message, file_url, status, created_at FROM contacts";

    sql += whereSql;

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await dbPool.query<(Contact & RowDataPacket)[]>(sql, params);
    return rows;
  }

  async countWithFilters(filters: ContactListFilters = {}): Promise<number> {
    const { whereSql, params } = this.buildFilterQuery(filters);
    const sql = `SELECT COUNT(*) AS total FROM contacts${whereSql}`;
    const [rows] = await dbPool.query<Array<RowDataPacket & { total: number }>>(sql, params);
    return rows[0]?.total ?? 0;
  }

  async deleteMany(ids: number[]): Promise<number> {
    const validIds = Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0)));
    if (validIds.length === 0) {
      return 0;
    }

    const placeholders = validIds.map(() => "?").join(",");
    const [result] = await dbPool.execute<ResultSetHeader>(
      `UPDATE contacts SET deleted_at = NOW() WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      validIds
    );

    return result.affectedRows;
  }

  async getById(id: number): Promise<Contact | null> {
    const [rows] = await dbPool.query<(Contact & RowDataPacket)[]>(
      "SELECT id, sender_name, email, phone, line_id, facebook_url, instagram_handle, subject, message, file_url, status, created_at FROM contacts WHERE id = ? AND deleted_at IS NULL LIMIT 1",
      [id]
    );
    return rows[0] || null;
  }

  async create(input: CreateContactInput): Promise<Contact> {
    const sanitizedInput = this.sanitizeCreateInput(input);

    const [result] = await dbPool.execute<ResultSetHeader>(
      "INSERT INTO contacts (sender_name, email, phone, line_id, facebook_url, instagram_handle, subject, message, file_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        sanitizedInput.sender_name,
        sanitizedInput.email,
        sanitizedInput.phone,
        sanitizedInput.line_id,
        sanitizedInput.facebook_url,
        sanitizedInput.instagram_handle,
        sanitizedInput.subject,
        sanitizedInput.message,
        sanitizedInput.file_url,
        sanitizedInput.status,
      ]
    );

    const created = await this.getById(result.insertId);
    if (!created) {
      throw new Error("Failed to create contact.");
    }
    return created;
  }

  async update(id: number, input: UpdateContactInput): Promise<Contact | null> {
    const sanitizedInput = this.sanitizeUpdateInput(input);
    const current = await this.getById(id);
    if (!current) {
      return null;
    }

    await dbPool.execute<ResultSetHeader>(
      "UPDATE contacts SET sender_name = ?, email = ?, phone = ?, line_id = ?, facebook_url = ?, instagram_handle = ?, subject = ?, message = ?, file_url = ?, status = ? WHERE id = ?",
      [
        sanitizedInput.sender_name ?? current.sender_name,
        sanitizedInput.email ?? current.email,
        sanitizedInput.phone ?? current.phone,
        sanitizedInput.line_id ?? current.line_id,
        sanitizedInput.facebook_url ?? current.facebook_url,
        sanitizedInput.instagram_handle ?? current.instagram_handle,
        sanitizedInput.subject ?? current.subject,
        sanitizedInput.message ?? current.message,
        sanitizedInput.file_url ?? current.file_url,
        sanitizedInput.status ?? current.status,
        id,
      ]
    );

    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      "UPDATE contacts SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    return result.affectedRows > 0;
  }

  async updateStatus(id: number, status: ContactStatus, changedBy: string = "admin"): Promise<Contact | null> {
    const sanitizedStatus = this.sanitizeStatus(status);
    if (!sanitizedStatus) {
      return null;
    }

    const current = await this.getById(id);
    if (!current) {
      return null;
    }

    const actor = this.sanitizeActor(changedBy);

    const [result] = await dbPool.execute<ResultSetHeader>(
      "UPDATE contacts SET status = ? WHERE id = ?",
      [sanitizedStatus, id]
    );

    if (result.affectedRows === 0) {
      return null;
    }

    if (current.status !== sanitizedStatus) {
      await dbPool.execute<ResultSetHeader>(
        "INSERT INTO contact_status_audits (contact_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)",
        [id, current.status, sanitizedStatus, actor]
      );
    }

    return this.getById(id);
  }

  async getStatusAudits(options: { limit?: number; offset?: number; contactId?: number } = {}): Promise<ContactStatusAudit[]> {
    const limit = Math.max(1, Math.min(200, options.limit ?? 20));
    const offset = Math.max(0, options.offset ?? 0);
    const contactId = options.contactId && Number.isInteger(options.contactId) && options.contactId > 0 ? options.contactId : null;

    let sql =
      "SELECT id, contact_id, old_status, new_status, changed_by, changed_at FROM contact_status_audits";
    const params: Array<number> = [];

    if (contactId) {
      sql += " WHERE contact_id = ?";
      params.push(contactId);
    }

    sql += " ORDER BY changed_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await dbPool.query<(ContactStatusAudit & RowDataPacket)[]>(sql, params);
    return rows;
  }

  async getLeadKpi(slaDays: number): Promise<ContactLeadKpi> {
    const safeSlaDays = Number.isFinite(slaDays) && slaDays > 0 ? Math.floor(slaDays) : 3;
    const [rows] = await dbPool.query<
      Array<
        RowDataPacket & {
          total: number;
          new_count: number;
          in_progress_count: number;
          closed_count: number;
          overdue_new_count: number;
        }
      >
    >(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS new_count,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_count,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed_count,
        SUM(CASE WHEN status = 'new' AND TIMESTAMPDIFF(DAY, created_at, NOW()) >= ? THEN 1 ELSE 0 END) AS overdue_new_count
      FROM contacts`,
      [safeSlaDays]
    );

    const row = rows[0];
    return {
      total: Number(row?.total || 0),
      newCount: Number(row?.new_count || 0),
      inProgressCount: Number(row?.in_progress_count || 0),
      closedCount: Number(row?.closed_count || 0),
      overdueNewCount: Number(row?.overdue_new_count || 0),
    };
  }

  async getLeadTrend(days: number): Promise<ContactLeadTrendPoint[]> {
    const safeDays = Number.isFinite(days) && days > 0 ? Math.min(90, Math.floor(days)) : 7;
    const rangeDays = Math.max(1, safeDays - 1);

    const [rows] = await dbPool.query<
      Array<
        RowDataPacket & {
          trend_date: string | Date;
          total: number;
        }
      >
    >(
      `SELECT DATE(created_at) AS trend_date, COUNT(*) AS total
       FROM contacts
       WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`,
      [rangeDays]
    );

    const totalsByDate = new Map<string, number>();
    for (const row of rows) {
      const key =
        typeof row.trend_date === "string"
          ? row.trend_date.slice(0, 10)
          : new Date(row.trend_date).toISOString().slice(0, 10);
      totalsByDate.set(key, Number(row.total || 0));
    }

    const result: ContactLeadTrendPoint[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = safeDays - 1; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      result.push({
        date: key,
        total: totalsByDate.get(key) || 0,
      });
    }

    return result;
  }
}

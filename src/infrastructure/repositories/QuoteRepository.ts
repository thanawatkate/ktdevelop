import { dbPool } from '../db';

export interface ServicePackage {
  id: number;
  name: string;
  description: string;
  base_price: number;
  features: string[];
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface QuoteItem {
  id: number;
  quote_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_type: 'base' | 'addon' | 'extra';
  created_at: Date;
}

export interface Quote {
  id: number;
  quote_number: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  service_package_id: number;
  base_price: number;
  additional_requirements?: string;
  total_price: number;
  discount_percent: number;
  discount_amount: number;
  final_price: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  valid_until?: Date;
  created_at: Date;
  updated_at: Date;
  items?: QuoteItem[];
}

export class QuoteRepository {
  /**
   * Get all active service packages
   */
  async getAllPackages(): Promise<ServicePackage[]> {
    const connection = await dbPool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM service_packages 
         WHERE is_active = TRUE 
         ORDER BY sort_order ASC, name ASC`
      );
      return (rows as any[]).map(row => ({
        ...row,
        features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features || []
      }));
    } finally {
      connection.release();
    }
  }

  /**
   * Get single package by ID
   */
  async getPackageById(packageId: number): Promise<ServicePackage | null> {
    const connection = await dbPool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM service_packages WHERE id = ?`,
        [packageId]
      );
      if ((rows as any[]).length === 0) return null;
      
      const row = (rows as any[])[0];
      return {
        ...row,
        features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features || []
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Create a new quote
   */
  async createQuote(quote: Omit<Quote, 'id' | 'created_at' | 'updated_at'> & { quote_number: string }): Promise<Quote> {
    const connection = await dbPool.getConnection();
    try {
      const {
        quote_number,
        client_name,
        client_email,
        client_phone,
        service_package_id,
        base_price,
        additional_requirements,
        total_price,
        discount_percent,
        discount_amount,
        final_price,
        status,
        notes,
        valid_until
      } = quote;

      const [result] = await connection.query(
        `INSERT INTO quotes (
          quote_number, client_name, client_email, client_phone,
          service_package_id, base_price, additional_requirements,
          total_price, discount_percent, discount_amount, final_price,
          status, notes, valid_until
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quote_number, client_name, client_email, client_phone,
          service_package_id, base_price, additional_requirements,
          total_price, discount_percent, discount_amount, final_price,
          status, notes, valid_until
        ]
      );

      const quoteId = (result as any).insertId;
      return this.getQuoteById(quoteId) as Promise<Quote>;
    } finally {
      connection.release();
    }
  }

  /**
   * Get quote by ID with items
   */
  async getQuoteById(quoteId: number): Promise<Quote | null> {
    const connection = await dbPool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM quotes WHERE id = ?`,
        [quoteId]
      );
      if ((rows as any[]).length === 0) return null;

      const quote = (rows as any[])[0];

      // Get quote items
      const [items] = await connection.query(
        `SELECT * FROM quote_items WHERE quote_id = ? ORDER BY id ASC`,
        [quoteId]
      );

      return {
        ...quote,
        items: items as QuoteItem[]
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Get quote by quote number
   */
  async getQuoteByNumber(quoteNumber: string): Promise<Quote | null> {
    const connection = await dbPool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM quotes WHERE quote_number = ?`,
        [quoteNumber]
      );
      if ((rows as any[]).length === 0) return null;

      const quote = (rows as any[])[0];

      // Get quote items
      const [items] = await connection.query(
        `SELECT * FROM quote_items WHERE quote_id = ? ORDER BY id ASC`,
        [quote.id]
      );

      return {
        ...quote,
        items: items as QuoteItem[]
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Add line item to quote
   */
  async addQuoteItem(quoteId: number, item: Omit<QuoteItem, 'id' | 'quote_id' | 'created_at'>): Promise<QuoteItem> {
    const connection = await dbPool.getConnection();
    try {
      const [result] = await connection.query(
        `INSERT INTO quote_items (quote_id, description, quantity, unit_price, total_price, item_type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [quoteId, item.description, item.quantity, item.unit_price, item.total_price, item.item_type]
      );

      const itemId = (result as any).insertId;
      const [rows] = await connection.query(
        `SELECT * FROM quote_items WHERE id = ?`,
        [itemId]
      );

      return (rows as any[])[0];
    } finally {
      connection.release();
    }
  }

  /**
   * Update quote status
   */
  async updateQuoteStatus(quoteId: number, status: Quote['status']): Promise<void> {
    const connection = await dbPool.getConnection();
    try {
      await connection.query(
        `UPDATE quotes SET status = ? WHERE id = ?`,
        [status, quoteId]
      );
    } finally {
      connection.release();
    }
  }

  /**
   * Get user's quotes
   */
  async getQuotesByEmail(email: string): Promise<Quote[]> {
    const connection = await dbPool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM quotes WHERE client_email = ? ORDER BY created_at DESC`,
        [email]
      );

      // Get items for each quote
      const quotes = [];
      for (const quote of rows as any[]) {
        const [items] = await connection.query(
          `SELECT * FROM quote_items WHERE quote_id = ? ORDER BY id ASC`,
          [quote.id]
        );
        quotes.push({
          ...quote,
          items: items as QuoteItem[]
        });
      }

      return quotes;
    } finally {
      connection.release();
    }
  }

  /**
   * Generate unique quote number
   */
  async generateQuoteNumber(): Promise<string> {
    const connection = await dbPool.getConnection();
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      // Get count of quotes today
      const [rows] = await connection.query(
        `SELECT COUNT(*) as count FROM quotes 
         WHERE DATE(created_at) = CURDATE()`
      );

      const count = ((rows as any[])[0]?.count || 0) + 1;
      const sequence = String(count).padStart(4, '0');

      return `QT-${year}${month}${day}-${sequence}`;
    } finally {
      connection.release();
    }
  }
}

export const quoteRepository = new QuoteRepository();

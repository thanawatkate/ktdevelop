/**
 * Database Type Definitions
 * Generated from migration schema
 */

export interface Portfolio {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  technologies?: string;
  projectUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  attachmentUrl?: string;
  attachmentName?: string;
  status: 'new' | 'reviewing' | 'replied' | 'closed' | 'spam';
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactAudit {
  id: number;
  contactId: number;
  previousStatus?: string;
  newStatus: string;
  changedBy?: string;
  reason?: string;
  createdAt: Date;
}

export type CreatePortfolioInput = Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePortfolioInput = Partial<Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateContactInput = Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'status'>;
export type UpdateContactInput = Partial<Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateContactAuditInput = Omit<ContactAudit, 'id' | 'createdAt'>;

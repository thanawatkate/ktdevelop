import { Contact, ContactRepository } from "../../infrastructure/repositories/ContactRepository";
import { sanitizeEmail, sanitizeMultilineInput, sanitizeOptionalUrl, sanitizeTextInput } from "../security/sanitize";

export interface SubmitContactFormInput {
  senderName: string;
  email: string;
  phone?: string | null;
  lineId?: string | null;
  facebookUrl?: string | null;
  instagramHandle?: string | null;
  subject: string;
  message: string;
  fileUrl?: string | null;
}

export class SubmitContactForm {
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(input: SubmitContactFormInput): Promise<Contact> {
    const senderName = sanitizeTextInput(input.senderName, 255);
    const email = sanitizeEmail(input.email);
    const phone = input.phone ? sanitizeTextInput(input.phone, 20) : null;
    const lineId = input.lineId ? sanitizeTextInput(input.lineId, 255) : null;
    const facebookUrl = input.facebookUrl ? sanitizeOptionalUrl(input.facebookUrl) : null;
    const instagramHandle = input.instagramHandle ? sanitizeTextInput(input.instagramHandle, 255) : null;
    const subject = sanitizeTextInput(input.subject, 255);
    const message = sanitizeMultilineInput(input.message, 5000);
    const fileUrl = sanitizeOptionalUrl(input.fileUrl);

    if (!senderName) {
      throw new Error("Sender name is required.");
    }
    if (!email) {
      throw new Error("Email is required.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("A valid email is required.");
    }
    if (!subject) {
      throw new Error("Subject is required.");
    }
    if (!message) {
      throw new Error("Message is required.");
    }
    if (message.length < 20) {
      throw new Error("Message must be at least 20 characters.");
    }

    return this.contactRepository.create({
      sender_name: senderName,
      email,
      phone,
      line_id: lineId,
      facebook_url: facebookUrl,
      instagram_handle: instagramHandle,
      subject,
      message,
      file_url: fileUrl,
    });
  }
}

import { Contact, ContactRepository } from "../../infrastructure/repositories/ContactRepository";
import { sanitizeEmail, sanitizeMultilineInput, sanitizeOptionalUrl, sanitizeTextInput } from "../security/sanitize";

export interface SubmitContactFormInput {
  senderName: string;
  email: string;
  subject: string;
  message: string;
  fileUrl?: string | null;
}

export class SubmitContactForm {
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(input: SubmitContactFormInput): Promise<Contact> {
    const senderName = sanitizeTextInput(input.senderName, 255);
    const email = sanitizeEmail(input.email);
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
      subject,
      message,
      file_url: fileUrl,
    });
  }
}

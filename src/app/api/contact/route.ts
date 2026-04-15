import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { ContactRepository } from "../../../infrastructure/repositories/ContactRepository";
import { SubmitContactForm } from "../../../core/use-cases/SubmitContactForm";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const contactRepository = new ContactRepository();
const submitContactForm = new SubmitContactForm(contactRepository);

function getStringField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function persistUploadedFile(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name) || "";
  const storedName = `${Date.now()}-${randomUUID()}${ext.toLowerCase()}`;
  const diskPath = path.join(uploadDir, storedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, buffer);

  return `/uploads/${storedName}`;
}

function validateUploadedFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size must not exceed 10MB.");
  }

  if (!ALLOWED_FILE_TYPES.has(file.type)) {
    throw new Error("Only PDF, DOC, and DOCX files are allowed.");
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const senderName = getStringField(formData, "sender_name") || getStringField(formData, "senderName");
    const email = getStringField(formData, "email");
    const subject = getStringField(formData, "subject");
    const message = getStringField(formData, "message");

    let fileUrl: string | null = null;
    const fileField = formData.get("file");

    if (fileField instanceof File && fileField.size > 0) {
      validateUploadedFile(fileField);
      fileUrl = await persistUploadedFile(fileField);
    }

    const created = await submitContactForm.execute({
      senderName,
      email,
      subject,
      message,
      fileUrl,
    });

    return NextResponse.json(
      {
        success: true,
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit contact form.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}

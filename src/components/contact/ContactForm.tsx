"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { FormInput, FormTextarea } from "../forms";

interface FormErrors {
  senderName?: string;
  email?: string;
  otherContact?: string;
  subject?: string;
  message?: string;
  file?: string;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const initialState = {
  senderName: "",
  email: "",
  otherContact: "",
  subject: "",
  message: "",
  file: null as File | null,
};

function parseOtherContactChannels(raw: string): {
  phone: string | null;
  lineId: string | null;
  facebookUrl: string | null;
  instagramHandle: string | null;
} {
  const result = {
    phone: null as string | null,
    lineId: null as string | null,
    facebookUrl: null as string | null,
    instagramHandle: null as string | null,
  };

  const chunks = raw
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    const lower = chunk.toLowerCase();

    if (!result.lineId && /(line|ไลน์)/i.test(chunk)) {
      result.lineId = chunk.replace(/^(line\s*id|line|ไลน์)\s*[:\-]?\s*/i, "").trim() || chunk;
      continue;
    }

    if (!result.facebookUrl && /(facebook|fb\.com|fb)/i.test(lower)) {
      result.facebookUrl = chunk.replace(/^(facebook|fb)\s*[:\-]?\s*/i, "").trim() || chunk;
      continue;
    }

    if (!result.instagramHandle && /(instagram|ig|@)/i.test(chunk)) {
      result.instagramHandle = chunk.replace(/^(instagram|ig)\s*[:\-]?\s*/i, "").trim() || chunk;
      continue;
    }

    if (!result.phone && /(โทร|phone|tel|mobile|มือถือ)/i.test(chunk)) {
      const normalized = chunk.replace(/^(โทรศัพท์|โทร|phone|tel|mobile|มือถือ)\s*[:\-]?\s*/i, "").trim();
      result.phone = normalized || chunk;
      continue;
    }

    if (!result.phone) {
      const matchedPhone = chunk.match(/\+?\d[\d\s()\-]{7,}\d/);
      if (matchedPhone) {
        result.phone = matchedPhone[0].trim();
      }
    }
  }

  return result;
}

export function ContactForm() {
  const t = useTranslations("contactForm");
  const [formState, setFormState] = useState(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  function validate(nextState = formState): FormErrors {
    const nextErrors: FormErrors = {};

    if (!nextState.senderName.trim()) {
      nextErrors.senderName = t("errorName");
    }

    if (!nextState.email.trim()) {
      nextErrors.email = t("errorEmailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextState.email)) {
      nextErrors.email = t("errorEmailInvalid");
    }

    if (!nextState.subject.trim()) {
      nextErrors.subject = t("errorSubject");
    }

    if (!nextState.message.trim()) {
      nextErrors.message = t("errorMessage");
    } else if (nextState.message.trim().length < 20) {
      nextErrors.message = t("errorMessageMin");
    }

    if (nextState.file) {
      if (!ACCEPTED_TYPES.includes(nextState.file.type)) {
        nextErrors.file = t("errorFileType");
      } else if (nextState.file.size > MAX_FILE_SIZE) {
        nextErrors.file = t("errorFileSize");
      }
    }

    return nextErrors;
  }

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    const nextState = { ...formState, [name]: value };
    setFormState(nextState);
    setErrors(validate(nextState));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    const nextState = { ...formState, file };
    setFormState(nextState);
    setErrors(validate(nextState));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setServerMessage(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload = new FormData();
    payload.append("sender_name", formState.senderName);
    payload.append("email", formState.email);
    payload.append("subject", formState.subject);
    payload.append("message", formState.message);

    const parsedChannels = parseOtherContactChannels(formState.otherContact);
    if (parsedChannels.phone) payload.append("phone", parsedChannels.phone);
    if (parsedChannels.lineId) payload.append("line_id", parsedChannels.lineId);
    if (parsedChannels.facebookUrl) payload.append("facebook_url", parsedChannels.facebookUrl);
    if (parsedChannels.instagramHandle) payload.append("instagram_handle", parsedChannels.instagramHandle);

    if (formState.file) {
      payload.append("file", formState.file);
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: payload,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || t("errorSubmit"));
      }

      setIsSuccess(true);
      setServerMessage(t("successMessage"));
      setFormState(initialState);
      setErrors({});
    } catch (error) {
      setIsSuccess(false);
      setServerMessage(error instanceof Error ? error.message : t("errorSubmit"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="grid gap-6 md:grid-cols-2">
        <FormInput
          id="senderName"
          name="senderName"
          type="text"
          label={t("name")}
          value={formState.senderName}
          onChange={handleChange}
          placeholder={t("namePlaceholder")}
          inputClassName="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-indigo-600"
          error={errors.senderName}
        />

        <FormInput
          id="email"
          name="email"
          type="email"
          label={t("email")}
          value={formState.email}
          onChange={handleChange}
          placeholder="name@company.com"
          inputClassName="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-indigo-600"
          error={errors.email}
        />
      </div>

      <FormInput
        id="otherContact"
        name="otherContact"
        type="text"
        label={t("otherContact")}
        value={formState.otherContact}
        onChange={handleChange}
        placeholder={t("otherContactPlaceholder")}
        inputClassName="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-indigo-600"
        error={errors.otherContact}
      />

      <FormInput
        id="subject"
        name="subject"
        type="text"
        label={t("subject")}
        value={formState.subject}
        onChange={handleChange}
        placeholder={t("subjectPlaceholder")}
        inputClassName="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-indigo-600"
        error={errors.subject}
      />

      <FormTextarea
        id="message"
        name="message"
        rows={6}
        label={t("message")}
        value={formState.message}
        onChange={handleChange}
        placeholder={t("messagePlaceholder")}
        textareaClassName="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-indigo-600"
        error={errors.message}
      />

      <div>
        <label htmlFor="file" className="block text-sm font-medium text-slate-900">
          {t("file")}
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="mt-2 block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-indigo-700"
        />
        <p className="mt-2 text-sm text-slate-500">{t("fileHint")}</p>
        {errors.file ? <p className="mt-2 text-sm text-rose-600">{errors.file}</p> : null}
      </div>

      {serverMessage ? (
        <div className={`rounded-2xl px-4 py-3 text-sm ${isSuccess ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {serverMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
      >
        {isSubmitting ? t("sending") : t("send")}
      </button>
    </form>
  );
}
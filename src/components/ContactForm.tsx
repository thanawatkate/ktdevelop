"use client";

import { ChangeEvent, FormEvent, useState } from "react";

interface FormErrors {
  senderName?: string;
  email?: string;
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
  subject: "",
  message: "",
  file: null as File | null,
};

export function ContactForm() {
  const [formState, setFormState] = useState(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  function validate(nextState = formState): FormErrors {
    const nextErrors: FormErrors = {};

    if (!nextState.senderName.trim()) {
      nextErrors.senderName = "Please enter your full name.";
    }

    if (!nextState.email.trim()) {
      nextErrors.email = "Please enter your work email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextState.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!nextState.subject.trim()) {
      nextErrors.subject = "Please add a subject for your request.";
    }

    if (!nextState.message.trim()) {
      nextErrors.message = "Please describe your project or requirement.";
    } else if (nextState.message.trim().length < 20) {
      nextErrors.message = "Please provide at least 20 characters of detail.";
    }

    if (nextState.file) {
      if (!ACCEPTED_TYPES.includes(nextState.file.type)) {
        nextErrors.file = "Upload a PDF, DOC, or DOCX file only.";
      } else if (nextState.file.size > MAX_FILE_SIZE) {
        nextErrors.file = "File size must not exceed 10MB.";
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
        throw new Error(result.error || "Unable to submit the form.");
      }

      setIsSuccess(true);
      setServerMessage("Your inquiry has been sent. Our team will contact you shortly.");
      setFormState(initialState);
      setErrors({});
    } catch (error) {
      setIsSuccess(false);
      setServerMessage(error instanceof Error ? error.message : "Unable to submit the form.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="senderName" className="block text-sm font-medium text-slate-900">
            Name
          </label>
          <input
            id="senderName"
            name="senderName"
            type="text"
            value={formState.senderName}
            onChange={handleChange}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-indigo-600"
            placeholder="Your full name"
          />
          {errors.senderName ? <p className="mt-2 text-sm text-rose-600">{errors.senderName}</p> : null}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-900">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formState.email}
            onChange={handleChange}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-indigo-600"
            placeholder="name@company.com"
          />
          {errors.email ? <p className="mt-2 text-sm text-rose-600">{errors.email}</p> : null}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-slate-900">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          value={formState.subject}
          onChange={handleChange}
          className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-indigo-600"
          placeholder="Example: Request for enterprise website proposal"
        />
        {errors.subject ? <p className="mt-2 text-sm text-rose-600">{errors.subject}</p> : null}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-slate-900">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          value={formState.message}
          onChange={handleChange}
          className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-indigo-600"
          placeholder="Share your project scope, timeline, stakeholders, and target outcomes."
        />
        {errors.message ? <p className="mt-2 text-sm text-rose-600">{errors.message}</p> : null}
      </div>

      <div>
        <label htmlFor="file" className="block text-sm font-medium text-slate-900">
          Upload TOR / Brief
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="mt-2 block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-indigo-700"
        />
        <p className="mt-2 text-sm text-slate-500">Optional. Accepted formats: PDF, DOC, DOCX. Maximum 10MB.</p>
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
        {isSubmitting ? "Submitting..." : "Send Inquiry"}
      </button>
    </form>
  );
}
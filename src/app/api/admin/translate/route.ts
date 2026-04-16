import { NextResponse } from "next/server";
import { translate } from "@vitalets/google-translate-api";

interface TranslatePayload {
  text?: unknown;
  sourceLanguage?: unknown;
  targetLanguage?: unknown;
}

/**
 * Translation using @vitalets/google-translate-api (no API key required)
 * POST /api/admin/translate
 * Body: { text: string, sourceLanguage: "th" | "en", targetLanguage: "en" | "th" }
 */
export async function POST(request: Request) {
  try {
    const body: TranslatePayload = await request.json();
    const { text, sourceLanguage = "th", targetLanguage = "en" } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required and must be non-empty" },
        { status: 400 }
      );
    }

    if (sourceLanguage === targetLanguage) {
      return NextResponse.json({
        success: true,
        original: text,
        translated: text,
        sourceLanguage,
        targetLanguage,
      });
    }

    const result = await translate(text, {
      from: String(sourceLanguage),
      to: String(targetLanguage),
    });

    return NextResponse.json({
      success: true,
      original: text,
      translated: result.text,
      sourceLanguage,
      targetLanguage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Translation failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

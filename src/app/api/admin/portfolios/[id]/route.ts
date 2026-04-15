import { NextResponse } from "next/server";
import { PortfolioRepository } from "../../../../../infrastructure/repositories/PortfolioRepository";

const portfolioRepository = new PortfolioRepository();

interface UpdatePortfolioPayload {
  title?: unknown;
  description?: unknown;
  client_name?: unknown;
  image_url?: unknown;
  is_published?: unknown;
}

function parseId(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await context.params;
    const id = parseId(idParam);

    if (!id) {
      return NextResponse.json({ success: false, error: "Invalid portfolio id." }, { status: 400 });
    }

    const payload = (await request.json()) as UpdatePortfolioPayload;
    const updated = await portfolioRepository.update(id, {
      title: typeof payload.title === "string" ? payload.title : undefined,
      description: typeof payload.description === "string" ? payload.description : undefined,
      client_name: typeof payload.client_name === "string" ? payload.client_name : undefined,
      image_url: typeof payload.image_url === "string" ? payload.image_url : undefined,
      is_published: typeof payload.is_published === "boolean" ? payload.is_published : undefined,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Portfolio not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update portfolio.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await context.params;
    const id = parseId(idParam);

    if (!id) {
      return NextResponse.json({ success: false, error: "Invalid portfolio id." }, { status: 400 });
    }

    const removed = await portfolioRepository.delete(id);
    if (!removed) {
      return NextResponse.json({ success: false, error: "Portfolio not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete portfolio.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
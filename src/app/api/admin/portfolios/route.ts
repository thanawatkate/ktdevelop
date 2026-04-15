import { NextResponse } from "next/server";
import { PortfolioRepository } from "../../../../infrastructure/repositories/PortfolioRepository";

const portfolioRepository = new PortfolioRepository();

interface CreatePortfolioPayload {
  title?: unknown;
  description?: unknown;
  client_name?: unknown;
  image_url?: unknown;
  is_published?: unknown;
}

export async function GET() {
  try {
    const rows = await portfolioRepository.getAll();
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch portfolios.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreatePortfolioPayload;

    if (typeof payload.title !== "string" || typeof payload.description !== "string" || typeof payload.client_name !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "title, description, and client_name are required.",
        },
        { status: 400 }
      );
    }

    const created = await portfolioRepository.create({
      title: payload.title,
      description: payload.description,
      client_name: payload.client_name,
      image_url: typeof payload.image_url === "string" ? payload.image_url : null,
      is_published: payload.is_published === true,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create portfolio.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
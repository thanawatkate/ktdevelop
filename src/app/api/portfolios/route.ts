import { NextResponse } from "next/server";
import { GetAllPortfolios } from "../../../core/use-cases/GetAllPortfolios";
import { PortfolioRepository } from "../../../infrastructure/repositories/PortfolioRepository";

const portfolioRepository = new PortfolioRepository();
const getAllPortfolios = new GetAllPortfolios(portfolioRepository);

export async function GET() {
  try {
    const portfolios = await getAllPortfolios.execute();

    return NextResponse.json({
      success: true,
      data: portfolios,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load portfolios.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
import { Portfolio, PortfolioRepository } from "../../infrastructure/repositories/PortfolioRepository";

export interface GetAllPortfoliosInput {
  includeUnpublished?: boolean;
}

export class GetAllPortfolios {
  constructor(private readonly portfolioRepository: PortfolioRepository) {}

  async execute(input: GetAllPortfoliosInput = {}): Promise<Portfolio[]> {
    if (input.includeUnpublished) {
      return this.portfolioRepository.getAll();
    }

    return this.portfolioRepository.getAllPublished();
  }
}

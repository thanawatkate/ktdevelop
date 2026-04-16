import { PortfolioGrid } from "../../../components/portfolio";
import { GetAllPortfolios } from "../../../core/use-cases/GetAllPortfolios";
import { PortfolioRepository } from "../../../infrastructure/repositories/PortfolioRepository";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Portfolio",
};

export default async function PortfolioPage() {
  const portfolioRepository = new PortfolioRepository();
  const getAllPortfolios = new GetAllPortfolios(portfolioRepository);
  const portfolios = await getAllPortfolios.execute();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_28%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-indigo-600">Case Studies</p>
          <div className="mt-6 max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Enterprise delivery for organizations that need dependable digital execution.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Explore selected B2B projects spanning ERP modernization, commerce platforms, and logistics visibility systems.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <PortfolioGrid portfolios={portfolios} />
      </section>
    </main>
  );
}

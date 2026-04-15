import { ContactForm } from "../../components/ContactForm";
import { AdminInlineContentEditor } from "../../components/admin/AdminInlineContentEditor";
import { PortfolioGrid } from "../../components/PortfolioGrid";
import { GetAllPortfolios } from "../../core/use-cases/GetAllPortfolios";
import { ContentRepository } from "../../infrastructure/repositories/ContentRepository";
import { PortfolioRepository } from "../../infrastructure/repositories/PortfolioRepository";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

type PageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

const serviceIcons = [
  { icon: "🌐", key: "webPortal" },
  { icon: "⚙️", key: "integration" },
  { icon: "📊", key: "data" },
  { icon: "🔒", key: "security" },
];

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;

  const portfolioRepository = new PortfolioRepository();
  const getAllPortfolios = new GetAllPortfolios(portfolioRepository);
  const portfolios = await getAllPortfolios.execute();
  const contentRepository = new ContentRepository();
  const content = await contentRepository.getAllSections(locale);
  const tContact = await getTranslations({ locale, namespace: "contact" });
  const tFooter = await getTranslations({ locale, namespace: "footer" });
  const expectedToken = process.env.ADMIN_ACCESS_TOKEN?.trim() || "";
  const providedToken = (await cookies()).get("admin_session")?.value?.trim() || "";
  const isAdmin = Boolean(expectedToken) && expectedToken === providedToken;

  return (
    <main className="text-slate-900">
      {/* ───── HERO ───── */}
      <section
        id="home"
        className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.3),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-32 lg:px-8 lg:py-48">
          {isAdmin ? (
            <div className="mb-6 flex justify-end">
              <AdminInlineContentEditor
                locale={locale}
                section="hero"
                title="Hero"
                initialEntries={content.hero || {}}
              />
            </div>
          ) : null}
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
              {content.hero?.badge || "Full-Stack Digital Agency"}
            </span>
            <h1 className="mt-8 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              {content.hero?.title || "Build digital products"}
              <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {content.hero?.titleHighlight || "that last"}
              </span>
            </h1>
            <p className="mt-8 text-lg leading-8 text-slate-300 sm:text-xl">
              {content.hero?.description ||
                "We design and build enterprise-grade web products — from B2B portals and ERP integrations to data platforms — with clean architecture and proven delivery."}
            </p>
            <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="#portfolio"
                className="w-full rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 sm:w-auto"
              >
                {content.hero?.viewPortfolio || "View Portfolio"}
              </a>
              <a
                href="#contact"
                className="w-full rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10 sm:w-auto"
              >
                {content.hero?.startProject || "Start a Project"}
              </a>
            </div>
          </div>
        </div>
        {/* bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ───── SERVICES ───── */}
      <section id="services" className="border-b border-slate-100 bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {isAdmin ? (
            <div className="mb-6 flex justify-end">
              <AdminInlineContentEditor
                locale={locale}
                section="services"
                title="Services"
                initialEntries={content.services || {}}
              />
            </div>
          ) : null}
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">
              {content.services?.label || "What We Do"}
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {content.services?.heading || "End-to-end digital delivery"}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {content.services?.description ||
                "From concept to production — we cover every layer of your digital product."}
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {serviceIcons.map(({ icon, key }) => (
              <div
                key={key}
                className="group rounded-3xl border border-slate-100 bg-slate-50 p-7 transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                <span className="text-3xl">{icon}</span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  {content.services?.[`${key}Title`] || "Service"}
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {content.services?.[`${key}Desc`] || "Description"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── PORTFOLIO ───── */}
      <section id="portfolio" className="border-b border-slate-100 bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {isAdmin ? (
            <div className="mb-6 flex justify-end">
              <AdminInlineContentEditor
                locale={locale}
                section="portfolio"
                title="Portfolio"
                initialEntries={content.portfolio || {}}
              />
            </div>
          ) : null}
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">
              {content.portfolio?.label || "Case Studies"}
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {content.portfolio?.heading || "Our work speaks for itself"}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {content.portfolio?.description ||
                "Selected B2B projects spanning ERP modernization, commerce platforms, and logistics systems."}
            </p>
          </div>
          <div className="mt-16">
            <PortfolioGrid portfolios={portfolios} />
          </div>
        </div>
      </section>

      {/* ───── CONTACT ───── */}
      <section id="contact" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {isAdmin ? (
            <div className="mb-6 flex justify-end">
              <AdminInlineContentEditor
                locale={locale}
                section="contact"
                title="Contact"
                initialEntries={content.contact || {}}
              />
            </div>
          ) : null}
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">
              {content.contact?.label || "Get In Touch"}
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {content.contact?.heading || "Let's build something great"}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {content.contact?.description ||
                "Send your requirements or project brief. We respond within one business day."}
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <ContactForm />

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
                  {tContact("officeLabel")}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-slate-900">
                  {content.contact?.officeCity || "Bangkok, Thailand"}
                </h3>
                <div className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
                  <p>{content.contact?.officeHours || "Mon – Fri, 09:00 – 18:00 ICT"}</p>
                  <p>{content.contact?.officeEmail || "enterprise@ktdevelop.com"}</p>
                  <p>{content.contact?.officePhone || "+66 2 123 4567"}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
                  {tContact("whyLabel")}
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-indigo-500">✓</span>
                    {content.contact?.why1 || "Website and portal modernization"}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-indigo-500">✓</span>
                    {content.contact?.why2 || "Internal workflow and CRM systems"}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-indigo-500">✓</span>
                    {content.contact?.why3 || "ERP, finance, and logistics integration"}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-indigo-500">✓</span>
                    {content.contact?.why4 || "Clean Architecture for long-term growth"}
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="border-t border-slate-200 bg-slate-950 py-10 text-center">
        <p className="text-sm text-slate-500">{tFooter("copyright", { year: new Date().getFullYear() })}</p>
      </footer>
    </main>
  );
}

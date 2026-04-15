import { ContactForm } from "../../components/ContactForm";
import { PortfolioGrid } from "../../components/PortfolioGrid";
import { GetAllPortfolios } from "../../core/use-cases/GetAllPortfolios";
import { PortfolioRepository } from "../../infrastructure/repositories/PortfolioRepository";

export const dynamic = "force-dynamic";

const services = [
  {
    icon: "🌐",
    title: "Website & Portal",
    desc: "Modern corporate websites, B2B portals, and enterprise dashboards built for scale.",
  },
  {
    icon: "⚙️",
    title: "System Integration",
    desc: "Seamless integration with ERP, CRM, finance, and logistics platforms.",
  },
  {
    icon: "📊",
    title: "Data & Analytics",
    desc: "Real-time dashboards, KPI tracking, and reporting systems for informed decisions.",
  },
  {
    icon: "🔒",
    title: "Security & Compliance",
    desc: "Enterprise-grade authentication, role management, and audit logging.",
  },
];

export default async function HomePage() {
  const portfolioRepository = new PortfolioRepository();
  const getAllPortfolios = new GetAllPortfolios(portfolioRepository);
  const portfolios = await getAllPortfolios.execute();

  return (
    <main className="text-slate-900">
      {/* ───── HERO ───── */}
      <section
        id="home"
        className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.3),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-32 lg:px-8 lg:py-48">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
              Full-Stack Digital Agency
            </span>
            <h1 className="mt-8 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Build digital products
              <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                that last
              </span>
            </h1>
            <p className="mt-8 text-lg leading-8 text-slate-300 sm:text-xl">
              We design and build enterprise-grade web products — from B2B portals and ERP integrations
              to data platforms — with clean architecture and proven delivery.
            </p>
            <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="#portfolio"
                className="w-full rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 sm:w-auto"
              >
                View Portfolio
              </a>
              <a
                href="#contact"
                className="w-full rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10 sm:w-auto"
              >
                Start a Project
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
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">What We Do</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              End-to-end digital delivery
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              From concept to production — we cover every layer of your digital product.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <div
                key={s.title}
                className="group rounded-3xl border border-slate-100 bg-slate-50 p-7 transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                <span className="text-3xl">{s.icon}</span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── PORTFOLIO ───── */}
      <section id="portfolio" className="border-b border-slate-100 bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">Case Studies</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Our work speaks for itself
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Selected B2B projects spanning ERP modernization, commerce platforms, and logistics systems.
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
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">Get In Touch</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Let's build something great
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Send your requirements or project brief. We respond within one business day.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <ContactForm />

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">Office</p>
                <h3 className="mt-3 text-xl font-semibold text-slate-900">Bangkok, Thailand</h3>
                <div className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
                  <p>Mon – Fri, 09:00 – 18:00 ICT</p>
                  <p>enterprise@ktdevelop.com</p>
                  <p>+66 2 123 4567</p>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">Why Teams Choose Us</p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-indigo-500">✓</span>
                    Website and portal modernization
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-indigo-500">✓</span>
                    Internal workflow and CRM systems
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-indigo-500">✓</span>
                    ERP, finance, and logistics integration
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-indigo-500">✓</span>
                    Clean Architecture for long-term growth
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="border-t border-slate-200 bg-slate-950 py-10 text-center">
        <p className="text-sm text-slate-500">© {new Date().getFullYear()} KT Develop. All rights reserved.</p>
      </footer>
    </main>
  );
}

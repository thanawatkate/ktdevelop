import Link from "next/link";

const highlights = [
  "Next.js and MySQL full-stack delivery",
  "Clean Architecture separation for growth",
  "Enterprise-ready portfolio and contact workflows",
];

export default function HomePage() {
  return (
    <main className="min-h-screen text-slate-900">
      <section className="border-b border-slate-200">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-28">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-indigo-600">
              Corporate Web Platform
            </p>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
              A professional full-stack foundation for portfolio, lead capture, and business growth.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              This workspace now includes a B2B portfolio experience, a validated contact workflow with file upload, and a MySQL-backed architecture prepared for future admin expansion.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/portfolio"
                className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                View Portfolio
              </Link>
              <Link
                href="/contact"
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Contact Us
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">
              Current Capabilities
            </p>
            <ul className="mt-6 space-y-5 text-sm leading-7 text-slate-600">
              {highlights.map((item) => (
                <li key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

import { ContactForm } from "../../../components/contact";

export const metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,_rgba(15,23,42,0.03)_0%,_rgba(99,102,241,0.08)_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-indigo-600">Contact</p>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Discuss your next digital project with a team built for B2B delivery.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Send your requirements, TOR, or project brief. We review submissions with technical and business stakeholders before proposing the next step.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">Why teams contact us</p>
              <ul className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
                <li>Website and portal modernization</li>
                <li>Internal workflow and CRM systems</li>
                <li>Integration with ERP, finance, and logistics platforms</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <ContactForm />

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">Office</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">Business consultation and discovery sessions</h2>
            <div className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
              <p>Mon - Fri, 09:00 - 18:00</p>
              <p>enterprise@yourcompany.com</p>
              <p>+66 2 123 4567</p>
              <p>Bangkok, Thailand</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <iframe
              title="Google Maps"
              src="https://www.google.com/maps?q=Bangkok%20Thailand&z=13&output=embed"
              className="h-[360px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </aside>
      </section>
    </main>
  );
}

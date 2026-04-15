import { NextResponse } from "next/server";
import { ContactRepository } from "../../../../../infrastructure/repositories/ContactRepository";

const contactRepository = new ContactRepository();

function getSlaDays(): number {
  const envValue = Number(process.env.LEAD_SLA_DAYS || process.env.NEXT_PUBLIC_LEAD_SLA_DAYS || "3");
  return Number.isFinite(envValue) && envValue > 0 ? Math.floor(envValue) : 3;
}

export async function GET() {
  try {
    const slaDays = getSlaDays();
    const data = await contactRepository.getLeadKpi(slaDays);

    return NextResponse.json({
      success: true,
      data,
      meta: {
        slaDays,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load lead KPI.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
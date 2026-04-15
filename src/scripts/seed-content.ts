import { ContentRepository } from "../infrastructure/repositories/ContentRepository";

const contentRepository = new ContentRepository();

const contentData = {
  en: {
    hero: {
      badge: "Full-Stack Digital Agency",
      title: "Build digital products",
      titleHighlight: "that last",
      description:
        "We design and build enterprise-grade web products — from B2B portals and ERP integrations to data platforms — with clean architecture and proven delivery.",
      viewPortfolio: "View Portfolio",
      startProject: "Start a Project",
    },
    services: {
      label: "What We Do",
      heading: "End-to-end digital delivery",
      description: "From concept to production — we cover every layer of your digital product.",
      webPortalTitle: "Website & Portal",
      webPortalDesc: "Modern corporate websites, B2B portals, and enterprise dashboards built for scale.",
      integrationTitle: "System Integration",
      integrationDesc: "Seamless integration with ERP, CRM, finance, and logistics platforms.",
      dataTitle: "Data & Analytics",
      dataDesc: "Real-time dashboards, KPI tracking, and reporting systems for informed decisions.",
      securityTitle: "Security & Compliance",
      securityDesc: "Enterprise-grade authentication, role management, and audit logging.",
    },
    portfolio: {
      label: "Case Studies",
      heading: "Our work speaks for itself",
      description: "Selected B2B projects spanning ERP modernization, commerce platforms, and logistics systems.",
    },
    contact: {
      label: "Get In Touch",
      heading: "Let's build something great",
      description: "Send your requirements or project brief. We respond within one business day.",
      officeCity: "Bangkok, Thailand",
      officeHours: "Mon – Fri, 09:00 – 18:00 ICT",
      officeEmail: "enterprise@ktdevelop.com",
      officePhone: "+66 2 123 4567",
      why1: "Website and portal modernization",
      why2: "Internal workflow and CRM systems",
      why3: "ERP, finance, and logistics integration",
      why4: "Clean Architecture for long-term growth",
    },
  },
  th: {
    hero: {
      badge: "เอเจนซีดิจิทัลครบวงจร",
      title: "สร้างผลิตภัณฑ์ดิจิทัล",
      titleHighlight: "ที่ยั่งยืน",
      description:
        "เราออกแบบและพัฒนาผลิตภัณฑ์เว็บระดับองค์กร — ตั้งแต่พอร์ทัล B2B และการผนวก ERP ไปจนถึงแพลตฟอร์มข้อมูล — ด้วยสถาปัตยกรรมที่สะอาดและการส่งมอบที่มีประสิทธิภาพ",
      viewPortfolio: "ดูพอร์ตโฟลิโอ",
      startProject: "เริ่มโปรเจกต์",
    },
    services: {
      label: "สิ่งที่เราทำ",
      heading: "ส่งมอบดิจิทัลครบวงจร",
      description: "ตั้งแต่แนวคิดสู่การผลิต — เราครอบคลุมทุกชั้นของผลิตภัณฑ์ดิจิทัลของคุณ",
      webPortalTitle: "เว็บไซต์และพอร์ทัล",
      webPortalDesc: "เว็บไซต์องค์กรสมัยใหม่ พอร์ทัล B2B และแดชบอร์ดระดับองค์กรที่รองรับการขยายตัว",
      integrationTitle: "การผนวกระบบ",
      integrationDesc: "ผนวกกับ ERP, CRM, การเงิน และแพลตฟอร์มโลจิสติกส์ได้อย่างไร้รอยต่อ",
      dataTitle: "ข้อมูลและการวิเคราะห์",
      dataDesc: "แดชบอร์ดเรียลไทม์ การติดตาม KPI และระบบรายงานสำหรับการตัดสินใจอย่างรอบรู้",
      securityTitle: "ความปลอดภัยและการปฏิบัติตามกฎ",
      securityDesc: "การพิสูจน์ตัวตนระดับองค์กร การจัดการสิทธิ์ และการบันทึกการตรวจสอบ",
    },
    portfolio: {
      label: "กรณีศึกษา",
      heading: "ผลงานของเราพูดแทนตัวเอง",
      description: "โปรเจกต์ B2B ที่คัดสรรครอบคลุมการพัฒนา ERP แพลตฟอร์มอีคอมเมิร์ซ และระบบโลจิสติกส์",
    },
    contact: {
      label: "ติดต่อเรา",
      heading: "มาสร้างสิ่งที่ยิ่งใหญ่ด้วยกัน",
      description: "ส่งความต้องการหรือเอกสารโปรเจกต์ของคุณ เราตอบกลับภายในหนึ่งวันทำการ",
      officeCity: "กรุงเทพมหานคร ประเทศไทย",
      officeHours: "จันทร์ – ศุกร์ 09:00 – 18:00 น. (ICT)",
      officeEmail: "enterprise@ktdevelop.com",
      officePhone: "+66 2 123 4567",
      why1: "พัฒนาเว็บไซต์และพอร์ทัลสมัยใหม่",
      why2: "ระบบ Workflow ภายในและ CRM",
      why3: "การผนวก ERP การเงิน และโลจิสติกส์",
      why4: "Clean Architecture เพื่อการเติบโตระยะยาว",
    },
  },
};

export async function seedContentTranslations() {
  const sections = ["hero", "services", "portfolio", "contact"];

  for (const locale of ["en", "th"]) {
    for (const section of sections) {
      const sectionData = contentData[locale as keyof typeof contentData][section as keyof (typeof contentData)["en"]];
      if (sectionData) {
        for (const [key, value] of Object.entries(sectionData)) {
          await contentRepository.upsert(locale, section, key, value as string);
        }
      }
    }
  }

  console.log("✓ Content translations seeded successfully");
}

// Run if called directly
if (require.main === module) {
  seedContentTranslations()
    .then(() => {
      console.log("Seeding complete");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}

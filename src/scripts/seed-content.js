const mysql = require("mysql2/promise");

const poolConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ktdevelop_db",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
};

const contentData = {
  en: {
    govProposal: {
      coverTitle: "Digital Transformation for Public Sector Operations",
      coverSubtitle: "Build secure, scalable and sustainable systems for mission-critical services",
      challenge1: "Fragmented systems and duplicated data across departments",
      challenge2: "Manual workflows causing long approval cycles",
      challenge3: "Legacy systems are difficult to maintain and extend",
      challenge4: "Limited real-time visibility for executive decision-making",
      objective1: "Improve operational efficiency and service quality",
      objective2: "Integrate data and reduce processing errors",
      objective3: "Modernize legacy systems with phased risk control",
      objective4: "Enable analytics and KPI-driven governance",
      scope1: "Business process analysis (As-Is and To-Be)",
      scope2: "Application development for agency-specific workflows",
      scope3: "Legacy system enhancement and refactoring",
      scope4: "Integration with ERP, CRM, HR and finance systems",
      scope5: "Executive dashboard and monitoring reports",
      milestone1: "Discovery and solution design",
      milestone2: "Development and internal testing",
      milestone3: "UAT and production rollout",
      milestone4: "Warranty and post-go-live support",
      kpi1: "Average processing time reduced",
      kpi2: "Data error rate reduced",
      kpi3: "Approval cycle time reduced",
      kpi4: "User satisfaction increased",
      slaCritical: "Critical: response within 1 hour, resolution within 8 hours",
      slaHigh: "High: response within 4 hours, resolution within 1 business day",
      slaMedium: "Medium: response within 1 business day, resolution within 3 business days",
      slaLow: "Low: response within 2 business days, resolution within 7 business days",
      nextStep1: "Conduct a cross-functional workshop",
      nextStep2: "Finalize roadmap, timeline and budget",
      nextStep3: "Start pilot phase with measurable outcomes",
    },
    hero: {
      badge: "Full-Stack Digital Agency",
      title: "Build digital products",
      titleHighlight: "that last",
      description:
        "We design and build enterprise-grade web products - from B2B portals and ERP integrations to data platforms - with clean architecture and proven delivery.",
      viewPortfolio: "View Portfolio",
      startProject: "Start a Project",
    },
    services: {
      label: "What We Do",
      heading: "End-to-end digital delivery",
      description: "From concept to production - we cover every layer of your digital product.",
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
      officeHours: "Mon - Fri, 09:00 - 18:00 ICT",
      officeEmail: "enterprise@ktdevelop.com",
      officePhone: "+66 2 123 4567",
      why1: "Website and portal modernization",
      why2: "Internal workflow and CRM systems",
      why3: "ERP, finance, and logistics integration",
      why4: "Clean Architecture for long-term growth",
    },
  },
  th: {
    govProposal: {
      coverTitle: "แนวทางยกระดับระบบดิจิทัลเพื่อสนับสนุนภารกิจหน่วยงาน",
      coverSubtitle: "พัฒนาระบบที่ปลอดภัย ขยายได้ และยั่งยืนสำหรับงานบริการภาครัฐ",
      challenge1: "ระบบหลายชุดแยกส่วนและมีข้อมูลซ้ำซ้อนระหว่างหน่วยงาน",
      challenge2: "กระบวนงานแบบ Manual ทำให้ระยะเวลาอนุมัติยาวนาน",
      challenge3: "ระบบเดิมดูแลยากและขยายต่อได้จำกัด",
      challenge4: "ผู้บริหารขาดภาพรวมข้อมูลแบบเรียลไทม์",
      objective1: "เพิ่มประสิทธิภาพการปฏิบัติงานและคุณภาพการให้บริการ",
      objective2: "เชื่อมโยงข้อมูลเพื่อลดความผิดพลาดและความซ้ำซ้อน",
      objective3: "ปรับปรุงระบบเดิมแบบเป็นระยะเพื่อลดความเสี่ยง",
      objective4: "สนับสนุนการกำกับติดตามด้วยตัวชี้วัดเชิงบริหาร",
      scope1: "วิเคราะห์กระบวนงานปัจจุบันและออกแบบกระบวนงานเป้าหมาย",
      scope2: "พัฒนาระบบตามภารกิจเฉพาะของหน่วยงาน",
      scope3: "ปรับปรุงและรีแฟกเตอร์ระบบเดิม",
      scope4: "เชื่อมต่อระบบ ERP, CRM, HR และการเงิน",
      scope5: "จัดทำแดชบอร์ดและรายงานเชิงบริหาร",
      milestone1: "ระยะวิเคราะห์และออกแบบระบบ",
      milestone2: "ระยะพัฒนาและทดสอบภายใน",
      milestone3: "ระยะทดสอบร่วมผู้ใช้งานและขึ้นใช้งานจริง",
      milestone4: "ระยะรับประกันและสนับสนุนหลังใช้งาน",
      kpi1: "ลดระยะเวลาการดำเนินงานเฉลี่ยต่อรายการ",
      kpi2: "ลดอัตราความผิดพลาดของข้อมูล",
      kpi3: "ลดระยะเวลาการอนุมัติและปิดงาน",
      kpi4: "เพิ่มระดับความพึงพอใจผู้ใช้งาน",
      slaCritical: "Critical: ตอบกลับภายใน 1 ชั่วโมง แก้ไขภายใน 8 ชั่วโมง",
      slaHigh: "High: ตอบกลับภายใน 4 ชั่วโมง แก้ไขภายใน 1 วันทำการ",
      slaMedium: "Medium: ตอบกลับภายใน 1 วันทำการ แก้ไขภายใน 3 วันทำการ",
      slaLow: "Low: ตอบกลับภายใน 2 วันทำการ แก้ไขภายใน 7 วันทำการ",
      nextStep1: "จัด Workshop ร่วมกับผู้มีส่วนเกี่ยวข้อง",
      nextStep2: "สรุป Roadmap ระยะเวลาและงบประมาณ",
      nextStep3: "เริ่มโครงการนำร่องพร้อมตัวชี้วัดผลสำเร็จ",
    },
    hero: {
      badge: "เอเจนซีดิจิทัลครบวงจร",
      title: "สร้างผลิตภัณฑ์ดิจิทัล",
      titleHighlight: "ที่ยั่งยืน",
      description:
        "เราออกแบบและพัฒนาผลิตภัณฑ์เว็บระดับองค์กร - ตั้งแต่พอร์ทัล B2B และการผนวก ERP ไปจนถึงแพลตฟอร์มข้อมูล - ด้วยสถาปัตยกรรมที่สะอาดและการส่งมอบที่มีประสิทธิภาพ",
      viewPortfolio: "ดูพอร์ตโฟลิโอ",
      startProject: "เริ่มโปรเจกต์",
    },
    services: {
      label: "สิ่งที่เราทำ",
      heading: "ส่งมอบดิจิทัลครบวงจร",
      description: "ตั้งแต่แนวคิดสู่การผลิต - เราครอบคลุมทุกชั้นของผลิตภัณฑ์ดิจิทัลของคุณ",
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
      officeHours: "จันทร์ - ศุกร์ 09:00 - 18:00 น. (ICT)",
      officeEmail: "enterprise@ktdevelop.com",
      officePhone: "+66 2 123 4567",
      why1: "พัฒนาเว็บไซต์และพอร์ทัลสมัยใหม่",
      why2: "ระบบ Workflow ภายในและ CRM",
      why3: "การผนวก ERP การเงิน และโลจิสติกส์",
      why4: "Clean Architecture เพื่อการเติบโตระยะยาว",
    },
  },
};

async function run() {
  const pool = mysql.createPool(poolConfig);
  const locales = ["en", "th"];
  const sections = ["govProposal", "hero", "services", "portfolio", "contact"];

  for (const locale of locales) {
    for (const section of sections) {
      const sectionData = contentData[locale][section];
      for (const [key, value] of Object.entries(sectionData)) {
        await pool.query(
          `INSERT INTO localized_content (locale, section, key_name, content)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE content = VALUES(content), updatedAt = CURRENT_TIMESTAMP`,
          [locale, section, key, value]
        );
      }
    }
  }

  await pool.end();
  console.log("Content seed completed.");
}

run().catch((error) => {
  console.error("Content seed failed:", error);
  process.exit(1);
});

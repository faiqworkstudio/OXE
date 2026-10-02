// Sample data for the client demo. Brand, projects, people and leads are all
// fictional. Shared by the Netlify Function and the in-browser fallback.

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=70`;

export const LANGS = ["en", "th", "de", "zh", "ar"];

export const CATEGORIES = ["wellness", "longevity", "virgin-islands"];

export const AGENTS = [
  { id: "a1", name: "Nicha Srisuk", role: "Sales Manager", langs: ["th", "en"] },
  { id: "a2", name: "Jonas Weber", role: "Sales Agent", langs: ["de", "en"] },
  { id: "a3", name: "Mei Lin Chen", role: "Sales Agent", langs: ["zh", "en"] },
  { id: "a4", name: "Omar Haddad", role: "Sales Agent", langs: ["ar", "en"] },
];

export const USERS = [
  { name: "Admin (Client)", email: "admin@aeterna-demo.com", role: "Owner" },
  { name: "Nicha Srisuk", email: "nicha@aeterna-demo.com", role: "Sales Manager" },
  { name: "Jonas Weber", email: "jonas@aeterna-demo.com", role: "Sales Agent" },
  { name: "Mei Lin Chen", email: "meilin@aeterna-demo.com", role: "Sales Agent" },
  { name: "Omar Haddad", email: "omar@aeterna-demo.com", role: "Sales Agent" },
  { name: "Content Team", email: "content@aeterna-demo.com", role: "Content Editor" },
  { name: "OXE Marketing", email: "dev@oxemarketingth.com", role: "Developer" },
];

export const STAGES = ["new", "contacted", "viewing", "negotiation", "won", "lost"];

export const PROJECTS = [
  {
    id: "aeterna-phuket",
    name: "Aeterna Longevity Residences",
    categories: ["longevity", "wellness"],
    location: "Phuket, Thailand",
    region: "thailand",
    type: "villa",
    priceFrom: 1200000,
    beds: "3–5",
    size: "380–720 m²",
    status: "construction",
    completion: "Q4 2027",
    featured: true,
    published: true,
    image: img("1613490493576-7fde63acd811"),
    gallery: [img("1613490493576-7fde63acd811"), img("1540555700478-4be289fbecef"), img("1600607687939-ce8a6c25118c")],
    features: ["longevity_clinic", "private_pool", "biohacking", "organic_kitchen", "concierge_doctor"],
    mapQuery: "Kamala Beach, Phuket",
    i18n: {
      en: { tagline: "Hillside villas built around a private longevity clinic.", description: "28 sea-view villas on Phuket's west coast, each with a private pool and an annual health programme from the on-site longevity clinic. Residents get personalised check-ups, recovery suites and a chef-led organic kitchen." },
      th: { tagline: "วิลล่าบนเนินเขา พร้อมคลินิกลองเจวิตี้ส่วนตัว", description: "วิลล่าวิวทะเล 28 หลังบนชายฝั่งตะวันตกของภูเก็ต ทุกหลังมีสระว่ายน้ำส่วนตัวและโปรแกรมดูแลสุขภาพรายปีจากคลินิกในโครงการ ผู้พักอาศัยได้รับการตรวจสุขภาพเฉพาะบุคคล ห้องฟื้นฟูร่างกาย และครัวออร์แกนิกโดยเชฟ" },
      de: { tagline: "Villen am Hang rund um eine private Longevity-Klinik.", description: "28 Villen mit Meerblick an der Westküste Phukets, jede mit eigenem Pool und einem jährlichen Gesundheitsprogramm der hauseigenen Longevity-Klinik. Bewohner erhalten individuelle Check-ups, Regenerations-Suiten und eine Bio-Küche unter Leitung eines Küchenchefs." },
      zh: { tagline: "环绕私人长寿诊所而建的山坡别墅。", description: "普吉岛西海岸的28栋海景别墅，每栋均配有私人泳池，并享有园区内长寿诊所提供的年度健康计划。业主可享受个性化体检、康复套房以及由主厨主理的有机厨房。" },
      ar: { tagline: "فلل على التلال حول عيادة خاصة لطول العمر.", description: "‏28 فيلا مطلة على البحر على الساحل الغربي لجزيرة بوكيت، لكل منها مسبح خاص وبرنامج صحي سنوي من عيادة طول العمر داخل المشروع. يحصل السكان على فحوصات شخصية وأجنحة للتعافي ومطبخ عضوي يديره طاهٍ." },
    },
  },
  {
    id: "samui-sanctuary",
    name: "Samui Sanctuary Villas",
    categories: ["wellness"],
    location: "Koh Samui, Thailand",
    region: "thailand",
    type: "villa",
    priceFrom: 890000,
    beds: "2–4",
    size: "260–480 m²",
    status: "selling",
    completion: "Ready 2026",
    featured: true,
    published: true,
    image: img("1571896349842-33c89424de2d"),
    gallery: [img("1571896349842-33c89424de2d"), img("1544161515-4ab6ce6db874"), img("1506126613408-eca07ce68773")],
    features: ["spa", "yoga_pavilion", "private_pool", "beachfront", "rental_program"],
    mapQuery: "Lipa Noi, Koh Samui",
    i18n: {
      en: { tagline: "Beachfront wellness living with a managed rental programme.", description: "Tropical villas on the quiet west coast of Koh Samui with a resident spa, yoga pavilion and beach club. A managed rental programme lets owners earn income while they are away." },
      th: { tagline: "ที่พักริมหาดเพื่อสุขภาพ พร้อมโปรแกรมบริหารการเช่า", description: "วิลล่าเขตร้อนบนชายฝั่งตะวันตกอันเงียบสงบของเกาะสมุย พร้อมสปา ศาลาโยคะ และบีชคลับ โปรแกรมบริหารการเช่าช่วยสร้างรายได้ให้เจ้าของในช่วงที่ไม่ได้เข้าพัก" },
      de: { tagline: "Wellness-Wohnen am Strand mit verwaltetem Vermietungsprogramm.", description: "Tropische Villen an der ruhigen Westküste von Koh Samui mit eigenem Spa, Yoga-Pavillon und Beach Club. Ein verwaltetes Vermietungsprogramm sorgt für Einnahmen, während die Eigentümer abwesend sind." },
      zh: { tagline: "海滨健康生活，附带托管租赁计划。", description: "位于苏梅岛宁静西海岸的热带别墅，配有专属水疗中心、瑜伽亭和海滩俱乐部。托管租赁计划让业主在不入住时也能获得收益。" },
      ar: { tagline: "حياة صحية على الشاطئ مع برنامج تأجير مُدار.", description: "فلل استوائية على الساحل الغربي الهادئ لجزيرة كوه ساموي مع منتجع صحي وجناح لليوغا ونادٍ شاطئي. يتيح برنامج التأجير المُدار للمالكين تحقيق دخل أثناء غيابهم." },
    },
  },
  {
    id: "lanna-retreat",
    name: "Lanna Wellness Retreat",
    categories: ["wellness"],
    location: "Chiang Mai, Thailand",
    region: "thailand",
    type: "condo",
    priceFrom: 240000,
    beds: "1–3",
    size: "62–165 m²",
    status: "ready",
    completion: "Ready to move in",
    featured: false,
    published: true,
    image: img("1600596542815-ffad4c1539a9"),
    gallery: [img("1600596542815-ffad4c1539a9"), img("1600566753190-17f0baa2a6c3"), img("1506126613408-eca07ce68773")],
    features: ["spa", "yoga_pavilion", "organic_kitchen", "mountain_view"],
    mapQuery: "Mae Rim, Chiang Mai",
    i18n: {
      en: { tagline: "Mountain-view residences with a daily wellness programme.", description: "Low-rise residences in the green valleys of Mae Rim, twenty minutes from Chiang Mai. Includes a thermal spa, a daily yoga and meditation programme, and a farm-to-table restaurant." },
      th: { tagline: "ที่พักวิวภูเขา พร้อมโปรแกรมสุขภาพทุกวัน", description: "ที่พักอาศัยแนวราบในหุบเขาเขียวขจีของแม่ริม ห่างจากเชียงใหม่ 20 นาที มีสปาน้ำแร่ โปรแกรมโยคะและสมาธิทุกวัน และร้านอาหารฟาร์มทูเทเบิล" },
      de: { tagline: "Residenzen mit Bergblick und täglichem Wellness-Programm.", description: "Flache Wohnanlage in den grünen Tälern von Mae Rim, zwanzig Minuten von Chiang Mai entfernt. Mit Thermal-Spa, täglichem Yoga- und Meditationsprogramm und Farm-to-Table-Restaurant." },
      zh: { tagline: "山景住宅，每日提供健康课程。", description: "位于湄林绿色山谷的低层住宅，距清迈市区二十分钟。配有温泉水疗、每日瑜伽与冥想课程以及农场直供餐厅。" },
      ar: { tagline: "مساكن مطلة على الجبال مع برنامج صحي يومي.", description: "مساكن منخفضة الارتفاع في وديان ماي ريم الخضراء على بعد عشرين دقيقة من شيانغ ماي. تضم منتجعًا حراريًا وبرنامجًا يوميًا لليوغا والتأمل ومطعمًا من المزرعة إلى المائدة." },
    },
  },
  {
    id: "huahin-bluezone",
    name: "Hua Hin Blue Zone Residences",
    categories: ["longevity"],
    location: "Hua Hin, Thailand",
    region: "thailand",
    type: "condo",
    priceFrom: 310000,
    beds: "1–3",
    size: "70–190 m²",
    status: "selling",
    completion: "Q2 2027",
    featured: false,
    published: true,
    image: img("1582719478250-c89cae4dc85b"),
    gallery: [img("1582719478250-c89cae4dc85b"), img("1600607687939-ce8a6c25118c"), img("1540555700478-4be289fbecef")],
    features: ["longevity_clinic", "biohacking", "beachfront", "community_garden"],
    mapQuery: "Khao Takiap, Hua Hin",
    i18n: {
      en: { tagline: "Blue Zone-inspired community living by the sea.", description: "A seaside community designed around the habits of the world's longest-living people: walkable gardens, shared kitchens and an on-site health centre with annual longevity assessments." },
      th: { tagline: "ชุมชนริมทะเล ได้แรงบันดาลใจจาก Blue Zone", description: "ชุมชนริมทะเลที่ออกแบบตามวิถีชีวิตของผู้คนที่อายุยืนที่สุดในโลก มีสวนสำหรับเดินเล่น ครัวส่วนกลาง และศูนย์สุขภาพในโครงการพร้อมการประเมินสุขภาพประจำปี" },
      de: { tagline: "Gemeinschaftliches Wohnen am Meer nach Blue-Zone-Vorbild.", description: "Eine Wohnanlage am Meer, gestaltet nach den Gewohnheiten der langlebigsten Menschen der Welt: begehbare Gärten, Gemeinschaftsküchen und ein Gesundheitszentrum mit jährlichen Longevity-Analysen." },
      zh: { tagline: "受“蓝区”启发的海滨社区生活。", description: "依照世界上最长寿人群的生活习惯而设计的海滨社区：步行花园、共享厨房，以及提供年度长寿评估的园区健康中心。" },
      ar: { tagline: "حياة مجتمعية على البحر مستوحاة من المناطق الزرقاء.", description: "مجتمع ساحلي مصمم حول عادات أطول الناس عمرًا في العالم: حدائق للمشي ومطابخ مشتركة ومركز صحي داخل المشروع يقدم تقييمات سنوية لطول العمر." },
    },
  },
  {
    id: "tortola-cove",
    name: "Tortola Cove Estates",
    categories: ["virgin-islands"],
    location: "Tortola, British Virgin Islands",
    region: "bvi",
    type: "villa",
    priceFrom: 2400000,
    beds: "4–6",
    size: "520–940 m²",
    status: "selling",
    completion: "Ready 2026",
    featured: true,
    published: true,
    image: img("1512917774080-9991f1c4c750"),
    gallery: [img("1512917774080-9991f1c4c750"), img("1507525428034-b723cf961d3e"), img("1600585154340-be6161a56a0c")],
    features: ["beachfront", "private_pool", "marina", "concierge_doctor"],
    mapQuery: "Smuggler's Cove, Tortola",
    i18n: {
      en: { tagline: "Private estates on a secluded Caribbean cove.", description: "Eight private estates above a white-sand cove on Tortola's west end, with berths at the nearby marina and a 24-hour concierge medical service." },
      th: { tagline: "บ้านพักส่วนตัวบนอ่าวลับแห่งทะเลแคริบเบียน", description: "บ้านพักส่วนตัว 8 หลังเหนืออ่าวทรายขาวทางฝั่งตะวันตกของเกาะทอร์โทลา พร้อมท่าจอดเรือที่มารีน่าใกล้เคียง และบริการแพทย์คอนเซียร์จตลอด 24 ชั่วโมง" },
      de: { tagline: "Private Anwesen an einer abgeschiedenen Karibikbucht.", description: "Acht private Anwesen über einer weißen Sandbucht am Westende von Tortola, mit Liegeplätzen in der nahen Marina und medizinischem Concierge-Service rund um die Uhr." },
      zh: { tagline: "隐秘加勒比海湾上的私人庄园。", description: "位于托尔托拉岛西端白沙海湾之上的八座私人庄园，附近码头配有游艇泊位，并提供24小时医疗礼宾服务。" },
      ar: { tagline: "عقارات خاصة على خليج كاريبي منعزل.", description: "ثماني عقارات خاصة تطل على خليج برمال بيضاء في الطرف الغربي من جزيرة تورتولا، مع مراسٍ في المارينا القريبة وخدمة طبية على مدار الساعة." },
    },
  },
  {
    id: "virgin-gorda-club",
    name: "Virgin Gorda Longevity Club",
    categories: ["virgin-islands", "longevity", "wellness"],
    location: "Virgin Gorda, British Virgin Islands",
    region: "bvi",
    type: "villa",
    priceFrom: 3100000,
    beds: "3–5",
    size: "410–800 m²",
    status: "prelaunch",
    completion: "Q3 2028",
    featured: true,
    published: true,
    image: img("1520250497591-112f2f40a3f4"),
    gallery: [img("1520250497591-112f2f40a3f4"), img("1544161515-4ab6ce6db874"), img("1507525428034-b723cf961d3e")],
    features: ["longevity_clinic", "biohacking", "spa", "marina", "beachfront"],
    mapQuery: "North Sound, Virgin Gorda",
    i18n: {
      en: { tagline: "A members' island club for health, longevity and sailing.", description: "Pre-launch: a members' club on Virgin Gorda's North Sound with residences, a longevity medical centre, a recovery spa and a private marina. Founding members get priority selection." },
      th: { tagline: "คลับเกาะสำหรับสมาชิก เพื่อสุขภาพ อายุยืน และการล่องเรือ", description: "เปิดจองล่วงหน้า: คลับสำหรับสมาชิกที่ North Sound เกาะเวอร์จินกอร์ดา ประกอบด้วยที่พักอาศัย ศูนย์การแพทย์ด้านลองเจวิตี้ สปาฟื้นฟู และมารีน่าส่วนตัว สมาชิกผู้ก่อตั้งได้สิทธิ์เลือกก่อน" },
      de: { tagline: "Ein Insel-Club für Gesundheit, Longevity und Segeln.", description: "Pre-Launch: ein Members' Club am North Sound von Virgin Gorda mit Residenzen, einem Longevity-Medizinzentrum, Recovery-Spa und privater Marina. Gründungsmitglieder wählen zuerst." },
      zh: { tagline: "集健康、长寿与航海于一体的会员制岛屿俱乐部。", description: "预售中：位于维尔京戈尔达岛北湾的会员俱乐部，包含住宅、长寿医学中心、康复水疗和私人码头。创始会员享有优先选房权。" },
      ar: { tagline: "نادٍ جزيري للأعضاء للصحة وطول العمر والإبحار.", description: "قبل الإطلاق: نادٍ للأعضاء في نورث ساوند بجزيرة فيرجن غوردا يضم مساكن ومركزًا طبيًا لطول العمر ومنتجعًا للتعافي ومارينا خاصة. يحصل الأعضاء المؤسسون على أولوية الاختيار." },
    },
  },
  {
    id: "anegada-lodges",
    name: "Anegada Reef Lodges",
    categories: ["virgin-islands", "wellness"],
    location: "Anegada, British Virgin Islands",
    region: "bvi",
    type: "villa",
    priceFrom: 1650000,
    beds: "2–3",
    size: "210–340 m²",
    status: "soldout",
    completion: "Completed",
    featured: false,
    published: true,
    image: img("1507525428034-b723cf961d3e"),
    gallery: [img("1507525428034-b723cf961d3e"), img("1571896349842-33c89424de2d"), img("1600566753190-17f0baa2a6c3")],
    features: ["beachfront", "spa", "yoga_pavilion"],
    mapQuery: "Loblolly Bay, Anegada",
    i18n: {
      en: { tagline: "Eco-lodges on the only coral island in the BVI.", description: "Sold out. Twelve low-impact beach lodges beside the Horseshoe Reef. Join the waiting list to hear about resales and the next phase." },
      th: { tagline: "อีโคลอดจ์บนเกาะปะการังแห่งเดียวในหมู่เกาะบริติชเวอร์จิน", description: "ขายหมดแล้ว ลอดจ์ริมหาด 12 หลังที่เป็นมิตรกับสิ่งแวดล้อม ข้างแนวปะการัง Horseshoe Reef ลงชื่อในรายชื่อรอเพื่อรับข่าวการขายต่อและเฟสถัดไป" },
      de: { tagline: "Öko-Lodges auf der einzigen Koralleninsel der BVI.", description: "Ausverkauft. Zwölf umweltschonende Strand-Lodges am Horseshoe Reef. Tragen Sie sich in die Warteliste ein, um über Wiederverkäufe und die nächste Phase informiert zu werden." },
      zh: { tagline: "英属维尔京群岛唯一珊瑚岛上的生态小屋。", description: "已售罄。马蹄礁旁的十二座低影响海滩小屋。加入候补名单，获取转售及下一期的消息。" },
      ar: { tagline: "نُزل بيئية على الجزيرة المرجانية الوحيدة في الجزر العذراء البريطانية.", description: "بيعت بالكامل. اثنا عشر نُزلًا شاطئيًا صديقًا للبيئة بجوار شعاب هورس شو. انضم إلى قائمة الانتظار لمعرفة عمليات إعادة البيع والمرحلة التالية." },
    },
  },
];

export const SETTINGS = {
  notifyEmail: "sales@aeterna-demo.com",
  autoAssign: true,
  autoReply: true,
  integrations: {
    forms: true,
    facebook: true,
    instagram: true,
    ga4: true,
    gsc: true,
    pixel: true,
    whatsapp: true,
    line: true,
    email: true,
    webhook: false,
  },
  ga4Id: "G-DEMO12345",
  pixelId: "000000000000000",
  whatsapp: "+66 82 448 0050",
  lineId: "@aeterna-demo",
  webhookUrl: "",
};

// Seeded leads are generated relative to "now" so the dashboard always looks current.
const PEOPLE = [
  ["Thomas Müller", "de", "DE"], ["Sabine Hoffmann", "de", "CH"], ["Lukas Schneider", "de", "AT"],
  ["Wang Lei", "zh", "CN"], ["Chen Jing", "zh", "SG"], ["Li Na", "zh", "HK"], ["Zhang Wei", "zh", "CN"],
  ["Ahmed Al Mansoori", "ar", "AE"], ["Fatima Al Saud", "ar", "SA"], ["Khalid Rahman", "ar", "QA"],
  ["Somchai Wongsakul", "th", "TH"], ["Pimchanok Rattana", "th", "TH"], ["Kittipong Chai", "th", "TH"],
  ["James Whitfield", "en", "GB"], ["Olivia Carter", "en", "US"], ["Daniel Brooks", "en", "AU"],
  ["Sophie Laurent", "en", "FR"], ["Ivan Petrov", "en", "RU"], ["Priya Nair", "en", "IN"],
  ["Michael Grant", "en", "US"], ["Anna Lindqvist", "en", "SE"], ["Hiroshi Tanaka", "en", "JP"],
  ["Markus Bauer", "de", "DE"], ["Layla Hassan", "ar", "KW"], ["Nattapong Sri", "th", "TH"],
  ["Emily Chen", "zh", "TW"], ["Robert King", "en", "CA"], ["Julia Fischer", "de", "DE"],
];

const SOURCES = [
  ["website", "google", "organic", ""],
  ["website", "google", "cpc", "longevity-search"],
  ["facebook", "facebook", "lead_ads", "bvi-launch"],
  ["facebook", "facebook", "lead_ads", "wellness-villas"],
  ["instagram", "instagram", "lead_ads", "wellness-villas"],
  ["website", "newsletter", "email", "october-update"],
  ["whatsapp", "whatsapp", "chat", ""],
  ["referral", "partner", "referral", "agent-network"],
];

const MESSAGES = [
  "Interested in a 4-bedroom villa. Please send the brochure and price list.",
  "Could we arrange a private viewing next month?",
  "What are the ownership options for foreign buyers?",
  "Looking for an investment property with rental income.",
  "Please share details about the longevity programme included.",
  "Is financing available? Budget around the starting price.",
  "We are relocating in 2027 and would like more information.",
  "",
];

const BUDGETS = ["<500k", "500k-1m", "1m-3m", "3m+"];

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function seedLeads(now = Date.now()) {
  const r = rng(20261002);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const leads = [];
  const stageWeights = ["new", "new", "new", "contacted", "contacted", "contacted", "viewing", "viewing", "negotiation", "won", "lost"];
  for (let i = 0; i < 64; i++) {
    const [name, language, country] = PEOPLE[i % PEOPLE.length];
    const project = pick(PROJECTS);
    const [source, utmSource, utmMedium, utmCampaign] = pick(SOURCES);
    const ageDays = Math.floor(Math.pow(r(), 1.6) * 84); // spread over 12 weeks, slightly more recent
    const createdAt = now - ageDays * 86400000 - Math.floor(r() * 86400000);
    let stage = pick(stageWeights);
    if (ageDays < 2) stage = "new";
    const agent = AGENTS.find((a) => a.langs[0] === language) || AGENTS[0];
    const email = name.toLowerCase().normalize("NFD").replace(/[^a-z ]/g, "").trim().replace(/ +/g, ".") + "@example.com";
    const lead = {
      id: "L" + String(1001 + i),
      createdAt,
      name,
      email,
      phone: "+" + (10 + Math.floor(r() * 89)) + " " + String(Math.floor(r() * 9e8) + 1e8),
      country,
      language,
      projectId: project.id,
      budget: pick(BUDGETS),
      message: pick(MESSAGES),
      type: r() < 0.3 ? "brochure" : r() < 0.5 ? "viewing" : "enquiry",
      source,
      utm: { source: utmSource, medium: utmMedium, campaign: utmCampaign },
      page: source === "website" ? "/demo/#/project/" + project.id : "",
      stage,
      agentId: stage === "new" && r() < 0.4 ? null : agent.id,
      value: project.priceFrom,
      notes: [],
      activity: [{ at: createdAt, text: `Lead created from ${source}` }],
    };
    if (stage !== "new") lead.activity.push({ at: createdAt + 3600000 * 5, text: `Stage changed to ${stage}` });
    if (stage === "viewing") lead.notes.push({ at: createdAt + 86400000, by: agent.name, text: "Viewing booked. Client flying in next month." });
    if (stage === "negotiation") lead.notes.push({ at: createdAt + 86400000, by: agent.name, text: "Offer received, waiting on developer approval." });
    leads.push(lead);
  }
  return leads.sort((a, b) => b.createdAt - a.createdAt);
}

// بيانات تجريبية — استبدلها بالـ API لاحقًا. الدكتور بيشوف مقرراته بس.
const courses = [
  {
    code: "COMP301",
    name: "قواعد البيانات",
    students: 45,
    hours: 3,
    year: "الثالثة",
    graded: false,
  },
  {
    code: "COMP401",
    name: "هندسة البرمجيات",
    students: 42,
    hours: 3,
    year: "الرابعة",
    graded: true,
  },
  {
    code: "COMP204",
    name: "الذكاء الاصطناعي",
    students: 35,
    hours: 3,
    year: "الرابعة",
    graded: false,
  },
];
const courseLabel = (c) => `${c.code} – ${c.name} – ${c.students} طالب`;
const first = [
  "أحمد",
  "سارة",
  "خالد",
  "نورة",
  "عمر",
  "ريم",
  "محمد",
  "ليان",
  "يوسف",
  "مريم",
  "علي",
  "هبة",
];
const last = ["العمري", "الزهراني", "المطيري", "السبيعي", "الشهري", "الغامدي"];
const students = courses.flatMap((c, ci) =>
  Array.from({ length: c.students }, (_, i) => {
    const s = ci * 7 + i;
    return {
      id: `2022${ci + 1}${1000 + i}`,
      name: `${first[s % 12]} ${last[(s * 5 + i) % 6]}`,
      course: c.code,
      mid: c.graded ? 12 + (s % 8) : null,
      work: c.graded ? 20 + (s % 10) : null,
      fin: null,
      email: `s2022${ci + 1}${1000 + i}@sci.asu.edu.eg`,
    };
  }),
);
const studentById = (id) => students.find((s) => s.id === id);
const lectures = [
  {
    id: 1,
    course: "COMP401",
    title: "اختبارات البرمجيات",
    type: "PDF",
    at: "06 أكتوبر 2026 – 10:30 ص",
  },
  {
    id: 2,
    course: "COMP401",
    title: "أنماط التصميم",
    type: "PDF",
    at: "29 سبتمبر 2026 – 11:00 ص",
  },
  {
    id: 3,
    course: "COMP301",
    title: "التطبيع Normalization",
    type: "PPTX",
    at: "04 أكتوبر 2026 – 09:15 ص",
  },
  {
    id: 4,
    course: "COMP204",
    title: "الشبكات العصبية",
    type: "PDF",
    at: "05 أكتوبر 2026 – 01:00 م",
  },
];
const announcements = [
  {
    course: "COMP301",
    title: "موعد اختبار الميدتيرم",
    body: "الاختبار يوم الأحد القادم في قاعة 3.",
    at: "08 أكتوبر 2026",
  },
  {
    course: "COMP401",
    title: "تسليم المشروع",
    body: "آخر موعد لتسليم المشروع نهاية الأسبوع.",
    at: "02 أكتوبر 2026",
  },
];
const pick = (code, n) => students.filter((s) => s.course === code)[n].id;
const threads = [
  {
    sid: pick("COMP301", 0),
    unread: 2,
    msgs: [
      { from: "s", text: "دكتورة، ممكن توضحي نقطة الـ 3NF؟", at: "09:10 ص" },
      { from: "s", text: "ومحتاج مثال تاني على التطبيع.", at: "09:12 ص" },
    ],
  },
  {
    sid: pick("COMP401", 2),
    unread: 1,
    msgs: [{ from: "s", text: "هل المشروع فردي ولا جماعي؟", at: "أمس" }],
  },
  {
    sid: pick("COMP204", 4),
    unread: 0,
    msgs: [
      { from: "s", text: "شكرًا على الشرح يا دكتورة.", at: "أمس" },
      { from: "d", text: "على الرحب والسعة.", at: "أمس" },
    ],
  },
  {
    sid: pick("COMP401", 6),
    unread: 0,
    msgs: [{ from: "d", text: "تم رصد درجتك.", at: "الأحد" }],
  },
];

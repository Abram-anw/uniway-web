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

const affairsSections = [
  { key: "admission", label: "القبول", icon: "users", count: 24 },
  { key: "scholarship", label: "المنح", icon: "star", count: 12 },
  { key: "advising", label: "الإرشاد", icon: "chat", count: 18 },
  { key: "registration", label: "التسجيل", icon: "book", count: 15 },
  { key: "transcripts", label: "السجل الأكاديمي", icon: "file", count: 10 },
  { key: "housing", label: "السكن", icon: "home", count: 7 },
  { key: "documents", label: "المستندات", icon: "clipboard", count: 21 },
  { key: "support", label: "الدعم", icon: "alert", count: 9 },
];

const requestStatusMeta = {
  pending: { label: "قيد المراجعة", tone: "amber" },
  inprogress: { label: "قيد التنفيذ", tone: "blue" },
  approved: { label: "مقبول", tone: "green" },
  rejected: { label: "مرفوض", tone: "red" },
  closed: { label: "مغلق", tone: "gray" },
};

const studentRequests = [
  {
    id: "SR-1048",
    studentName: "ريم السعدي",
    studentId: "20220148",
    section: "القبول",
    category: "إعادة تقييم القبول",
    status: "pending",
    priority: "عالية",
    submittedAt: "2026-10-12 09:15",
    dueDate: "2026-10-14",
    summary: "تحديث حالة القبول بعد استكمال المستندات المطلوبة.",
    description:
      "الطالبة قدمت نسخة محدثة من الشهادة الثانوية وبطاقة الهوية، وتحتاج مراجعة لجنة القبول للتأكد من استيفاء المعايير المطلوبة قبل اعتماد القبول النهائي.",
    timeline: [
      { title: "تم تقديم الطلب", time: "2026-10-12 09:15" },
      { title: "تقييم أولي من شؤون الطلاب", time: "2026-10-12 12:30" },
    ],
  },
  {
    id: "SR-1042",
    studentName: "أحمد العتيبي",
    studentId: "20220142",
    section: "المنح",
    category: "طلب منحة دراسية",
    status: "inprogress",
    priority: "متوسطة",
    submittedAt: "2026-10-10 15:45",
    dueDate: "2026-10-16",
    summary: "مراجعة الملف المالي وطلب الدعم المادي للفصل القادم.",
    description:
      "الطالب يطلب إعادة النظر في قرار المنحة بسبب تغير الحالة الاجتماعية، مع تقديم تقرير دخل جديد ونسخة من عقد الإيجار للوالدين.",
    timeline: [
      { title: "تم استلام الطلب", time: "2026-10-10 15:45" },
      { title: "إرسال مرفقات إضافية", time: "2026-10-11 08:50" },
      { title: "قيد المراجعة المالية", time: "2026-10-12 10:10" },
    ],
  },
  {
    id: "SR-1037",
    studentName: "سارة القحطاني",
    studentId: "20220137",
    section: "الإرشاد",
    category: "استشارة أكاديمية",
    status: "approved",
    priority: "منخفضة",
    submittedAt: "2026-10-08 11:05",
    dueDate: "2026-10-09",
    summary: "تعديل خطة الدراسة بسبب تأخر بعض المقررات في الفصل الحالي.",
    description:
      "الطالبة تحتاج تعديل جدولها الدراسي مع استشاري القسم لتقليل الحمل خلال الفصل الثاني مع الحفاظ على متطلبات التخرج.",
    timeline: [
      { title: "تمت الموافقة", time: "2026-10-08 18:40" },
      { title: "تمت مراجعة الخطة الدراسية", time: "2026-10-09 09:15" },
    ],
  },
  {
    id: "SR-1033",
    studentName: "خالد المطيري",
    studentId: "20220133",
    section: "التسجيل",
    category: "إضافة مقرر",
    status: "pending",
    priority: "عالية",
    submittedAt: "2026-10-07 14:20",
    dueDate: "2026-10-13",
    summary: "إضافة مقرر اختياري بعد فحص الخطة الدراسية.",
    description:
      "الطالب يرغب في تسجيل مقرر الذكاء الاصطناعي خلال الفصل الحالي، لكنه يحتاج تأكيد المساحة المتبقية والقبول من المشرف الأكاديمي.",
    timeline: [
      { title: "تم تقديم الطلب", time: "2026-10-07 14:20" },
      { title: "تأكيد التوفر في المقرر", time: "2026-10-08 09:00" },
    ],
  },
  {
    id: "SR-1029",
    studentName: "ليان الحربي",
    studentId: "20220129",
    section: "السجل الأكاديمي",
    category: "استعلام عن السجل",
    status: "closed",
    priority: "منخفضة",
    submittedAt: "2026-10-05 10:00",
    dueDate: "2026-10-05",
    summary: "توضيح التقديرات النهائية في المقرر الأساسي.",
    description:
      "الطالبة تريد مراجعة السجل الأكاديمي الخاص بها للتأكد من تسجيل جميع الدرجات والمواد في الفصل الدراسي الأخير.",
    timeline: [
      { title: "تمت الإجابة", time: "2026-10-05 17:30" },
      { title: "تم إغلاق الحالة", time: "2026-10-05 18:05" },
    ],
  },
  {
    id: "SR-1024",
    studentName: "محمود الشمري",
    studentId: "20220124",
    section: "السكن",
    category: "تغيير السكن",
    status: "rejected",
    priority: "متوسطة",
    submittedAt: "2026-10-02 16:10",
    dueDate: "2026-10-06",
    summary: "طلب تغيير غُرف السكن بسبب الازدحام في الطابق الحالي.",
    description:
      "الطالب طلب نقل إلى غرفة فردية، لكنه لم يلتزم بموعد التقديم وتجاوزت قائمة الانتظار المسموح بها في هذا الفصل.",
    timeline: [
      { title: "تم استلام الطلب", time: "2026-10-02 16:10" },
      { title: "تمت مراجعة الأولوية", time: "2026-10-03 11:20" },
      { title: "تم الرفض", time: "2026-10-06 10:30" },
    ],
  },
];

const requestDocumentsById = {
  "SR-1048": [
    { id: "DOC-1", name: "بطاقة الهوية", type: "بطاقة الهوية", fileName: "passport-20220148.pdf", status: "pending", fileType: "pdf", rejectionReason: "" },
    { id: "DOC-2", name: "الشهادة الثانوية", type: "شهادة الثانوية", fileName: "highschool-20220148.pdf", status: "accepted", fileType: "pdf", rejectionReason: "" },
    { id: "DOC-3", name: "صورة شخصية", type: "صورة شخصية", fileName: "photo-20220148.jpg", status: "pending", fileType: "image", rejectionReason: "" },
  ],
  "SR-1042": [
    { id: "DOC-4", name: "التقرير المالي", type: "تقرير دخل", fileName: "income-report.pdf", status: "pending", fileType: "pdf", rejectionReason: "" },
    { id: "DOC-5", name: "عقد الإيجار", type: "عقد إيجار", fileName: "lease-contract.pdf", status: "accepted", fileType: "pdf", rejectionReason: "" },
  ],
  "SR-1037": [
    { id: "DOC-6", name: "خطة الدراسة", type: "خطة تقييم", fileName: "study-plan.pdf", status: "accepted", fileType: "pdf", rejectionReason: "" },
  ],
  "SR-1033": [
    { id: "DOC-7", name: "استمارة تسجيل المقرر", type: "استمارة", fileName: "course-form.pdf", status: "pending", fileType: "pdf", rejectionReason: "" },
    { id: "DOC-8", name: "سجل التقديرات", type: "سجل التقديرات", fileName: "grades.pdf", status: "accepted", fileType: "pdf", rejectionReason: "" },
  ],
  "SR-1029": [
    { id: "DOC-9", name: "السجل الأكاديمي", type: "سجل أكاديمي", fileName: "transcript.pdf", status: "accepted", fileType: "pdf", rejectionReason: "" },
  ],
  "SR-1024": [
    { id: "DOC-10", name: "طلب السكن", type: "طلب سكن", fileName: "housing-request.pdf", status: "rejected", fileType: "pdf", rejectionReason: "تجاوزت الطلبات المسموح بها لهذا الفصل." },
  ],
};

const requestMessagesById = {
  "SR-1048": [
    { from: "student", sender: "ريم السعدي", text: "أرفقت نسخة من الشهادة الثانوية المحدثة اليوم.", time: "2026-10-12 09:30" },
    { from: "employee", sender: "موظف شؤون الطلاب", text: "تم استلام الملف، سيتم مراجعة المستندات خلال اليوم.", time: "2026-10-12 12:45" },
  ],
  "SR-1042": [
    { from: "student", sender: "أحمد العتيبي", text: "أحتاج مراجعة جديدة للمنحة بعد تغير الحالة الاجتماعية.", time: "2026-10-10 16:10" },
  ],
  "SR-1037": [
    { from: "student", sender: "سارة القحطاني", text: "شكرًا، أحتاج تعديل الخطة الدراسية في أقرب وقت.", time: "2026-10-08 12:00" },
  ],
  "SR-1033": [
    { from: "student", sender: "خالد المطيري", text: "أرغب في تسجيل مقرر الذكاء الاصطناعي في الفصل الحالي.", time: "2026-10-07 14:35" },
  ],
  "SR-1029": [
    { from: "employee", sender: "موظف شؤون الطلاب", text: "تمت مراجعة السجل الأكاديمي والإجابة على استفسارك.", time: "2026-10-05 17:45" },
  ],
  "SR-1024": [
    { from: "student", sender: "محمود الشمري", text: "أرغب في تغيير غرفتي بسبب الازدحام.", time: "2026-10-02 16:25" },
  ],
};

const requestNotesById = {
  "SR-1048": [
    { author: "موظف شؤون الطلاب", text: "تم فحص الوثائق الأولية، المطلوب مراجعة نسخة الشهادة للتأكد من تاريخ الإصدار.", time: "2026-10-12 12:30" },
  ],
  "SR-1042": [
    { author: "موظف شؤون الطلاب", text: "تمت مراجعة تقرير الدخل، والطلب قيد التحقق المالي.", time: "2026-10-12 10:20" },
  ],
  "SR-1037": [
    { author: "موظف شؤون الطلاب", text: "الخطة الدراسية تم اعتمادها من المستشار الأكاديمي.", time: "2026-10-08 18:40" },
  ],
  "SR-1033": [
    { author: "موظف شؤون الطلاب", text: "مطلوب تأكيد توفر المقرر قبل اعتماد الإضافة.", time: "2026-10-08 09:15" },
  ],
  "SR-1029": [
    { author: "موظف شؤون الطلاب", text: "تم إغلاق الطلب بعد إرسال الإجابة النهائية.", time: "2026-10-05 18:05" },
  ],
  "SR-1024": [
    { author: "موظف شؤون الطلاب", text: "تم الرفض بسبب تجاوز الطلب لأولوية التقديم المسموح بها.", time: "2026-10-06 10:30" },
  ],
};

studentRequests.forEach((request) => {
  request.documents = requestDocumentsById[request.id] || [];
  request.messages = requestMessagesById[request.id] || [];
  request.notes = requestNotesById[request.id] || [];
});

const admissionStatusMeta = {
  new: { label: "جديد", tone: "blue" },
  under_review: { label: "قيد المراجعة", tone: "amber" },
  accepted: { label: "مقبول", tone: "green" },
  rejected: { label: "مرفوض", tone: "red" },
  missing_info: { label: "معلومات ناقصة", tone: "gray" },
};

const appealStatusMeta = {
  under_review: { label: "قيد المراجعة", tone: "amber" },
  accepted: { label: "تم القبول", tone: "green" },
  rejected: { label: "تم الرفض", tone: "red" },
  needs_info: { label: "يحتاج معلومات", tone: "gray" },
};

const m2StatusMap = {
  new: "new",
  under_review: "under_review",
  accepted: "accepted",
  rejected: "rejected",
  missing_info: "missing_info",
};

const highSchoolApplications = [
  {
    id: "ADM-1001",
    applicationNumber: "APP-1001",
    studentName: "سارة محمد",
    nationalId: "1234567890",
    nominationCardName: "بطاقة الترشيح.pdf",
    status: "new",
    submittedAt: "2026-10-04 09:15",
    m2Status: "new",
    rejectionReason: "",
    additionalInfoRequest: "",
    history: [{ title: "تم تقديم الطلب", time: "2026-10-04 09:15", actor: "النظام" }],
  },
  {
    id: "ADM-1002",
    applicationNumber: "APP-1002",
    studentName: "أحمد النجار",
    nationalId: "0987654321",
    nominationCardName: "nomination-card-1002.pdf",
    status: "under_review",
    submittedAt: "2026-10-03 14:20",
    m2Status: "under_review",
    rejectionReason: "",
    additionalInfoRequest: "",
    history: [{ title: "تم استلام الطلب", time: "2026-10-03 14:20", actor: "النظام" }],
  },
  {
    id: "ADM-1003",
    applicationNumber: "APP-1003",
    studentName: "ريم العتيبي",
    nationalId: "1122334455",
    nominationCardName: "card-1003.pdf",
    status: "accepted",
    submittedAt: "2026-10-02 11:05",
    m2Status: "accepted",
    rejectionReason: "",
    additionalInfoRequest: "",
    history: [{ title: "تم قبول الطلب", time: "2026-10-08 10:10", actor: "موظف شؤون الطلاب" }],
  },
  {
    id: "ADM-1004",
    applicationNumber: "APP-1004",
    studentName: "خالد الحربي",
    nationalId: "6677889900",
    nominationCardName: "kh-card.pdf",
    status: "rejected",
    submittedAt: "2026-10-01 08:45",
    m2Status: "rejected",
    rejectionReason: "عدم استيفاء الشروط الأكاديمية المقررة.",
    additionalInfoRequest: "",
    history: [{ title: "تم رفض الطلب", time: "2026-10-05 15:55", actor: "موظف شؤون الطلاب" }],
  },
  {
    id: "ADM-1005",
    applicationNumber: "APP-1005",
    studentName: "ليان الزهراني",
    nationalId: "3344556677",
    nominationCardName: "student-nomination.pdf",
    status: "missing_info",
    submittedAt: "2026-10-06 13:35",
    m2Status: "missing_info",
    rejectionReason: "",
    additionalInfoRequest: "مطلوب صورة من شهادة الميلاد موضحًا اسم الطالب الكامل.",
    history: [{ title: "تم طلب معلومات إضافية", time: "2026-10-06 16:10", actor: "موظف شؤون الطلاب" }],
  },
];

const gradeAppeals = [
  {
    id: "GA-3001",
    studentName: "نور السعدي",
    studentId: "20230061",
    course: "الفيزياء 101",
    examType: "الاختبار النهائي",
    grade: 68,
    reason: "أرغب في إعادة النظر في النتيجة بسبب خطأ في حساب الإجابة الأخيرة في السؤال الثالث.",
    status: "under_review",
    submittedAt: "2026-10-07 12:00",
    attachments: [{ name: "photo-of-answer-sheet.jpg", type: "image" }],
    history: [{ title: "تم تقديم الاستئناف", time: "2026-10-07 12:00", actor: "الطالب" }],
    messages: [
      { from: "student", sender: "نور السعدي", text: "أرغب في مراجعة النتيجة النهائية للفيزياء.", time: "2026-10-07 12:05" },
      { from: "employee", sender: "موظف شؤون الطلاب", text: "تمت مراجعة الطلب وسيتم الرد خلال 48 ساعة.", time: "2026-10-07 15:20" },
    ],
  },
  {
    id: "GA-3002",
    studentName: "محمود القحطاني",
    studentId: "20230048",
    course: "الرياضيات 202",
    examType: "الاختبار النصفي",
    grade: 72,
    reason: "أحتاج إعادة تقييم السؤال الخامس لأن تحليلي كان صحيحًا، لكن علامة السؤال كانت غير دقيقة.",
    status: "accepted",
    submittedAt: "2026-10-05 09:40",
    attachments: [{ name: "math-appeal.pdf", type: "pdf" }],
    history: [{ title: "تم قبول الاستئناف", time: "2026-10-06 14:11", actor: "موظف شؤون الطلاب" }],
    messages: [],
  },
  {
    id: "GA-3003",
    studentName: "سارة العمر",
    studentId: "20230118",
    course: "الكيمياء 110",
    examType: "اختبار عملي",
    grade: 55,
    reason: "أرغب في مراجعة النتيجة بسبب تجاهل جدول التقييم في بعض المعايير العملية.",
    status: "needs_info",
    submittedAt: "2026-10-09 18:25",
    attachments: [{ name: "lab-evaluation.pdf", type: "pdf" }],
    history: [{ title: "تم طلب معلومات إضافية", time: "2026-10-09 19:00", actor: "موظف شؤون الطلاب" }],
    messages: [],
  },
  {
    id: "GA-3004",
    studentName: "عبدالله محمد",
    studentId: "20230140",
    course: "اللغة الإنجليزية 120",
    examType: "الاختبار النهائي",
    grade: 59,
    reason: "طلب إعادة النظر في التقييم الشفهي بعد وجود تباين في نتيجة التقييم.",
    status: "rejected",
    submittedAt: "2026-10-08 08:30",
    attachments: [{ name: "speaking-rubric.pdf", type: "pdf" }],
    history: [{ title: "تم رفض الاستئناف", time: "2026-10-08 09:50", actor: "موظف شؤون الطلاب" }],
    messages: [],
  },
];

const militaryStudents = [
  { studentCode: "ST-1001", studentName: "أحمد السالم" },
  { studentCode: "ST-1002", studentName: "سارة محمد" },
  { studentCode: "ST-1003", studentName: "ليان العتيبي" },
  { studentCode: "ST-1004", studentName: "عبدالله الحربي" },
  { studentCode: "ST-1005", studentName: "مريم الزهراني" },
  { studentCode: "ST-1006", studentName: "سلمان القحطاني" },
  { studentCode: "ST-1007", studentName: "نور العمري" },
  { studentCode: "ST-1008", studentName: "حسناء الرياحي" },
];

const militaryEducationResults = [
  {
    id: "MRE-101",
    studentCode: "ST-1001",
    studentName: "أحمد السالم",
    courseStatus: "مكتمل",
    result: "مقبول",
    completionStatus: "منتهي",
    completed: true,
    updatedAt: "2026-10-11 12:00",
  },
  {
    id: "MRE-102",
    studentCode: "ST-1002",
    studentName: "سارة محمد",
    courseStatus: "قيد التنفيذ",
    result: "مؤجل",
    completionStatus: "غير منتهي",
    completed: false,
    updatedAt: "2026-10-09 08:45",
  },
  {
    id: "MRE-103",
    studentCode: "ST-1003",
    studentName: "ليان العتيبي",
    courseStatus: "مكتمل",
    result: "ناجح",
    completionStatus: "منتهي",
    completed: true,
    updatedAt: "2026-10-08 15:10",
  },
  {
    id: "MRE-104",
    studentCode: "ST-1004",
    studentName: "عبدالله الحربي",
    courseStatus: "مسجل",
    result: "راسب",
    completionStatus: "غير منتهي",
    completed: false,
    updatedAt: "2026-10-12 10:20",
  },
  {
    id: "MRE-105",
    studentCode: "ST-1005",
    studentName: "مريم الزهراني",
    courseStatus: "مكتمل",
    result: "مقبول",
    completionStatus: "منتهي",
    completed: true,
    updatedAt: "2026-10-07 09:30",
  },
];

const militaryEducationStatusMeta = {
  مسجل: { label: "مسجل", tone: "blue" },
  "قيد التنفيذ": { label: "قيد التنفيذ", tone: "amber" },
  مكتمل: { label: "مكتمل", tone: "green" },
};

const militaryEducationCompletionMeta = {
  منتهي: { label: "منتهي", tone: "green" },
  "غير منتهي": { label: "غير منتهي", tone: "gray" },
};

const militaryEducationAllowedResults = ["مقبول", "راسب", "مؤجل", "ناجح"];
const militaryEducationAllowedCourseStatus = ["مسجل", "قيد التنفيذ", "مكتمل"];

const normalizeMilitaryEducationResult = (record) => {
  const student = militaryStudents.find((item) => item.studentCode === record.studentCode);
  const normalized = { ...record };
  normalized.studentName = student ? student.studentName : normalized.studentName || "غير معروف";
  normalized.courseStatus = militaryEducationAllowedCourseStatus.includes(normalized.courseStatus) ? normalized.courseStatus : "مسجل";
  normalized.result = militaryEducationAllowedResults.includes(normalized.result) ? normalized.result : "مؤجل";
  normalized.completed = normalized.completed === true || normalized.courseStatus === "مكتمل" || normalized.result === "مقبول" || normalized.result === "ناجح";
  normalized.completionStatus = normalized.completed ? "منتهي" : "غير منتهي";
  normalized.updatedAt = normalized.updatedAt || new Date().toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
  return normalized;
};

const updateAdmissionStatus = (application, nextStatus, message, actor = "موظف شؤون الطلاب", extra = {}) => {
  application.status = nextStatus;
  application.m2Status = m2StatusMap[nextStatus] || nextStatus;
  application.history.unshift({
    title: message,
    time: new Date().toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }),
    actor,
    ...extra,
  });
  if (extra.reason) application.rejectionReason = extra.reason;
  if (extra.infoRequest) application.additionalInfoRequest = extra.infoRequest;
};

const updateGradeAppealStatus = (appeal, nextStatus, message, actor = "موظف شؤون الطلاب", extra = {}) => {
  appeal.status = nextStatus;
  appeal.history.unshift({
    title: message,
    time: new Date().toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }),
    actor,
    ...extra,
  });
};

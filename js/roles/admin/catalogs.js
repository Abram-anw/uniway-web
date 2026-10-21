// ===== شاشات إدارة الكيانات — إعدادات كل كيان + موزّع الصفحات =====
// كل الشاشات تستخدم قالب crudPage المشترك (js/core/crud.js) والمخازن من Catalog (js/core/store.js).
// الإعدادات هنا تحدد الأعمدة والحقول والتحقق الخاص بكل كيان فقط.

// حالة المستند (نسخة العرض لشاشات الأدمن — ملفات الشؤون تحمّل نسختها الخاصة)
const DOC_STATUS_META = {
  pending: { label: "قيد المراجعة", tone: "amber" },
  accepted: { label: "مقبول", tone: "green" },
  rejected: { label: "مرفوض", tone: "red" },
};
const docStatusBadge = (status) => {
  const meta = DOC_STATUS_META[status] || { label: status || "—", tone: "gray" };
  return badge(meta.label, meta.tone);
};
const excerpt = (s, n = 60) => { const t = String(s || ""); return t.length > n ? t.slice(0, n) + "…" : t; };
const sectionOptions = () => (typeof affairsSections !== "undefined" ? affairsSections.map((s) => ({ value: s.label, label: s.label })) : []);

const CRUD_PAGES = {
  // ── المقررات ──
  courses: {
    title: "المقررات",
    subtitle: "إدارة كتالوج المقررات الجامعية — تظهر التعديلات في شاشات الدكاترة والدرجات بعد الحفظ",
    store: Catalog.courses,
    idKey: "code",
    rowLabel: (r) => `${r.code} – ${r.name}`,
    columns: [
      { title: "الكود", render: (r) => `<b dir="ltr">${esc(r.code)}</b>` },
      { title: "اسم المقرر", render: (r) => esc(r.name) },
      { title: "الفرقة", render: (r) => badge(r.year || "—", "blue") },
      { title: "الساعات", render: (r) => r.hours },
      { title: "الطلاب", render: (r) => r.students },
      { title: "رصد الدرجات", render: (r) => (r.graded ? badge("منتهي", "green") : badge("لم يُرصد", "gray")) },
    ],
    fields: [
      { key: "code", label: "كود المقرر", type: "text", required: true, dir: "ltr", placeholder: "مثال: COMP301", hint: "حروف كبيرة يتبعها 3 أرقام — لا يمكن تغييره بعد الإنشاء.", readOnlyOnEdit: true },
      { key: "name", label: "اسم المقرر", type: "text", required: true },
      { key: "year", label: "الفرقة الدراسية", type: "select", required: true, options: () => Catalog.years.list().map((y) => ({ value: y.label, label: y.label })) },
      { key: "hours", label: "عدد الساعات", type: "number", required: true, min: 1, max: 6 },
      { key: "students", label: "عدد الطلاب", type: "number", min: 0, max: 999 },
      { key: "graded", label: "تم رصد الدرجات", type: "checkbox" },
    ],
    search: { placeholder: "ابحث بالكود أو الاسم أو الفرقة...", test: (r, q) => `${r.code} ${r.name} ${r.year}`.toLowerCase().includes(q.toLowerCase()) },
  },

  // ── الأقسام ──
  departments: {
    title: "الأقسام",
    subtitle: "إدارة الأقسام — تظهر في قوائم القسم عند إضافة وتعديل المستخدمين",
    store: Catalog.departments,
    idKey: "id",
    rowLabel: (r) => r.name,
    columns: [
      { title: "اسم القسم", render: (r) => `<b>${esc(r.name)}</b>` },
      { title: "المستخدمون", render: (r) => (typeof Auth !== "undefined" ? Auth.getUsers().filter((u) => u.department === r.name).length : 0) },
      { title: "الطلاب", render: (r) => (typeof students !== "undefined" ? students.filter((s) => s.program === r.name).length : 0) },
    ],
    fields: [
      { key: "name", label: "اسم القسم", type: "text", required: true, hint: "قسم مرتبط بمستخدمين أو طلاب لا يمكن حذفه أو تغيير اسمه." },
    ],
    search: { placeholder: "ابحث باسم القسم...", test: (r, q) => r.name.toLowerCase().includes(q.toLowerCase()) },
  },

  // ── السنوات الدراسية ──
  years: {
    title: "السنوات الدراسية",
    subtitle: "إدارة الفرق الدراسية — تظهر في نماذج المستخدمين وتصنيف المقررات",
    store: Catalog.years,
    idKey: "id",
    rowLabel: (r) => r.label,
    columns: [
      { title: "الفرقة", render: (r) => `<b>${esc(r.label)}</b>` },
      { title: "المقررات", render: (r) => (typeof courseCatalog !== "undefined" ? courseCatalog.filter((c) => c.year === r.label).length : 0) },
    ],
    fields: [
      { key: "label", label: "اسم الفرقة", type: "text", required: true, hint: "فرقة عليها مقررات أو طلاب لا يمكن حذفها أو تغيير اسمها." },
    ],
    search: { placeholder: "ابحث باسم الفرقة...", test: (r, q) => r.label.toLowerCase().includes(q.toLowerCase()) },
  },

  // ── الإعلانات الجامعية ──
  announcements: {
    title: "الإعلانات الجامعية",
    subtitle: "إدارة الإعلانات — إعلانات المقررات تظهر في شاشة المقرر لدى الدكاترة والطلاب",
    store: Catalog.announcements,
    idKey: "id",
    rowLabel: (r) => r.title,
    columns: [
      { title: "العنوان", render: (r) => `<b>${esc(r.title)}</b>` },
      { title: "المحتوى", render: (r) => esc(excerpt(r.body)) },
      { title: "المقرر", render: (r) => (r.course ? badge(r.course, "blue") : badge("عامة", "gray")) },
      { title: "منشئ الإعلان", render: (r) => badge(r.creatorName || (r.creatorRole === "admin" ? "أدمن" : r.creatorRole === "affairs" ? "شئون الطلاب" : r.creatorRole === "doctor" ? "دكتور" : null) || r.createdBy || "—", "gray") },
      { title: "تاريخ النشر", render: (r) => esc(r.at || "—") },
    ],
    rowActions: (r) => {
      const me = typeof Auth !== "undefined" && typeof Auth.current === "function" ? Auth.current() : null;
      const canEdit = me && String(me.code) === String(r.createdBy);
      return `<div style="display:flex;gap:6px;white-space:nowrap">
        <button class="btn ghost" type="button" data-crud-view="${esc(r.id)}">عرض</button>
        ${canEdit
          ? `<button class="btn outline" type="button" data-crud-edit="${esc(r.id)}">تعديل</button>`
          : ""}
        <button class="btn danger" type="button" data-crud-del="${esc(r.id)}">حذف</button>
      </div>`;
    },
    onView: (r) => {
      modal(
        `<h2>${esc(r.title)}</h2>
         <p>${r.creatorName ? `بواسطة ${esc(r.creatorName)}` : "تفاصيل الإعلان"}</p>
         <div class="card" style="margin-top:12px">
           <p style="white-space:pre-wrap;margin:0">${esc(r.body)}</p>
         </div>
         <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
           ${r.course ? badge(r.course, "blue") : badge("إعلان عام", "gray")}
           ${badge(r.at || "—", "gray")}
         </div>
         <div class="acts"><button class="btn ghost" type="button" data-close>إغلاق</button></div>`,
        (m, close) => { $("[data-close]", m).onclick = close; },
      );
    },
    fields: [
      { key: "title", label: "عنوان الإعلان", type: "text", required: true, autofocus: true, placeholder: "مثال: موعد اختبار الميدتيرم" },
      { key: "body", label: "محتوى الإعلان", type: "textarea", required: true, placeholder: "اكتب نص الإعلان هنا..." },
      { key: "at", label: "تاريخ النشر", type: "text", default: "الآن", placeholder: "مثال: 15 أكتوبر 2026" },
    ],
    search: { placeholder: "ابحث بالعنوان أو المحتوى...", test: (r, q) => `${r.title} ${r.body}`.toLowerCase().includes(q.toLowerCase()) },
  },

  // ── المستندات ──
  documents: {
    title: "المستندات",
    subtitle: "إدارة سجلات المستندات المرفقة بطلبات الطلاب — تظهر في شاشات الطلبات والمستندات",
    store: Catalog.documents,
    idKey: "id",
    rowLabel: (r) => `${r.name} (${r.requestId})`,
    columns: [
      { title: "اسم المستند", render: (r) => `<b>${esc(r.name)}</b>` },
      { title: "الطلب", render: (r) => `${esc(r.studentName || "")} <span dir="ltr" style="color:var(--mut)">${esc(r.requestId)}</span>` },
      { title: "النوع", render: (r) => esc(r.type) },
      { title: "الملف", render: (r) => `<span dir="ltr">${esc(r.fileName)}</span>` },
      { title: "الحالة", render: (r) => docStatusBadge(r.status) },
    ],
    fields: [
      { key: "requestId", label: "الطلب المرتبط", type: "select", required: true, readOnlyOnEdit: true, options: () => (typeof studentRequests !== "undefined" ? studentRequests.map((r) => ({ value: r.id, label: `${r.id} – ${r.studentName}` })) : []) },
      { key: "name", label: "اسم المستند", type: "text", required: true, placeholder: "مثال: الشهادة الثانوية" },
      { key: "type", label: "نوع المستند", type: "text", required: true, placeholder: "مثال: شهادة الثانوية" },
      { key: "fileName", label: "اسم الملف", type: "text", required: true, dir: "ltr", placeholder: "certificate.pdf", hint: "امتداد الملف يحدد نوعه للمعاينة (pdf أو صورة)." },
      { key: "status", label: "الحالة", type: "select", required: true, default: "pending", options: () => Object.entries(DOC_STATUS_META).map(([value, m]) => ({ value, label: m.label })) },
      { key: "rejectionReason", label: "سبب الرفض", type: "text", hint: "مطلوب فقط عند اختيار حالة «مرفوض»." },
    ],
    search: { placeholder: "ابحث باسم المستند أو الطالب أو الطلب...", test: (r, q) => `${r.name} ${r.type} ${r.fileName} ${r.studentName || ""} ${r.requestId}`.toLowerCase().includes(q.toLowerCase()) },
  },

  // ── الأسئلة الشائعة لمعرفة المساعد الذكي ──
  faqs: {
    title: "الأسئلة الشائعة لمعرفة المساعد الذكي",
    subtitle: "إدارة قاعدة معرفة المساعد الذكي (الأسئلة والأجوبة) ومنشورها للطلاب",
    formTitle: "سؤال جديد",
    store: Catalog.faqs,
    idKey: "id",
    rowLabel: (r) => excerpt(r.question, 40),
    columns: [
      { title: "السؤال", render: (r) => `<b>${esc(r.question)}</b>` },
      { title: "الإجابة", render: (r) => esc(excerpt(r.answer)) },
      { title: "التصنيف", render: (r) => badge(r.category || "عام", "blue") },
      { title: "الحالة", render: (r) => (r.published ? badge("منشور", "green") : badge("مسودة", "amber")) },
    ],
    fields: [
      { key: "question", label: "السؤال", type: "textarea", required: true },
      { key: "answer", label: "الإجابة", type: "textarea", required: true },
      { key: "category", label: "التصنيف", type: "select", options: () => sectionOptions(), placeholder: "عام" },
      { key: "published", label: "منشور للطلاب", type: "checkbox" },
    ],
    search: { placeholder: "ابحث في الأسئلة أو الأجوبة...", test: (r, q) => `${r.question} ${r.answer}`.toLowerCase().includes(q.toLowerCase()) },
  },

  // ── خدمات الجامعة ──
  services: {
    title: "خدمات الجامعة",
    subtitle: "إدارة خدمات الجامعة المعروضة للطلاب وتصنيفها حسب أقسام الخدمات",
    formTitle: "خدمة جديدة",
    store: Catalog.services,
    idKey: "id",
    rowLabel: (r) => r.title,
    columns: [
      { title: "الخدمة", render: (r) => `<b>${esc(r.title)}</b>` },
      { title: "الوصف", render: (r) => esc(excerpt(r.description)) },
      { title: "القسم", render: (r) => badge(r.section || "عام", "blue") },
      { title: "الحالة", render: (r) => (r.available ? badge("متاحة", "green") : badge("متوقفة", "gray")) },
    ],
    fields: [
      { key: "title", label: "اسم الخدمة", type: "text", required: true },
      { key: "description", label: "وصف الخدمة", type: "textarea", required: true },
      { key: "section", label: "القسم", type: "select", options: () => sectionOptions(), placeholder: "عام" },
      { key: "available", label: "الخدمة متاحة", type: "checkbox", default: true },
    ],
    search: { placeholder: "ابحث باسم الخدمة أو الوصف...", test: (r, q) => `${r.title} ${r.description}`.toLowerCase().includes(q.toLowerCase()) },
  },
};

// موزّع الصفحات: كل صفحة HTML تمرر مفتاح الكيان وتستلم نفس القالب
const adminCatalogPage = (view, [entity]) => {
  const cfg = CRUD_PAGES[entity];
  if (!cfg) {
    view.innerHTML = errorBox("الشاشة غير موجودة", "تحقق من الرابط أو عد إلى لوحة التحكم.", '<a class="btn primary" href="dashboard.html">لوحة التحكم</a>');
    return;
  }
  crudPage(view, cfg);
};

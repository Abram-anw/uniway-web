// اختبارات طبقة خدمات إدارة الكيانات (Catalog) — تشغل مباشرة بـ Node بدون متصفح.
// التشغيل: node tests/crud.test.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// ── محاكاة بيئة المتصفح ────────────────────────────────────────────────
function makeStore() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    _map: m,
  };
}

const storage = { localStorage: makeStore(), sessionStorage: makeStore() };

function installBrowserEnv() {
  globalThis.localStorage = storage.localStorage;
  globalThis.sessionStorage = storage.sessionStorage;
  globalThis.window = globalThis;
  globalThis.document = { documentElement: { style: {} } };
  globalThis.location = {
    href: "http://localhost/admin/courses.html",
    pathname: "/admin/courses.html",
    replace(url) { this.href = url; },
  };
}

const SOURCES = [
  "js/core/auth.js",
  "js/core/settings.js",
  "js/core/data.js",
  "js/core/store.js",
  "js/roles/admin/pages.js",
  "js/roles/admin/catalogs.js",
];

function loadSources() {
  installBrowserEnv();
  const src = SOURCES.map(f => readFileSync(join(root, f), "utf8")).join("\n;\n");
  (0, eval)(src + `
;globalThis.Auth = Auth;
globalThis.Settings = Settings;
globalThis.Catalog = Catalog;
globalThis.CRUD_PAGES = CRUD_PAGES;
globalThis.students = students;
globalThis.courses = courses;
globalThis.courseCatalog = courseCatalog;
globalThis.studentRequests = studentRequests;
globalThis.announcements = announcements;
globalThis.lectures = lectures;
`);
}

// ── أدوات التحقق ───────────────────────────────────────────────────────
let passed = 0, failed = 0;
function ok(cond, name) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}
function section(name) { console.log(`\n== ${name} ==`); }

function login(code) {
  storage.localStorage.setItem("uniway_session", JSON.stringify({ code }));
  storage.sessionStorage.removeItem("uniway_session");
}
function logout() {
  storage.localStorage.removeItem("uniway_session");
  storage.sessionStorage.removeItem("uniway_session");
}
// إعادة تحميل المصادر مع الحفاظ على التخزين (محاكاة تحديث الصفحة)
function freshReload() {
  loadSources();
}

// ── التنفيذ ─────────────────────────────────────────────────────────────
section("بوابة الصلاحية على مستوى الخدمة (settings.manage)");
loadSources();
{
  logout();
  const r1 = Catalog.courses.create({ code: "XXX100", name: "مقرر", year: "الأولى", hours: 2 });
  ok(r1.ok === false && r1.error, "بدون جلسة: الإنشاء مرفوض من طبقة الخدمة");
  login("ST4001");
  const r2 = Catalog.departments.create({ name: "قسم تجريبي" });
  ok(r2.ok === false && r2.error, "طالب: الإنشاء مرفوض");
  const r3 = Catalog.faqs.update("FAQ-1", { question: "x", answer: "y" });
  ok(r3.ok === false && r3.error, "طالب: التعديل مرفوض");
  const r4 = Catalog.services.remove("SVC-1");
  ok(r4.ok === false && r4.error, "طالب: الحذف مرفوض");
  login("SA2001");
  const r5 = Catalog.courses.create({ code: "XXX100", name: "مقرر", year: "الأولى", hours: 2 });
  ok(r5.ok === false && r5.error, "شؤون بدون settings.manage: مرفوض");
  login("AD3001");
  const r6 = Catalog.courses.create({ code: "XXX100", name: "مقرر", year: "الأولى", hours: 2 });
  ok(r6.ok === true, "أدمن: الإنشاء مسموح");
}

section("المقررات: تحقق القيم والتفرد والتكامل المرجعي");
{
  ok(Catalog.courses.list().length === 7, "الكتالوج فيه 7 مقررات بعد إضافة XXX100");
  const dup = Catalog.courses.create({ code: "comp301", name: "مكرر", year: "الأولى", hours: 2 });
  ok(dup.ok === false && dup.errors && dup.errors.code, "كود مكرر (حتى بحروف صغيرة) مرفوض");
  const badCode = Catalog.courses.create({ code: "BAD", name: "مقرر", year: "الأولى", hours: 2 });
  ok(badCode.ok === false && badCode.errors.code, "كود لا يطابق الصيغة مرفوض");
  const badYear = Catalog.courses.create({ code: "XXX200", name: "مقرر", year: "فرقة وهمية", hours: 2 });
  ok(badYear.ok === false && badYear.errors.year, "فرقة غير معروفة مرفوضة");
  const badHours = Catalog.courses.create({ code: "XXX200", name: "مقرر", year: "الأولى", hours: 9 });
  ok(badHours.ok === false && badHours.errors.hours, "ساعات خارج النطاق مرفوضة");
  const badName = Catalog.courses.create({ code: "XXX200", name: "  ", year: "الأولى", hours: 2 });
  ok(badName.ok === false && badName.errors.name, "الاسم المطلوب مرفوض عند فراغه");

  // تعديل مقرر مسند يجب أن يتزامن مع نسخة الإسناد في المتغير العام courses
  const up = Catalog.courses.update("COMP301", { code: "COMP301", name: "قواعد بيانات متقدمة", year: "الثالثة", hours: 3, students: 45, graded: false });
  ok(up.ok === true, "تعديل مقرر مسند نجح");
  ok(typeof courses !== "undefined" && courses.find(c => c.code === "COMP301").name === "قواعد بيانات متقدمة", "التعديل تزامن مع المقرر المسند عند الدكتور");

  const delAssigned = Catalog.courses.remove("COMP401");
  ok(delAssigned.ok === false && delAssigned.error, "حذف مقرر مسند لعضو هيئة تدريس مرفوض");
  lectures.push({ id: 99, course: "XXX100", title: "محاضرة", type: "PDF", at: "الآن" });
  const delWithLectures = Catalog.courses.remove("XXX100");
  ok(delWithLectures.ok === false && delWithLectures.error, "حذف مقرر عليه محاضرات مرفوض");
  lectures.splice(lectures.findIndex(l => l.id === 99), 1);
  const del = Catalog.courses.remove("XXX100");
  ok(del.ok === true && Catalog.courses.list().length === 6, "حذف مقرر غير مسنج وبدون محاضرات نجح");
}

section("الأقسام: التفرد وربط المستخدمين والطلاب");
{
  const names = Catalog.departments.list().map(d => d.name);
  ok(names.length === 11 && names.includes("علوم الحاسب") && names.includes("الإدارة"), "بذرة الأقسام من قائمة DEPARTMENTS (11 قسم)");
  const dup = Catalog.departments.create({ name: "علوم الحاسب" });
  ok(dup.ok === false && dup.errors.name, "قسم مكرر مرفوض");
  const empty = Catalog.departments.create({ name: "   " });
  ok(empty.ok === false && empty.errors.name, "اسم القسم المطلوب مرفوض عند فراغه");
  const delUsers = Catalog.departments.remove(Catalog.departments.list().find(d => d.name === "علوم الحاسب").id);
  ok(delUsers.ok === false && delUsers.error, "حذف قسم عليه مستخدمون مرفوض");
  const delStudents = Catalog.departments.remove(Catalog.departments.list().find(d => d.name === "بحتة حاسب").id);
  ok(delStudents.ok === false && delStudents.error, "حذف قسم عليه طلاب (برامج) مرفوض");
  const free = Catalog.departments.list().find(d => d.name === "اللغة العربية");
  const delFree = Catalog.departments.remove(free.id);
  ok(delFree.ok === true, "حذف قسم غير مرتبط نجح");
  const updRef = Catalog.departments.update(Catalog.departments.list().find(d => d.name === "الرياضيات").id, { name: "الرياضيات التطبيقية" });
  ok(updRef.ok === false && updRef.errors.name, "تغيير اسم قسم مرتبط بمستخدمين مرفوض");
  const created = Catalog.departments.create({ name: "قسم التجربة" });
  ok(created.ok === true && created.record.id.startsWith("DEP-"), "إنشاء قسم جديد بمعرف تلقائي");
}

section("السنوات الدراسية: التفرد والربط بالمقررات");
{
  ok(Catalog.years.list().length === 4, "بذرة الفرق = 4 فرق");
  const dup = Catalog.years.create({ label: "الثالثة" });
  ok(dup.ok === false && dup.errors.label, "فرقة مكررة مرفوضة");
  const used = Catalog.years.list().find(y => y.label === "الثالثة");
  const delUsed = Catalog.years.remove(used.id);
  ok(delUsed.ok === false && delUsed.error, "حذف فرقة عليها مقررات مرفوض");
  const renUsed = Catalog.years.update(used.id, { label: "التالتة" });
  ok(renUsed.ok === false && renUsed.errors.label, "تغيير اسم فرقة عليها مقررات مرفوض");
  const freeYear = Catalog.years.create({ label: "الخامسة" });
  ok(freeYear.ok === true, "إنشاء فرقة جديدة نجح");
  const courseWithNewYear = Catalog.courses.create({ code: "GRD501", name: "مقرر الفرقة الخامسة", year: "الخامسة", hours: 2 });
  ok(courseWithNewYear.ok === true, "المقرر الجديد يقبل الفرقة المضافة حديثًا (تكامل بين المخزنين)");
  Catalog.courses.remove("GRD501");
  const delFree = Catalog.years.remove(Catalog.years.list().find(y => y.label === "الأولى").id);
  ok(delFree.ok === true, "حذف فرقة غير مستخدمة نجح");
}

section("الإعلانات الجامعية");
{
  const before = Catalog.announcements.list();
  ok(before.length === 2 && before.every(a => a.id), "الإعلانات المبدئية 2 ولكل سجل معرف");
  const bad = Catalog.announcements.create({ title: "", body: "نص", at: "2026" });
  ok(bad.ok === false && bad.errors.title, "عنوان الإعلان مطلوب");
  const badCourse = Catalog.announcements.create({ title: "إعلان", body: "نص", at: "الآن", course: "NOPE999" });
  ok(badCourse.ok === false && badCourse.errors.course, "مقرر غير موجود مرفوض");
  const created = Catalog.announcements.create({ title: "إعلان جديد", body: "محتوى الإعلان", at: "15 أكتوبر 2026", course: "COMP301" });
  ok(created.ok === true, "إنشاء إعلان لمقرر محدد نجح");
  const createdGeneral = Catalog.announcements.create({ title: "إعلان عام", body: "لكل الجامعة", at: "15 أكتوبر 2026", course: "" });
  ok(createdGeneral.ok === true, "إنشاء إعلان عام (بدون مقرر) نجح");
  const up = Catalog.announcements.update(created.record.id, { title: "إعلان معدل", body: "محتوى معدل", at: "16 أكتوبر 2026", course: "" });
  ok(up.ok === true && up.record.title === "إعلان معدل", "تعديل الإعلان نجح");
  const del = Catalog.announcements.remove(createdGeneral.record.id);
  ok(del.ok === true && Catalog.announcements.list().length === 3, "حذف الإعلان نجح والقائمة تحدثت");
}

section("المستندات المرتبطة بطلبات الطلاب");
{
  const sr1048 = studentRequests.find(r => r.id === "SR-1048");
  ok(Catalog.documents.list().length === 10, "المستندات المبدئية 10 عبر الطلبات");
  ok(sr1048.documents.length === 3, "الطلب SR-1048 فيه 3 مستندات");
  const badReq = Catalog.documents.create({ requestId: "NOPE", name: "مستند", type: "نوع", fileName: "a.pdf", status: "pending" });
  ok(badReq.ok === false && badReq.errors.requestId, "طلب غير موجود مرفوض");
  const noName = Catalog.documents.create({ requestId: "SR-1048", name: "", type: "نوع", fileName: "a.pdf", status: "pending" });
  ok(noName.ok === false && noName.errors.name, "اسم المستند مطلوب");
  const rejNoReason = Catalog.documents.create({ requestId: "SR-1048", name: "مستند", type: "نوع", fileName: "a.pdf", status: "rejected" });
  ok(rejNoReason.ok === false && rejNoReason.errors.rejectionReason, "رفض بدون سبب مرفوض");
  const badFile = Catalog.documents.create({ requestId: "SR-1048", name: "مستند", type: "نوع", fileName: "ملف بدون امتداد", status: "pending" });
  ok(badFile.ok === false && badFile.errors.fileName, "اسم ملف بدون امتداد مرفوض");
  const created = Catalog.documents.create({ requestId: "SR-1048", name: "شهادة ميلاد", type: "شهادة ميلاد", fileName: "birth.jpg", status: "pending" });
  ok(created.ok === true && created.record.fileType === "image", "إنشاء مستند صوري نجح ونوع الملف صورة");
  ok(sr1048.documents.length === 4 && sr1048.documents.some(d => d.id === created.record.id), "المستند ظهر داخل مصفوفة مستندات الطلب نفسها");
  const up = Catalog.documents.update(created.record.id, { name: "شهادة ميلاد", type: "شهادة ميلاد", fileName: "birth.jpg", status: "rejected", rejectionReason: "غير واضحة" });
  ok(up.ok === true && up.record.status === "rejected", "تعديل حالة المستند إلى مرفوض بسبب صحيح نجح");
  const del = Catalog.documents.remove(created.record.id);
  ok(del.ok === true && sr1048.documents.length === 3, "حذف المستند نجح وقائمة الطلب تحدثت");
}

section("الأسئلة الشائعة لمعرفة المساعد الذكي");
{
  ok(Catalog.faqs.list().length === 4, "بذرة الأسئلة 4");
  const created = Catalog.faqs.create({ question: "كيف أسجل في مقرر؟", answer: "من صفحة التسجيل.", category: "التسجيل", published: true });
  ok(created.ok === true, "إنشاء سؤال نجح");
  const badCat = Catalog.faqs.create({ question: "س", answer: "ج", category: "تصنيف وهمي", published: false });
  ok(badCat.ok === false && badCat.errors.category, "تصنيف غير معروف مرفوض");
  const up = Catalog.faqs.update(created.record.id, { question: "كيف أسجل في مقرر؟", answer: "من صفحة التسجيل الأكاديمي.", category: "التسجيل", published: false });
  ok(up.ok === true && up.record.published === false, "تعديل السؤال وتحويله لمسودة نجح");
  ok(Catalog.faqs.remove(created.record.id).ok === true, "حذف السؤال نجح");
}

section("خدمات الجامعة");
{
  ok(Catalog.services.list().length === 5, "بذرة الخدمات 5");
  const created = Catalog.services.create({ title: "خدمة تجريبية", description: "وصف الخدمة", section: "الدعم", available: true });
  ok(created.ok === true, "إنشاء خدمة نجح");
  const empty = Catalog.services.create({ title: "  ", description: "وصف", section: "الدعم", available: true });
  ok(empty.ok === false && empty.errors.title, "اسم الخدمة مطلوب");
  ok(Catalog.services.update(created.record.id, { title: "خدمة تجريبية 2", description: "وصف", section: "الدعم", available: false }).ok === true, "تعديل الخدمة نجح");
  ok(Catalog.services.remove(created.record.id).ok === true, "حذف الخدمة نجح");
}

section("ال persistence: البيانات محفوظة بعد إعادة تحميل الصفحة");
{
  Catalog.courses.create({ code: "PRP100", name: "مقرر محفوظ", year: "الثانية", hours: 2, students: 10, graded: true });
  Catalog.courses.update("COMP301", { name: "قواعد بيانات متقدمة", year: "الثالثة", hours: 3, students: 45, graded: false });
  Catalog.announcements.create({ title: "إعلان محفوظ", body: "نص", at: "الآن", course: "" });
  Catalog.documents.create({ requestId: "SR-1042", name: "مستند محفوظ", type: "تقرير", fileName: "saved.pdf", status: "accepted" });
  Catalog.faqs.create({ question: "سؤال محفوظ؟", answer: "نعم.", category: "الدعم", published: true });
  Catalog.services.create({ title: "خدمة محفوظة", description: "وصف", section: "المنح", available: true });
  Catalog.departments.create({ name: "قسم محفوظ" });
  Catalog.years.create({ label: "السادسة" });

  freshReload();

  ok(Catalog.courses.list().some(c => c.code === "PRP100"), "المقرر الجديد باقٍ بعد إعادة التحميل");
  ok(Catalog.courses.list().find(c => c.code === "COMP301").name === "قواعد بيانات متقدمة", "تعديل المقرر باقٍ بعد إعادة التحميل");
  ok(!Catalog.courses.list().some(c => c.code === "XXX100"), "المقرر المحذوف لم يعد بعد إعادة التحميل");
  ok(courses.find(c => c.code === "COMP301")?.name === "قواعد بيانات متقدمة", "مزامنة المقررات المسندة طبقت بعد إعادة التحميل");
  ok(Catalog.announcements.list().some(a => a.title === "إعلان محفوظ") && announcements.some(a => a.title === "إعلان محفوظ"), "الإعلان الجديد باقٍ ومتزامن مع القائمة العامة");
  const sr1042 = studentRequests.find(r => r.id === "SR-1042");
  ok(Catalog.documents.list().some(d => d.name === "مستند محفوظ") && sr1042.documents.some(d => d.name === "مستند محفوظ"), "المستند الجديد باقٍ ومتزامن مع الطلب");
  ok(Catalog.faqs.list().some(f => f.question === "سؤال محفوظ؟"), "السؤال المحفوظ باقٍ");
  ok(Catalog.services.list().some(s => s.title === "خدمة محفوظة"), "الخدمة المحفوظة باقية");
  ok(Catalog.departments.list().some(d => d.name === "قسم محفوظ"), "القسم المحفوظ باقٍ");
  ok(Catalog.years.list().some(y => y.label === "السادسة"), "الفرقة المحفوظة باقية");
  ok(Catalog.departments.list().some(d => d.name === "اللغة العربية") === false, "القسم المحذوف لم يعد بعد إعادة التحميل");
}

section("خرائط الصلاحيات للصفحات الجديدة وإعدادات القوالب");
{
  ok(Auth.pagePermission("courses.html") === "settings.manage", "courses.html → settings.manage");
  ok(Auth.pagePermission("academic-years.html") === "settings.manage", "academic-years.html → settings.manage");
  ok(Auth.pagePermission("documents.html") === "students.view", "documents.html (بدون سياق) → students.view");
  ok(Auth.pagePermission("documents.html", "affairs") === "students.view", "documents.html في سياق شؤون → students.view");
  ok(Auth.pagePermission("documents.html", "admin") === "settings.manage", "admin/documents.html → settings.manage");
  const expected = ["courses", "departments", "years", "announcements", "documents", "faqs", "services"];
  ok(expected.every(k => CRUD_PAGES[k]), "CRUD_PAGES يحتوي الشاشات السبع");
  ok(Object.keys(CRUD_PAGES).length === 7, "لا توجد شاشات زائدة في CRUD_PAGES");
  ok(expected.every(k => CRUD_PAGES[k].store && CRUD_PAGES[k].idKey && CRUD_PAGES[k].columns.length && CRUD_PAGES[k].fields.length && CRUD_PAGES[k].rowLabel), "كل إعداد شاشة مكتمل (store/idKey/columns/fields/rowLabel)");
  ok(CRUD_PAGES.courses.idKey === "code", "معرف المقررات هو الكود");
  ok(CRUD_PAGES.documents.fields.some(f => f.key === "requestId" && f.readOnlyOnEdit), "ربط المستند بالطلب غير قابل للتغيير بعد الإنشاء");
  ok(CRUD_PAGES.documents.fields.find(f => f.key === "status").default === "pending", "حالة المستند الافتراضية عند الإنشاء: قيد المراجعة");
  ok(CRUD_PAGES.services.fields.find(f => f.key === "available").default === true, "الخدمة الجديدة متاحة افتراضيًا");
  ok(typeof CRUD_PAGES.years !== "undefined" && CRUD_PAGES.years.idKey === "id", "مفتاح السنوات الدراسية هو years (وليس academic-years)");
}

console.log(`\nالنتيجة: ${passed} ناجح / ${failed} فاشل`);
process.exit(failed ? 1 : 0);

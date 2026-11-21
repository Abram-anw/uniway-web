// اختبارات إدارة أنواع الطلبات والمستندات المطلوبة — تشغل مباشرة بـ Node بدون متصفح.
// البذرة تُقرأ من ملف الإعدادات الفعلي data/request-types.json (المصدر الموحّد مع تطبيق الطالب).
// التشغيل: node tests/request-types.test.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const seedRaw = JSON.parse(readFileSync(join(root, "data", "request-types.json"), "utf8"));

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
    href: "http://localhost/admin/request-types.html",
    pathname: "/admin/request-types.html",
    replace(url) { this.href = url; },
  };
}

const SOURCES = [
  "js/core/auth.js",
  "js/core/settings.js",
  "js/core/data.js",
  "js/core/requests-config.js",
];

function loadSources() {
  installBrowserEnv();
  const src = SOURCES.map(f => readFileSync(join(root, f), "utf8")).join("\n;\n");
  (0, eval)(src + `
;globalThis.Auth = Auth;
;globalThis.Settings = Settings;
;globalThis.RequestTypes = RequestTypes;
;globalThis.studentRequests = studentRequests;
;globalThis.requestDocumentsById = requestDocumentsById;
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
function freshReload() {
  delete globalThis.Auth;
  delete globalThis.Settings;
  delete globalThis.RequestTypes;
  delete globalThis.studentRequests;
  delete globalThis.requestDocumentsById;
  loadSources();
}
const load = () => RequestTypes.ready(() => seedRaw);

const typeByName = (name) => RequestTypes.list().find(t => t.name === name) || null;

// ── التنفيذ ─────────────────────────────────────────────────────────────
loadSources();
section("البذرة من ملف الإعدادات الفعلي: الأنواع الثمانية محفوظة");
login("AD3001");
{
  await load();
  const types = RequestTypes.list();
  ok(types.length === 8, "الأنواع الثمانية محمّلة من data/request-types.json");
  const ids = types.map(t => t.id);
  ok(["enrollment", "transcript", "graduation", "suspend", "transfer", "replacement", "exam-excuse", "other"].every(id => ids.includes(id)), "معرفات الأنواع الأصلية محفوظة كما هي");
  const enrollment = typeByName("إفادة قيد");
  ok(enrollment && enrollment.requirements.length === 3, "إفادة قيد: 3 مستندات");
  ok(typeByName("طلب شهادة التخرج").requirements.length === 6, "طلب شهادة التخرج: 6 مستندات");
  ok(enrollment.requirements.every(r => r.mandatory === true), "إفادة قيد: كل مستنداتها إلزامية");
  const transcript = typeByName("كشف درجات رسمي");
  ok(transcript.requirements.some(r => r.mandatory === false), "كشف درجات: فيه مستند اختياري");
  const selectReq = typeByName("إعذار عن امتحان").requirements.find(r => r.kind === "select");
  ok(selectReq && Array.isArray(selectReq.options) && selectReq.options.length === 3, "إعذار عن امتحان: حقل قائمة اختيار بخياراته");
  ok(enrollment.requirements.every(r => r.id && r.name && r.hint && r.kind), "لكل مستند معرف واسم وتوضيح ونوع حقل");
}

section("بوابة الصلاحية على مستوى الخدمة");
{
  logout();
  ok(RequestTypes.create({ name: "x", description: "y" }).error === "غير مصرح بتنفيذ هذا الإجراء.", "بدون تسجيل دخول: الإنشاء مرفوض");
  login("ST4001");
  ok(RequestTypes.update("enrollment", { name: "x", description: "y" }).error === "غير مصرح بتنفيذ هذا الإجراء.", "طالب: التعديل مرفوض");
  login("SA2001");
  ok(RequestTypes.removeDocument("enrollment", "enrollment-r1").error === "غير مصرح بتنفيذ هذا الإجراء.", "شؤون: حذف مستند مرفوض");
  login("AD3001");
  ok(RequestTypes.addDocument("enrollment", { name: "مستند من الأدمن", hint: "توضيح", kind: "file" }).ok === true, "أدمن: الإضافة مسموحة");
  const enrollment = typeByName("إفادة قيد");
  const added = enrollment.requirements.find(r => r.name === "مستند من الأدمن");
  ok(!!added, "المستند المضاف موجود داخل النوع");
  const del = RequestTypes.removeDocument("enrollment", added.id);
  ok(del.ok === true, "تنظيف: حذف المستند المؤقت");
}

section("أنواع الطلبات: إنشاء وتعديل وحذف مع منع التكرار");
{
  const dup = RequestTypes.create({ name: "إفادة قيد", description: "مكرر" });
  ok(dup.ok === false && dup.errors.name === "يوجد نوع طلب بنفس الاسم بالفعل.", "منع تكرار اسم نوع الطلب");
  const noName = RequestTypes.create({ name: "  ", description: "وصف" });
  ok(noName.ok === false && noName.errors.name === "اسم نوع الطلب مطلوب.", "اسم نوع الطلب مطلوب");
  const noDesc = RequestTypes.create({ name: "نوع تجريبي", description: "" });
  ok(noDesc.ok === false && noDesc.errors.description === "وصف نوع الطلب مطلوب.", "وصف نوع الطلب مطلوب");
  const created = RequestTypes.create({ name: "نوع تجريبي", description: "وصف تجريبي", iconName: "clock" });
  ok(created.ok === true && created.record.id.startsWith("RT-"), "إنشاء نوع جديد بمعرف تلقائي");
  ok(created.record.requirements.length === 0, "النوع الجديد يبدأ بدون مستندات");
  const renamed = RequestTypes.update(created.record.id, { name: "نوع تجريبي معدل", description: "وصف تجريبي", iconName: "clock" });
  ok(renamed.ok === true && renamed.record.name === "نوع تجريبي معدل", "تعديل اسم النوع");
}

section("حذف نوع مرتبط بطلبات قائمة ممنوع، والطلبات التاريخية سليمة");
{
  const t = typeByName("نوع تجريبي معدل");
  studentRequests.push({ id: "SR-TEST", category: t.name, documents: [] });
  const blocked = RequestTypes.remove(t.id);
  ok(blocked.ok === false && blocked.error === "لا يمكن حذف نوع الطلب لوجود طلبات مسجلة بهذا النوع.", "حذف نوع مرتبط بطلبات مرفوض");
  ok(RequestTypes.list().some(x => x.id === t.id), "النوع ما زال موجودًا بعد الرفض");
  studentRequests.pop();
  const freed = RequestTypes.remove(t.id);
  ok(freed.ok === true, "بعد إزالة الطلبات المرتبطة: الحذف مسموح");
  ok(!RequestTypes.list().some(x => x.id === t.id), "النوع حُذف فعليًا");
}

section("مستندات النوع: إضافة وتعديل وتحقق القيم");
{
  const t = typeByName("إفادة قيد");
  const before = t.requirements.length;
  const dup = RequestTypes.addDocument(t.id, { name: "صورة بطاقة الرقم القومي", hint: "توضيح", kind: "file" });
  ok(dup.ok === false && dup.errors.name === "يوجد مستند بنفس الاسم داخل هذا النوع.", "منع تكرار اسم المستند داخل النوع");
  const noHint = RequestTypes.addDocument(t.id, { name: "مستند جديد", hint: "", kind: "file" });
  ok(noHint.ok === false && noHint.errors.hint === "نص التوضيح مطلوب.", "نص التوضيح مطلوب");
  const badKind = RequestTypes.addDocument(t.id, { name: "مستند جديد", hint: "توضيح", kind: "image" });
  ok(badKind.ok === false && !!badKind.errors.kind, "نوع حقل غير معروف مرفوض");
  const noOptions = RequestTypes.addDocument(t.id, { name: "مستند جديد", hint: "توضيح", kind: "select" });
  ok(noOptions.ok === false && noOptions.errors.options === "أدخل خيارًا واحدًا على الأقل للقائمة.", "قائمة الاختيار تحتاج خيارات");
  const added = RequestTypes.addDocument(t.id, { name: "إيصال سداد إضافي", hint: "إيصال حديث", kind: "file", mandatory: true });
  ok(added.ok === true && t.requirements.length === before + 1, "إضافة مستند صحيح");
  const asSelect = RequestTypes.updateDocument(t.id, added.record.id, {
    name: "الوجهة المطلوبة للإفادة", hint: "اختر الوجهة", kind: "select",
    options: ["شؤون الطلاب", "الكلية", "المكتبة"], mandatory: false,
  });
  ok(asSelect.ok === true && asSelect.record.kind === "select" && asSelect.record.options.length === 3, "تعديل المستند إلى قائمة اختيار بخيارات");
  ok(asSelect.record.mandatory === false, "تحويل المستند إلى اختياري");
  const toggle = RequestTypes.updateDocument(t.id, added.record.id, {
    name: "الوجهة المطلوبة للإفادة", hint: "اختر الوجهة", kind: "select",
    options: ["شؤون الطلاب", "الكلية", "المكتبة"], mandatory: true,
  });
  ok(toggle.ok === true && toggle.record.mandatory === true, "إعادة المستند إلى إلزامي");
}

section("ترتيب المستندات: تحريك لأعلى/لأسفل ويُحفظ");
{
  const t = typeByName("إفادة قيد");
  const names = () => t.requirements.map(r => r.name);
  const firstId = t.requirements[0].id;
  ok(RequestTypes.moveDocument(t.id, firstId, -1).ok === false, "تحريك أول مستند لأعلى مرفوض");
  const secondId = t.requirements[1].id;
  const up = RequestTypes.moveDocument(t.id, secondId, -1);
  ok(up.ok === true && names()[0] === "إيصال سداد مصروفات الفصل الحالي", "تحريك المستند الثاني لأعلى يبدّل الترتيب");
  const down = RequestTypes.moveDocument(t.id, secondId, 1);
  ok(down.ok === true && names()[0] === "صورة بطاقة الرقم القومي", "إعادته لأسفل يعيد الترتيب الأصلي");
}

section("حذف مستند من النوع لا يمس الطلبات المقدمة ومرفقاتها");
{
  const docsBefore = JSON.stringify(requestDocumentsById);
  const requestsBefore = JSON.stringify(studentRequests.map(r => ({ id: r.id, docs: r.documents.map(d => d.id) })));
  const t = typeByName("كشف درجات رسمي");
  const optional = t.requirements.find(r => r.mandatory === false);
  const del = RequestTypes.removeDocument(t.id, optional.id);
  ok(del.ok === true, "حذف المستند الاختياري من كشف الدرجات");
  ok(JSON.stringify(requestDocumentsById) === docsBefore, "requestDocumentsById لم يتغير إطلاقًا");
  ok(JSON.stringify(studentRequests.map(r => ({ id: r.id, docs: r.documents.map(d => d.id) }))) === requestsBefore, "مستندات الطلبات المقدمة كما هي");
  const restore = RequestTypes.addDocument(t.id, { name: optional.name, hint: optional.hint, kind: optional.kind, mandatory: optional.mandatory });
  ok(restore.ok === true, "استعادة المستند ليبقى الشكل الثماني كما هو");
}

section("ال persistence: التعديلات محفوظة بعد إعادة تحميل الصفحة");
{
  const t = typeByName("إفادة قيد");
  const orderBefore = t.requirements.map(r => r.name).join("|");
  freshReload();
  await load();
  ok(RequestTypes.list().length === 8, "عدد الأنواع ثابت بعد إعادة التحميل");
  const after = typeByName("إفادة قيد");
  ok(after.requirements.map(r => r.name).join("|") === orderBefore, "ترتيب المستندات محفوظ بعد إعادة التحميل");
  const asSelect = after.requirements.find(r => r.name === "الوجهة المطلوبة للإفادة");
  ok(asSelect && asSelect.kind === "select" && asSelect.mandatory === true && asSelect.options.length === 3, "الإلزامية ونوع الحقل والخيارات محفوظة");
  const transcript = typeByName("كشف درجات رسمي");
  ok(transcript.requirements.length === 3, "كشف الدرجات ما زال 3 مستندات بعد الحذف والاستعادة");
}

section("المصدر المشترك: تعديل الأدمن يظهر في قراءة الطالب (M8)");
{
  const t = typeByName("إفادة قيد");
  const beforeCount = t.requirements.length;
  // الأدمن يضيف مستندًا إلى المصدر الموحّد (كتابة عبر خدمة RequestTypes)
  const added = RequestTypes.addDocument(t.id, {
    name: "مستند اختبار م8", hint: "توضيح اختبار", kind: "file", mandatory: false,
  });
  ok(added.ok === true, "الأدمن يضيف مستندًا إلى المصدر الموحّد");
  // قراءة "م8" جديدة (محاكاة إعادة تحميل شاشة الطالب) تقرأ نفس المصدر الموحّد
  const m8Types = RequestTypes.list();
  const m8Type = m8Types.find((x) => x.id === "enrollment") || null;
  ok(!!m8Type && m8Type.requirements.length === beforeCount + 1, "شاشة الطالب (M8) ترى المستند المضاف من المصدر الموحّد فورًا");
  const m8Doc = m8Type.requirements.find((r) => r.name === "مستند اختبار م8");
  ok(!!m8Doc && m8Doc.mandatory === false, "الرؤية تُظهر اسم المستند ووضع الإلزام (اختياري)");
  const m8Order = m8Type.requirements.map((r) => r.name);
  ok(m8Order[m8Order.length - 1] === "مستند اختبار م8", "المستند الجديد يظهر في آخر الترتيب");
  // تنظيف: إعادة الحالة كما كانت
  const cleaned = RequestTypes.removeDocument(t.id, m8Doc.id);
  ok(cleaned.ok === true, "تم حذف المستند التجريبي أثناء التنظيف");
  ok(RequestTypes.list().find((x) => x.id === "enrollment").requirements.length === beforeCount, "عاد عدد مستندات إفادة قيد للسابق");
}

section("تصدير ملف الإعدادات وصلاحية الصفحة");
{
  const exported = RequestTypes.exportConfig();
  ok(exported.version === 1 && Array.isArray(exported.requestTypes) && exported.requestTypes.length === 8, "exportConfig يعيد مخطط الملف الموحّد بثمانية أنواع");
  const t = exported.requestTypes.find(x => x.id === "enrollment");
  ok(t && t.name && t.description && t.iconName && Array.isArray(t.requirements), "حقول المخطط كاملة في التصدير (نفس ما يقرأه تطبيق الطالب)");
  const exam = exported.requestTypes.find(x => x.id === "exam-excuse").requirements.find(r => r.kind === "select");
  ok(exam && exam.options.length === 3, "خيارات القائمة منقولة في التصدير كما هي");
  ok(typeof Auth.pagePermission === "function" && Auth.pagePermission("request-types.html") === "settings.manage", "request-types.html → settings.manage");
}

console.log(`\nالنتيجة: ${passed} ناجح / ${failed} فاشل`);
process.exit(failed ? 1 : 0);

// اختبارات منطق الصلاحيات والإعدادات — تشغل مباشرة بـ Node بدون متصفح.
// التشغيل: node tests/core.test.mjs
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
    href: "http://localhost/admin/dashboard.html",
    pathname: "/admin/dashboard.html",
    replace(url) { this.href = url; },
  };
}

function loadSources() {
  installBrowserEnv();
  const authSrc = readFileSync(join(root, "js/core/auth.js"), "utf8");
  const setSrc = readFileSync(join(root, "js/core/settings.js"), "utf8");
  // eval مباشر داخل نفس النطاق ثم تصدير الكائنات إلى globalThis
  (0, eval)(authSrc + "\n;globalThis.Auth = Auth;");
  (0, eval)(setSrc + "\n;globalThis.Settings = Settings;");
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
  delete globalThis.Auth;
  delete globalThis.Settings;
  loadSources();
}

const PERM_KEYS = [
  "students.view", "students.edit", "grades.manage", "lectures.upload",
  "requests.manage", "chat.use", "users.manage", "settings.manage",
];

// ── التنفيذ ─────────────────────────────────────────────────────────────
section("القيم الافتراضية لمصفوفة الصلاحيات");
loadSources();
{
  const m = Auth.getPermissions();
  ok(PERM_KEYS.every(k => m.admin[k] === true), "الأدمن يملك كل الصلاحيات الثمانية افتراضيًا");
  ok(PERM_KEYS.every(k => m.student[k] === false), "الطالب لا يملك أي صلاحية افتراضيًا");
  ok(m.affairs["students.view"] === true && m.affairs["requests.manage"] === true, "شؤون: عرض/تعديل الطلاب وإدارة الطلبات مفعّلة");
  ok(m.affairs["users.manage"] === false && m.affairs["settings.manage"] === false, "شؤون: إدارة المستخدمين والإعدادات معطّلة");
  ok(m.doctor["lectures.upload"] === true && m.doctor["grades.manage"] === true, "دكتور: رفع المحاضرات وإدارة الدرجات مفعّلة");
  ok(m.doctor["requests.manage"] === false, "دكتور: إدارة الطلبات معطّلة");
  ok(Auth.canAs("admin", "anything.at.all") === true, "canAs: الأدمن يملك أي صلاحية حتى غير المعروفة");
  ok(Auth.canAs("affairs", "unknown.perm") === false, "canAs: صلاحية غير معروفة = مرفوضة لغير الأدمن");
  ok(Auth.pagePermission("students.html") === "students.view", "خريطة الصفحات: students.html → students.view");
  ok(Auth.pagePermission("lectures.html") === "lectures.upload", "خريطة الصفحات: lectures.html → lectures.upload");
}

section("حفظ الصلاحيات والتحقق من الصلاحيات (backend)");
{
  logout();
  const denied = Auth.savePermissions({ admin: Object.fromEntries(PERM_KEYS.map(k => [k, true])) });
  ok(denied.ok === false, "رفض الحفظ بدون تسجيل دخول");

  login("DR1001"); // دكتور بدون users.manage
  const deniedDoctor = Auth.savePermissions({ admin: Object.fromEntries(PERM_KEYS.map(k => [k, true])) });
  ok(deniedDoctor.ok === false, "رفض الحفظ لمستخدم بدون صلاحية إدارة المستخدمين");

  login("AD3001");
  const m = Auth.getPermissions();
  m.doctor["lectures.upload"] = false;
  m.affairs["students.edit"] = false;
  const saved = Auth.savePermissions(m);
  ok(saved.ok === true, "الأدمن يحفظ التعديلات بنجاح");
  ok(Auth.canAs("doctor", "lectures.upload") === false, "إلغاء صلاحية مفعّلة يُطبَّق فورًا");
  ok(Auth.canAs("doctor", "grades.manage") === true, "صلاحية غير معدّلة تبقى كما هي");

  freshReload(); // محاكاة تحديث الصفحة
  ok(Auth.canAs("doctor", "lectures.upload") === false, "التغييرات محفوظة بعد تحديث الصفحة");
  ok(Auth.canAs("affairs", "students.edit") === false, "تعديل شؤون محفوظ بعد التحديث");

  const tampered = Auth.getPermissions();
  tampered.admin["settings.manage"] = false; // محاولة إزالة صلاحية من الأدمن
  const locked = Auth.savePermissions(tampered);
  ok(locked.ok === false, "رفض أي مصفوفة تُنقّص صلاحيات الأدمن (حماية من القفل الكامل)");
  ok(Auth.canAs("admin", "settings.manage") === true, "صلاحيات الأدمن لا تتغير بعد محاولة التعديل");

  login("SA2001"); // موظف شؤون — لا يملك إدارة المستخدمين
  ok(Auth.savePermissions(Auth.getPermissions()).ok === false, "شؤون لا يستطيع حفظ الصلاحيات عبر الـ API مباشرة");
}

section("حماية ترقية الذات وحماية الصفحات");
{
  login("AD3001");
  const self = Auth.changeRole("AD3001", "student");
  ok(self.ok === false, "الأدمن لا يستطيع تغيير دور حسابه الحالي");

  // فحص دخول صفحة الطلاب لدور شؤون قبل/بعد إزالة الصلاحية
  login("SA2001");
  ok(Auth.can("students.view") === true, "شؤون يدخل صفحة الطلاب طالما الصلاحية مفعّلة");
  const redirectBefore = globalThis.location.href;
  const allowed = Auth.requireRole("affairs", "students.view");
  ok(allowed && allowed.code === "SA2001", "requireRole يسمح لشؤون بصفحة students.view");

  login("AD3001");
  const mm = Auth.getPermissions();
  mm.affairs["students.view"] = false;
  Auth.savePermissions(mm);

  login("SA2001");
  ok(Auth.can("students.view") === false, "بعد إزالة الصلاحية: شؤون لم يعد يملكها");
  globalThis.location.href = "http://localhost/affairs/students.html";
  const denied = Auth.requireRole("affairs", "students.view");
  ok(denied === null && globalThis.location.href.includes("affairs/dashboard.html"),
    "requireRole يعيد توجيه شؤون لصفحته عند فقدان الصلاحية");

  login("AD3001");
  ok(Auth.requireRole("doctor", "students.view") && Auth.requireRole("doctor", "settings.manage"),
    "الأدمن يدخل أي صفحة محمية بأي صلاحية");
  const reset = Auth.resetPermissions();
  ok(reset.ok === true && Auth.canAs("affairs", "students.view") === true, "استعادة الافتراضي تعيد الصلاحيات");
}

section("إعدادات النظام");
{
  login("AD3001");
  ok(Settings.get("appName") === "UNIWAY", "القيم الافتراضية محمّلة");
  ok(Settings.get("maxLectureMB") === 100, "حد الرفع الافتراضي 100MB");

  const upd = Settings.update({ maxLectureMB: 50 });
  ok(upd.ok === true && Settings.get("maxLectureMB") === 50, "تحديث إعداد واحد ينجح");
  ok(Settings.get("appName") === "UNIWAY", "التحديث لا يمس الإعدادات غير المذكورة");

  const bad = Settings.update({ maxLectureMB: 99999 });
  ok(bad.ok === false && bad.errors.maxLectureMB, "رفض قيمة تتجاوز الحد الأقصى مع رسالة خطأ");
  ok(Settings.get("maxLectureMB") === 50, "القيمة المرفوضة لا تُحفظ");

  const badYear = Settings.update({ academicYear: "٢٠٢٦" });
  ok(badYear.ok === false, "رفض صيغة عام دراسي غير صحيحة");

  const injected = Settings.update({ hackedKey: "x", __proto__: { polluted: true } });
  ok(injected.ok === true && Settings.get("hackedKey") === undefined, "المفاتيح غير المعروفة تُتجاهل");

  const exts = Settings.update({ lectureExts: "PDF, pdf, docx,, .pptx" });
  ok(exts.ok === true && JSON.stringify(Settings.get("lectureExts")) === JSON.stringify(["pdf", "docx", "pptx"]),
    "تطبيع قائمة الامتدادات وإزالة التكرار");

  freshReload();
  ok(Settings.get("maxLectureMB") === 50, "الإعدادات محفوظة بعد تحديث الصفحة");

  login("SA2001"); // بدون settings.manage
  ok(Settings.update({ appName: "HACK" }).ok === false, "شؤون لا يستطيع تعديل الإعدادات عبر الـ API");
  ok(Settings.reset().ok === false, "شؤون لا يستطيع استعادة الإعدادات");
  ok(Settings.get("appName") === "UNIWAY", "اسم التطبيق لم يتغير بعد المحاولة");

  login("AD3001");
  ok(Settings.reset().ok === true && Settings.get("maxLectureMB") === 100, "الأدمن يستعيد الافتراضي");
}

section("إدارة المستخدمين مربوطة بصلاحية إدارة المستخدمين");
{
  login("SA2001");
  ok(Auth.addUser({ code: "ST9999", name: "مخترق", email: "x@uni.edu.eg", role: "student" }).ok === false,
    "شؤون لا يستطيع إضافة مستخدمين");
  login("AD3001");
  const added = Auth.addUser({ code: "ST9999", name: "مستخدم تجريبي", email: "t9@uni.edu.eg", role: "student", department: "علوم الحاسب", year: "الأولى" });
  ok(added.ok === true, "الأدمن يضيف مستخدمًا بنجاح");
}

console.log(`\nالنتيجة: ${passed} ناجح / ${failed} فاشل`);
process.exit(failed ? 1 : 0);

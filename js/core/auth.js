// ===== تسجيل الدخول والصلاحيات =====
// تنبيه: هذه نسخة تجريبية تعتمد على localStorage للتخزين.
// في النسخة الفعلية يجب التحقق من بيانات الدخول على الخادم.

const Auth = (() => {
  const KEY      = "uniway_session";
  const USERS_KEY = "uniway_users";

  // الحسابات الافتراضية — تُحمَّل مرة واحدة عند أول تشغيل
  const SEED_ACCOUNTS = [
    { code: "DR1001", password: "123456", role: "doctor",  roleLabel: "دكتور",        name: "د. سارة القحطاني", short: "س",  department: "علوم الحاسب", year: null,    status: "active", home: "doctor/dashboard.html",  email: "dr1001@uni.edu.eg" },
    { code: "SA2001", password: "123456", role: "affairs", roleLabel: "شئون الطلاب",  name: "سارة العمري",    short: "سا", department: "شئون الطلاب",    year: null,    status: "active", home: "affairs/dashboard.html", email: "sa2001@uni.edu.eg" },
    { code: "AD3001", password: "123456", role: "admin",   roleLabel: "أدمن",          name: "مدير النظام",    short: "أ",  department: null,             year: null,    status: "active", home: "admin/dashboard.html",   email: "admin@uni.edu.eg" },
    { code: "DR1002", password: "123456", role: "doctor",  roleLabel: "دكتور",        name: "د. خالد المطيري", short: "خ",  department: "الرياضيات",       year: null,    status: "active", home: "doctor/dashboard.html",  email: "dr1002@uni.edu.eg" },
    { code: "ST4001", password: "123456", role: "student", roleLabel: "طالب",         name: "أحمد السالم",    short: "أح", department: "علوم الحاسب",    year: "الأولى",  status: "active", home: "student/dashboard.html", email: "st4001@uni.edu.eg" },
    { code: "ST4002", password: "123456", role: "student", roleLabel: "طالب",         name: "ريم الزهراني",   short: "ر",  department: "إحصاء حاسب",     year: "الثانية", status: "active", home: "student/dashboard.html", email: "st4002@uni.edu.eg" },
    { code: "ST4003", password: "123456", role: "student", roleLabel: "طالب",         name: "نور العمري",     short: "ن",  department: "فيزياء حاسب",    year: "الثالثة", status: "disabled", home: "student/dashboard.html", email: "st4003@uni.edu.eg" },
  ];

  const ROLE_META = {
    doctor:  { label: "دكتور",       home: "doctor/dashboard.html"  },
    affairs: { label: "شئون الطلاب", home: "affairs/dashboard.html" },
    admin:   { label: "أدمن",         home: "admin/dashboard.html"   },
    student: { label: "طالب",         home: "student/dashboard.html" },
  };

  // ===== مصفوفة الصلاحيات =====
  // أدوار تظهر كصفوف في مصفوفة الصلاحيات
  const PERMISSION_ROLES = [
    { key: "student", label: "طالب"  },
    { key: "affairs", label: "شؤون"  },
    { key: "doctor",  label: "دكتور" },
    { key: "admin",   label: "أدمن"  },
  ];

  // أعمدة المصفوفة — ثماني صلاحيات
  const PERMISSIONS = [
    { key: "students.view",   label: "عرض الطلاب",            desc: "الوصول لشاشات عرض بيانات الطلاب ومستنداتهم" },
    { key: "students.edit",   label: "تعديل الطلاب",           desc: "تعديل بيانات الطلاب الأكاديمية" },
    { key: "grades.manage",   label: "إدارة الدرجات",          desc: "رفع وتعديل الدرجات ومراجعة التظلمات" },
    { key: "lectures.upload", label: "رفع المحاضرات",          desc: "رفع محاضرات ومستندات المقررات" },
    { key: "requests.manage", label: "إدارة الطلبات والالتحاق", desc: "مراجعة طلبات الطلاب وطلبات الالتحاق والتربية العسكرية" },
    { key: "chat.use",        label: "الشات",                  desc: "فتح محادثات الطلاب والرد عليها" },
    { key: "users.manage",    label: "إدارة المستخدمين",       desc: "إضافة المستخدمين وتعديلهم وإدارة أدوارهم" },
    { key: "settings.manage", label: "إعدادات النظام",         desc: "تعديل إعدادات التطبيق العامة" },
  ];

  // الصلاحيات الافتراضية لكل دور — تطابق سلوك التطبيق الحالي (حسب الدور)
  const DEFAULT_PERMISSIONS = {
    student: {},
    affairs: {
      "students.view":   true,
      "students.edit":   true,
      "grades.manage":   true,
      "requests.manage": true,
      "chat.use":        true,
    },
    doctor: {
      "students.view":   true,
      "grades.manage":   true,
      "lectures.upload": true,
      "chat.use":        true,
    },
    admin: {
      "students.view":   true,
      "students.edit":   true,
      "grades.manage":   true,
      "lectures.upload": true,
      "requests.manage": true,
      "chat.use":        true,
      "users.manage":    true,
      "settings.manage": true,
    },
  };

  // ربط الصفحات الحالية بالصلاحية المطلوبة لفتحها — يُستخدم في حماية الصفحات وإخفاء عناصر القائمة
  const PAGE_PERMISSIONS = {
    "students.html":             "students.view",
    "student-detail.html":       "students.view",
    "documents.html":            "students.view",
    "requests.html":             "requests.manage",
    "request-detail.html":       "requests.manage",
    "admissions.html":           "requests.manage",
    "admission-detail.html":     "requests.manage",
    "military-education.html":   "requests.manage",
    "grade-appeals.html":        "grades.manage",
    "grade-appeal-detail.html":  "grades.manage",
    "grades.html":               "grades.manage",
    "course-detail.html":        "grades.manage",
    "conversations.html":        "chat.use",
    "chats.html":                "chat.use",
    "lectures.html":             "lectures.upload",
    // شاشات إدارة الكيانات (الأدمن)
    "courses.html":              "settings.manage",
    "departments.html":          "settings.manage",
    "academic-years.html":       "settings.manage",
    "announcements.html":        "settings.manage",
    "faqs.html":                 "settings.manage",
    "services.html":             "settings.manage",
    "request-types.html":        "settings.manage",
  };

  // استثناءات بحسب المجلد — admin/documents.html شاشة إدارة مختلفة عن affairs/documents.html
  const PAGE_PERMISSIONS_DIR = {
    "admin/documents.html": "settings.manage",
  };

  const PERM_KEY = "uniway_permissions";

  function ensurePermission(permKey) {
    const user = readSession(sessionStorage) || readSession(localStorage);
    if (!user) return null;
    if (user.role === "admin") return user;
    const matrix = loadPermissions();
    return matrix[user.role] && matrix[user.role][permKey] === true ? user : null;
  }

  function loadPermissions() {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(PERM_KEY) || "null"); } catch (_) {}
    // دمج مع الافتراضي: أي صلاحية جديدة تُضاف لاحقًا تأخذ قيمتها الافتراضية
    const matrix = {};
    PERMISSION_ROLES.forEach(r => {
      matrix[r.key] = {};
      PERMISSIONS.forEach(p => {
        const saved = stored && stored[r.key] ? stored[r.key][p.key] : undefined;
        matrix[r.key][p.key] = saved !== undefined ? !!saved : !!DEFAULT_PERMISSIONS[r.key][p.key];
      });
    });
    return matrix;
  }

  function savePermissionsMatrix(matrix) {
    try { localStorage.setItem(PERM_KEY, JSON.stringify(matrix)); } catch (_) {}
  }

  function denyAccess() {
    const user = readSession(sessionStorage) || readSession(localStorage);
    document.documentElement.style.visibility = "hidden";
    if (user && ROLE_META[user.role]?.home) location.replace("../" + ROLE_META[user.role].home);
    else location.replace("../index.html");
    return null;
  }

  // ── helpers ──────────────────────────────────────────────────────────
  function loadUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    // أول تشغيل: احفظ البيانات الأولية
    saveUsers(SEED_ACCOUNTS);
    return SEED_ACCOUNTS.slice();
  }

  function saveUsers(list) {
    try { localStorage.setItem(USERS_KEY, JSON.stringify(list)); } catch (_) {}
  }

  const readSession = (store) => {
    try {
      const code = JSON.parse(store.getItem(KEY) || "null")?.code;
      if (!code) return null;
      const user = loadUsers().find(u => u.code === code) || null;
      if (!user) {
        store.removeItem(KEY);
        return null;
      }
      if (user.status === "disabled") {
        store.removeItem(KEY);
        return null;
      }
      return user;
    } catch (_) { return null; }
  };

  // ── Public API ───────────────────────────────────────────────────────
  return {
    // الحسابات للعرض في صفحة الدخول (البذور فقط)
    get accounts() { return loadUsers(); },

    login(code, password, remember) {
      const users   = loadUsers();
      const account = users.find(
        u => u.code === String(code).trim().toUpperCase() && u.password === password
      );
      if (!account) return null;
      // حساب معطّل لا يُسمح له بالدخول
      if (account.status === "disabled") return { blocked: true, account };
      try {
        sessionStorage.removeItem(KEY);
        localStorage.removeItem(KEY);
        (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify({ code: account.code }));
      } catch (_) {}
      return account;
    },

    current() {
      try { return readSession(sessionStorage) || readSession(localStorage); } catch (_) { return null; }
    },

    logout() {
      try { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY); } catch (_) {}
      location.href = location.pathname.includes("/admin/") ||
                      location.pathname.includes("/doctor/") ||
                      location.pathname.includes("/affairs/")
        ? "../index.html" : "index.html";
    },

    requireRole(role, permission) {
      const user = this.current();
      if (!user) {
        document.documentElement.style.visibility = "hidden";
        location.replace("../index.html");
        return null;
      }
      // عند تحديد صلاحية للصفحة، الصلاحية هي المرجع: من يملكها يدخل ومن لا يملكها يُمنع
      if (permission) return this.can(permission) ? user : denyAccess();
      if (user.role === role) return user;
      return denyAccess();
    },

    // دخول الصفحات المتاحة لأي صلاحية من قائمة معينة (مثل البحث الشامل لموظفي الإدارة)
    requireAny(permissions) {
      const user = this.current();
      if (!user) {
        document.documentElement.style.visibility = "hidden";
        location.replace("../index.html");
        return null;
      }
      return permissions.some(p => this.can(p)) ? user : denyAccess();
    },

    // ── إدارة المستخدمين (admin only) ────────────────────────────────

    getUsers(roleFilter) {
      const users = loadUsers();
      return roleFilter ? users.filter(u => u.role === roleFilter) : users;
    },

    getUserByCode(code) {
      return loadUsers().find(u => u.code === code) || null;
    },

    /** إضافة مستخدم جديد — يعود بـ {ok, error} */
    addUser(data) {
      if (!ensurePermission("users.manage")) return { ok: false, error: "غير مصرح بتنفيذ هذا الإجراء." };
      const users = loadUsers();
      const codeUpper = String(data.code || "").trim().toUpperCase();
      const email = String(data.email || "").trim();
      const department = String(data.department || "").trim();
      const year = String(data.year || "").trim();

      if (!codeUpper)         return { ok: false, error: "الكود الجامعي مطلوب." };
      if (!data.name?.trim()) return { ok: false, error: "الاسم مطلوب." };
      if (!email)             return { ok: false, error: "البريد الإلكتروني مطلوب." };
      if (!data.role)         return { ok: false, error: "الدور مطلوب." };

      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRx.test(email)) return { ok: false, error: "صيغة البريد الإلكتروني غير صحيحة." };
      if (data.role !== "admin" && !department) return { ok: false, error: "القسم مطلوب." };
      if (data.role === "student" && !year) return { ok: false, error: "السنة الدراسية مطلوبة للطلاب." };

      if (users.find(u => u.code  === codeUpper)) return { ok: false, error: "الكود الجامعي مستخدم بالفعل." };
      if (users.find(u => String(u.email || "").trim().toLowerCase() === email.toLowerCase())) return { ok: false, error: "البريد الإلكتروني مستخدم بالفعل." };

      const meta = ROLE_META[data.role];
      if (!meta) return { ok: false, error: "الدور غير معروف." };

      // كلمة المرور الأولية: أول 6 أرقام من الكود أو '123456'
      const initPassword = codeUpper.replace(/\D/g, "").slice(0, 6) || "123456";

      const newUser = {
        code:       codeUpper,
        password:   initPassword,
        role:       data.role,
        roleLabel:  meta.label,
        name:       data.name.trim(),
        short:      data.name.trim()[0] || "؟",
        department: data.role === "admin" ? null : department,
        year:       data.role === "student" ? year : null,
        status:     data.status     || "active",
        home:       meta.home,
        email:      email,
      };

      users.push(newUser);
      saveUsers(users);
      const { password, ...safeUser } = newUser;
      return { ok: true, user: safeUser };
    },

    /** تعديل بيانات مستخدم */
    editUser(code, changes) {
      if (!ensurePermission("users.manage")) return { ok: false, error: "غير مصرح بتنفيذ هذا الإجراء." };
      const users = loadUsers();
      const idx   = users.findIndex(u => u.code === code);
      if (idx === -1) return { ok: false, error: "المستخدم غير موجود." };

      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const nextEmail = changes.email ? changes.email.trim() : "";
      if (changes.email && !emailRx.test(nextEmail))
        return { ok: false, error: "صيغة البريد الإلكتروني غير صحيحة." };

      // تحقق من تفرد البريد لو تغيّر
      if (changes.email && nextEmail.toLowerCase() !== String(users[idx].email || "").trim().toLowerCase()) {
        if (users.find((u, i) => i !== idx && String(u.email || "").trim().toLowerCase() === nextEmail.toLowerCase()))
          return { ok: false, error: "البريد الإلكتروني مستخدم بالفعل." };
      }

      const nextDepartment = changes.department !== undefined ? changes.department : users[idx].department;
      const nextYear = changes.year !== undefined ? changes.year : users[idx].year;
      if (users[idx].role !== "admin" && !String(nextDepartment || "").trim()) {
        return { ok: false, error: "القسم مطلوب." };
      }
      if (users[idx].role === "student" && !String(nextYear || "").trim()) {
        return { ok: false, error: "السنة الدراسية مطلوبة للطلاب." };
      }

      const allowed = ["name", "email", "department", "year", "status"];
      allowed.forEach(k => {
        if (changes[k] !== undefined) users[idx][k] = changes[k];
      });
      if (changes.name) users[idx].short = changes.name.trim()[0] || "؟";
      saveUsers(users);
      return { ok: true, user: users[idx] };
    },

    /** تعطيل الحساب */
    disableUser(code) {
      if (!ensurePermission("users.manage")) return { ok: false, error: "غير مصرح بتنفيذ هذا الإجراء." };
      const users = loadUsers();
      const u = users.find(u => u.code === code);
      if (!u) return { ok: false, error: "المستخدم غير موجود." };
      if (u.role === "admin") return { ok: false, error: "لا يمكن تعطيل حساب أدمن." };
      u.status = "disabled";
      saveUsers(users);
      // أنهِ جلسته لو كانت نشطة
      try {
        const sk = JSON.parse(sessionStorage.getItem(KEY) || "null");
        const lk = JSON.parse(localStorage.getItem(KEY) || "null");
        if (sk?.code === code) sessionStorage.removeItem(KEY);
        if (lk?.code === code) localStorage.removeItem(KEY);
      } catch (_) {}
      return { ok: true };
    },

    /** إعادة تعيين الحساب: تفعيله وإعادة كلمة المرور للقيمة الأولية */
    resetUser(code) {
      if (!ensurePermission("users.manage")) return { ok: false, error: "غير مصرح بتنفيذ هذا الإجراء." };
      const users = loadUsers();
      const u = users.find(u => u.code === code);
      if (!u) return { ok: false, error: "المستخدم غير موجود." };
      const initPassword = code.replace(/\D/g, "").slice(0, 6) || "123456";
      u.password = initPassword;
      u.status   = "active";
      saveUsers(users);
      return { ok: true };
    },

    /** تغيير الدور */
    changeRole(code, newRole) {
      if (!ensurePermission("users.manage")) return { ok: false, error: "غير مصرح بتنفيذ هذا الإجراء." };
      const meta = ROLE_META[newRole];
      if (!meta) return { ok: false, error: "الدور غير معروف." };
      const users = loadUsers();
      const u = users.find(u => u.code === code);
      if (!u) return { ok: false, error: "المستخدم غير موجود." };
      // لا يجوز للمستخدم تغيير دوره بنفسه — منع ترقية الذات لأدمن
      const me = this.current();
      if (me && me.code === code && newRole !== u.role)
        return { ok: false, error: "لا يمكنك تغيير دور حسابك الحالي." };
      if (u.role === "admin" && newRole !== "admin") {
        const admins = users.filter(x => x.role === "admin");
        if (admins.length === 1) return { ok: false, error: "يجب الإبقاء على أدمن واحد على الأقل." };
      }
      u.role      = newRole;
      u.roleLabel = meta.label;
      u.home      = meta.home;
      saveUsers(users);
      return { ok: true };
    },

    getRoleMeta() { return ROLE_META; },

    // ── مصفوفة الصلاحيات ─────────────────────────────────────────────
    getPermissionCatalog() { return PERMISSIONS.slice(); },
    getPermissionRoles()   { return PERMISSION_ROLES.slice(); },
    getPermissions()       { return loadPermissions(); },

    // هل يملك المستخدم الحالي الصلاحية؟ يُقرأ مباشرة من التخزين في كل مرة
    can(permKey) {
      const user = this.current();
      if (!user) return false;
      return this.canAs(user.role, permKey);
    },

    // هل يملك الدور الصلاحية؟ أدمن يملك كل الصلاحيات دائمًا (دور محمي)
    canAs(role, permKey) {
      if (role === "admin") return true;
      if (!PERMISSIONS.some(p => p.key === permKey)) return false;
      const matrix = loadPermissions();
      return !!(matrix[role] && matrix[role][permKey] === true);
    },

    /**
     * حفظ مصفوفة الصلاحيات كاملة — للأدمن (أو من يملك إدارة المستخدمين) فقط.
     * يتحقق من الشكل، ويمنع تعديل صف الأدمن، ويمنع أي حالة تُقفل النظام.
     */
    savePermissions(matrix) {
      if (!ensurePermission("users.manage")) return { ok: false, error: "غير مصرح بتنفيذ هذا الإجراء." };
      if (!matrix || typeof matrix !== "object") return { ok: false, error: "بيانات المصفوفة غير صالحة." };

      // صف الأدمن ثابت: كل الصلاحيات مفعّلة دائمًا — لا يمكن تقليصه أو قفل النظام
      const adminAll = PERMISSIONS.every(p => matrix.admin && matrix.admin[p.key] === true);
      if (!adminAll) return { ok: false, error: "لا يمكن تعديل صلاحيات دور الأدمن — يجب أن يحتفظ بكل الصلاحيات." };

      const clean = {};
      PERMISSION_ROLES.forEach(r => {
        clean[r.key] = {};
        PERMISSIONS.forEach(p => {
          clean[r.key][p.key] = r.key === "admin" ? true : !!(matrix[r.key] && matrix[r.key][p.key]);
        });
      });

      savePermissionsMatrix(clean);
      return { ok: true };
    },

    /** استعادة الصلاحيات الافتراضية */
    resetPermissions() {
      if (!ensurePermission("users.manage")) return { ok: false, error: "غير مصرح بتنفيذ هذا الإجراء." };
      const fresh = {};
      PERMISSION_ROLES.forEach(r => {
        fresh[r.key] = {};
        PERMISSIONS.forEach(p => { fresh[r.key][p.key] = !!DEFAULT_PERMISSIONS[r.key][p.key]; });
      });
      savePermissionsMatrix(fresh);
      return { ok: true };
    },

    /** خريطة الصفحات بالصلاحيات المطلوبة — تُستخدم لإخفاء روابط غير المتاحة */
    pagePermission(file, role) {
      if (role && PAGE_PERMISSIONS_DIR[role + "/" + file]) return PAGE_PERMISSIONS_DIR[role + "/" + file];
      if (role === "doctor" && file === "courses.html") return null;
      return PAGE_PERMISSIONS[file] || null;
    },
  };
})();

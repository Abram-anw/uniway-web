// ===== إعدادات النظام =====
// تُخزن في localStorage وتُحمَّل عند فتح الصفحات. التعديل يتطلب صلاحية settings.manage.
const Settings = (() => {
  const KEY = "uniway_settings";

  const GROUPS = [
    {
      key: "general",
      label: "إعدادات عامة",
      icon: "mega",
      fields: [
        { key: "appName",    label: "اسم التطبيق",     type: "text", required: true, max: 40, help: "يظهر في الشريط الجانبي وصفحة الدخول" },
        { key: "appTagline", label: "الشعار التعريفي", type: "text", required: true, max: 80, help: "السطر الوصفي أسفل اسم التطبيق" },
      ],
    },
    {
      key: "academic",
      label: "العام الدراسي",
      icon: "book",
      fields: [
        { key: "academicYear",     label: "العام الدراسي الحالي",     type: "text",   required: true, pattern: /^\d{4}\/\d{4}$/, patternMsg: "الصيغة المطلوبة: 2026/2027", help: "مثال: 2026/2027" },
        { key: "currentTerm",      label: "الفصل الدراسي الحالي",     type: "select", required: true, options: ["الأول", "الثاني", "الصيفي"] },
        { key: "registrationOpen", label: "فتح التسجيل",              type: "boolean", help: "السماح بتسجيل المقررات في الفصل الحالي" },
      ],
    },
    {
      key: "uploads",
      label: "رفع المحاضرات والملفات",
      icon: "upload",
      fields: [
        { key: "maxLectureMB", label: "أقصى حجم لملف المحاضرة (MB)",       type: "number", required: true, min: 1, max: 500, help: "يُطبَّق على شاشة رفع المحاضرات" },
        { key: "lectureExts",  label: "الامتدادات المسموحة للمحاضرات",   type: "extlist", required: true, help: "افصل بين الامتدادات بفاصلة، مثال: pdf, pptx" },
      ],
    },
    {
      key: "notifications",
      label: "الإشعارات",
      icon: "bell",
      fields: [
        { key: "notificationsEnabled",  label: "تفعيل الإشعارات",                 type: "boolean", help: "القيمة الافتراضية لتفعيل الإشعارات للمستخدمين" },
        { key: "notifyNewRequest",      label: "إشعار عند وصول طلب جديد",          type: "boolean" },
        { key: "notifyGradesPublished", label: "إشعار الطلاب عند اعتماد الدرجات", type: "boolean" },
      ],
    },
  ];

  const FLAT = {};
  GROUPS.forEach(g => g.fields.forEach(f => { FLAT[f.key] = f; }));

  const DEFAULTS = {
    appName: "UNIWAY",
    appTagline: "جامعتك... في طريق واحد",
    academicYear: "2026/2027",
    currentTerm: "الأول",
    registrationOpen: true,
    maxLectureMB: 100,
    lectureExts: ["pdf", "ppt", "pptx", "docx", "mp4"],
    notificationsEnabled: true,
    notifyNewRequest: true,
    notifyGradesPublished: true,
  };

  function load() {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (_) {}
    const out = {};
    Object.keys(DEFAULTS).forEach(k => {
      const saved = stored ? stored[k] : undefined;
      out[k] = saved !== undefined ? saved : DEFAULTS[k];
    });
    return out;
  }

  function persist(values) {
    try { localStorage.setItem(KEY, JSON.stringify(values)); } catch (_) {}
  }

  // تحقق من قيمة واحدة وفق مخطط الحقل — يعيد {ok} أو {ok:false, error}
  function validateField(field, value) {
    const label = field.label;
    if (field.type === "boolean") return { ok: typeof value === "boolean" };

    if (value === undefined || value === null || String(value).trim() === "") {
      return field.required ? { ok: false, error: `${label} مطلوب.` } : { ok: true, value: "" };
    }

    if (field.type === "text") {
      const v = String(value).trim();
      if (field.max && v.length > field.max) return { ok: false, error: `${label}: الحد الأقصى ${field.max} حرفًا.` };
      if (field.pattern && !field.pattern.test(v)) return { ok: false, error: field.patternMsg || `صيغة ${label} غير صحيحة.` };
      return { ok: true, value: v };
    }

    if (field.type === "number") {
      const n = Number(value);
      if (isNaN(n)) return { ok: false, error: `${label}: أدخل رقمًا صحيحًا.` };
      if (field.min !== undefined && n < field.min) return { ok: false, error: `${label}: القيمة الدنيا ${field.min}.` };
      if (field.max !== undefined && n > field.max) return { ok: false, error: `${label}: القيمة القصوى ${field.max}.` };
      return { ok: true, value: n };
    }

    if (field.type === "select") {
      return field.options.includes(value) ? { ok: true, value } : { ok: false, error: `${label}: الخيار غير معروف.` };
    }

    if (field.type === "extlist") {
      const list = (Array.isArray(value) ? value : String(value).split(","))
        .map(x => String(x).trim().toLowerCase().replace(/^\./, ""))
        .filter(Boolean);
      if (!list.length) return { ok: false, error: `${label}: أضف امتدادًا واحدًا على الأقل.` };
      if (list.some(x => !/^[a-z0-9]{1,8}$/.test(x))) return { ok: false, error: `${label}: يوجد امتداد غير صالح.` };
      return { ok: true, value: [...new Set(list)] };
    }

    return { ok: true, value };
  }

  return {
    groups: () => GROUPS.map(g => ({ ...g, fields: g.fields.slice() })),
    defaults: () => ({ ...DEFAULTS }),

    /** كل القيم الحالية مقسمة حسب المجموعات */
    all() {
      const values = load();
      return GROUPS.map(g => ({
        ...g,
        fields: g.fields.map(f => ({ ...f, value: values[f.key] })),
      }));
    },

    get(key) { return load()[key]; },

    /**
     * تحديث إعدادات محددة فقط (دمج — لا يمس غيرها).
     * يعيد {ok:true, values} أو {ok:false, errors:{key:msg}}
     */
    update(patch) {
      if (typeof Auth === "undefined" || !Auth.can("settings.manage"))
        return { ok: false, errors: { _: "غير مصرح بتنفيذ هذا الإجراء." } };

      const errors = {};
      const clean = {};
      Object.keys(patch || {}).forEach(k => {
        const field = FLAT[k];
        if (!field) return; // تجاهل المفاتيح غير المعروفة — لا نسمح بكتابة عشوائية
        const r = validateField(field, patch[k]);
        if (!r.ok) errors[k] = r.error;
        else clean[k] = r.value;
      });

      if (Object.keys(errors).length) return { ok: false, errors };

      const next = { ...load(), ...clean };
      persist(next);
      return { ok: true, values: next };
    },

    reset() {
      if (typeof Auth === "undefined" || !Auth.can("settings.manage"))
        return { ok: false, error: "غير مصرح بتنفيذ هذا الإجراء." };
      persist({ ...DEFAULTS });
      return { ok: true };
    },
  };
})();

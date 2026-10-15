// ===== RequestTypes: طبقة الخدمات لإدارة أنواع الطلبات ومستنداتها المطلوبة =====
// المصدر الموحّد: data/request-types.json — نفس الملف الذي يستهلكه تطبيق الطالب
// (شاشة متطلبات الطلب M8 عبر assets/config/request-types.json).
// الأدمن يقرأ ويكتب عبر هذه الطبقة: بذرة أولى من ملف الإعدادات، ثم حفظ دائم
// في localStorage (نمط التخزين القائم في المشروع) مع بوابة صلاحية وتحقق على
// مستوى الخدمة، فلا توجد نسخة واجهة منفصلة عن الإعدادات.
const RequestTypes = (() => {
  const PERM = "settings.manage";
  const KEY = "uniway_request_types";
  const KINDS = ["file", "text", "select"];

  const deny = () => ({ ok: false, error: "غير مصرح بتنفيذ هذا الإجراء." });
  const guard = () => (typeof Auth !== "undefined" && typeof Auth.can === "function" && Auth.can(PERM) ? null : deny());
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const trim = (v) => String(v == null ? "" : v).trim();

  let state = null;

  const readPersisted = () => {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && Array.isArray(parsed.items) ? parsed : null;
    } catch (_) { return null; }
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };

  // تطبيق بذرة ملف الإعدادات (تُستخدم مرة واحدة ما لم توجد حالة محفوظة للأدمن)
  const applySeed = (seed) => {
    const persisted = readPersisted();
    if (persisted) { state = persisted; return; }
    const items = Array.isArray(seed && seed.requestTypes) ? clone(seed.requestTypes) : [];
    state = { seq: items.length, items };
    normalizeIds();
    save();
  };
  const normalizeIds = () => {
    state.items.forEach((t) => {
      if (!t.id) t.id = `RT-${++state.seq}`;
      (t.requirements || []).forEach((r) => { if (!r.id) r.id = `REQ-${++state.seq}`; });
    });
  };

  // التحميل: في المتصفح يجلب ملف الإعدادات؛ الاختبارات تمرر مصدرًا بديلًا.
  let readyPromise = null;
  const ready = (loader) => {
    if (!readyPromise) {
      const fetchSeed = loader || (() => fetch("../data/request-types.json").then((r) => r.json()));
      readyPromise = Promise.resolve().then(fetchSeed).then((seed) => { applySeed(seed); return state; });
    }
    return readyPromise;
  };

  const ensure = () => state;

  const findType = (id) => ensure().items.find((t) => t.id === id) || null;
  const findReq = (type, reqId) => (type.requirements || []).find((r) => r.id === reqId) || null;

  // طلبات قائمة تعتمد على نوع الطلب (بالاسم) — تمنع حذفه وتُبقي الطلبات التاريخية سليمة
  const requestsDependOn = (typeName) =>
    typeof studentRequests !== "undefined" && studentRequests.some((r) => r.category === typeName);

  const normalizeType = (data) => ({
    name: trim(data.name),
    description: trim(data.description),
    iconName: trim(data.iconName) || "file",
  });

  const validateType = (v, { items, record }) => {
    const errs = {};
    if (!v.name) errs.name = "اسم نوع الطلب مطلوب.";
    else if (items.some((t) => t.name === v.name && (!record || record.id !== t.id))) errs.name = "يوجد نوع طلب بنفس الاسم بالفعل.";
    if (!v.description) errs.description = "وصف نوع الطلب مطلوب.";
    return Object.keys(errs).length ? errs : null;
  };

  const normalizeReq = (data) => ({
    name: trim(data.name),
    mandatory: data.mandatory === true,
    hint: trim(data.hint),
    kind: trim(data.kind),
    options: Array.isArray(data.options) && data.options.length ? data.options.map((o) => trim(o)).filter(Boolean) : null,
  });

  const validateReq = (v, { type, record }) => {
    const errs = {};
    if (!v.name) errs.name = "اسم المستند مطلوب.";
    else if ((type.requirements || []).some((r) => r.name === v.name && (!record || record.id !== r.id))) errs.name = "يوجد مستند بنفس الاسم داخل هذا النوع.";
    if (!KINDS.includes(v.kind)) errs.kind = "نوع الحقل غير معروف.";
    else if (v.kind === "select" && (!v.options || !v.options.length)) errs.options = "أدخل خيارًا واحدًا على الأقل للقائمة.";
    if (!v.hint) errs.hint = "نص التوضيح مطلوب.";
    return Object.keys(errs).length ? errs : null;
  };

  return {
    ready,
    list: () => ensure() ? ensure().items.slice() : [],
    get: (id) => { const s = ensure(); return s ? findType(id) : null; },
    exportConfig: () => ({ version: 1, requestTypes: clone(ensure() ? ensure().items : []) }),

    create(data) {
      const g = guard(); if (g) return g;
      const s = ensure(); if (!s) return { ok: false, error: "لم يتم تحميل الإعدادات بعد." };
      const v = normalizeType(data);
      const errs = validateType(v, { items: s.items });
      if (errs) return { ok: false, errors: errs };
      const record = { id: `RT-${++s.seq}`, ...v, requirements: [] };
      s.items.push(record); save();
      return { ok: true, record };
    },

    update(id, data) {
      const g = guard(); if (g) return g;
      const record = findType(id);
      if (!record) return { ok: false, error: "نوع الطلب غير موجود." };
      const v = normalizeType(data);
      const errs = validateType(v, { items: ensure().items, record });
      if (errs) return { ok: false, errors: errs };
      Object.assign(record, v); save();
      return { ok: true, record };
    },

    remove(id) {
      const g = guard(); if (g) return g;
      const s = ensure(); if (!s) return { ok: false, error: "لم يتم تحميل الإعدادات بعد." };
      const idx = s.items.findIndex((t) => t.id === id);
      if (idx === -1) return { ok: false, error: "نوع الطلب غير موجود." };
      if (requestsDependOn(s.items[idx].name)) return { ok: false, error: "لا يمكن حذف نوع الطلب لوجود طلبات مسجلة بهذا النوع." };
      s.items.splice(idx, 1); save();
      return { ok: true };
    },

    addDocument(typeId, data) {
      const g = guard(); if (g) return g;
      const type = findType(typeId);
      if (!type) return { ok: false, error: "نوع الطلب غير موجود." };
      if (!type.requirements) type.requirements = [];
      const v = normalizeReq(data);
      const errs = validateReq(v, { type });
      if (errs) return { ok: false, errors: errs };
      const record = { id: `REQ-${++ensure().seq}`, ...v };
      type.requirements.push(record); save();
      return { ok: true, record };
    },

    updateDocument(typeId, reqId, data) {
      const g = guard(); if (g) return g;
      const type = findType(typeId);
      if (!type) return { ok: false, error: "نوع الطلب غير موجود." };
      const record = findReq(type, reqId);
      if (!record) return { ok: false, error: "المستند غير موجود." };
      const v = normalizeReq(data);
      const errs = validateReq(v, { type, record });
      if (errs) return { ok: false, errors: errs };
      Object.assign(record, v); save();
      return { ok: true, record };
    },

    removeDocument(typeId, reqId) {
      const g = guard(); if (g) return g;
      const type = findType(typeId);
      if (!type) return { ok: false, error: "نوع الطلب غير موجود." };
      const idx = (type.requirements || []).findIndex((r) => r.id === reqId);
      if (idx === -1) return { ok: false, error: "المستند غير موجود." };
      type.requirements.splice(idx, 1); save();
      return { ok: true };
    },

    // dir: -1 يرفع المستند درجة، +1 ينزّله — الترتيب هو ترتيب العرض في M8
    moveDocument(typeId, reqId, dir) {
      const g = guard(); if (g) return g;
      const type = findType(typeId);
      if (!type) return { ok: false, error: "نوع الطلب غير موجود." };
      const reqs = type.requirements || [];
      const idx = reqs.findIndex((r) => r.id === reqId);
      if (idx === -1) return { ok: false, error: "المستند غير موجود." };
      const next = idx + (dir === -1 ? -1 : 1);
      if (next < 0 || next >= reqs.length) return { ok: false, error: "المستند في بداية القائمة بالفعل." };
      [reqs[idx], reqs[next]] = [reqs[next], reqs[idx]];
      save();
      return { ok: true };
    },
  };
})();

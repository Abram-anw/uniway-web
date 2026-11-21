// ===== Catalog: طبقة الخدمات (الـ backend) لشاشات إدارة الكيانات =====
// مخزن موحّد لكل كيان: list/get/create/update/remove مع:
//  - بوابة صلاحية على مستوى الخدمة حتى لو اتخطت الواجهة
//  - تحقق من صحة البيانات وقيود التفرد والتكامل المرجعي
//  - حفظ دائم في localStorage، وتطبيق الحالة المحفوظة على المتغيرات العامة
//    عند التحميل حتى تظهر التعديلات في كل الشاشات الموجودة بعد التحديث.
// الأسماء المحلية باللاحقة Store حتى لا تتعارض مع متغيرات data.js العامة.
const Catalog = (() => {
  const PERM = "settings.manage";
  const PREFIX = "uniway_cat_";

  const deny = () => ({ ok: false, error: "غير مصرح بتنفيذ هذا الإجراء." });
  const guard = () => (typeof Auth !== "undefined" && typeof Auth.can === "function" && Auth.can(PERM) ? null : deny());

  const read = (key) => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (_) { return null; }
  };
  const write = (key, state) => { try { localStorage.setItem(PREFIX + key, JSON.stringify(state)); } catch (_) {} };
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const randId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
  const trim = (v) => String(v == null ? "" : v).trim();
  const SECTION_LABELS = () => (typeof affairsSections !== "undefined" ? affairsSections.map((s) => s.label) : []);

  // مخزن يملك بياناته بالكامل (قسم/فرقة/سؤال/خدمة): حفظ كامل للسجلّات.
  // البذرة تُحسب عند أول استخدام حتى لا يتوقف التحميل على ترتيب الملفات.
  function selfStore(key, prefix, makeSeed, validate, canRemove) {
    let state = null;
    const ensure = () => {
      if (!state) {
        state = read(key);
        if (!state || !Array.isArray(state.items)) {
          const seed = makeSeed();
          // assign IDs to seed items so get/update/remove work on first load
          const items = seed.map((item, i) => item.id ? clone(item) : { id: `${prefix}-${i + 1}`, ...clone(item) });
          state = { seq: items.length, items };
        }
        if (typeof state.seq !== "number") state.seq = state.items.length;
      }
      return state;
    };
    const save = () => write(key, ensure());
    const find = (id) => ensure().items.find((x) => x.id === id) || null;

    return {
      list: () => ensure().items.slice(),
      get: (id) => find(id),
      create(data) {
        const g = guard(); if (g) return g;
        const items = ensure().items;
        const errs = validate(data, { isEdit: false, items });
        if (errs) return { ok: false, errors: errs };
        const record = { id: `${prefix}-${++state.seq}`, ...clone(data) };
        items.push(record); save();
        return { ok: true, record };
      },
      update(id, data) {
        const g = guard(); if (g) return g;
        const record = find(id);
        if (!record) return { ok: false, error: "السجل غير موجود." };
        const errs = validate(data, { isEdit: true, items: ensure().items, record });
        if (errs) return { ok: false, errors: errs };
        Object.assign(record, clone(data)); save();
        return { ok: true, record };
      },
      remove(id) {
        const g = guard(); if (g) return g;
        const items = ensure().items;
        const idx = items.findIndex((x) => x.id === id);
        if (idx === -1) return { ok: false, error: "السجل غير موجود." };
        const block = canRemove ? canRemove(items[idx]) : null;
        if (block) return { ok: false, error: block };
        items.splice(idx, 1); save();
        return { ok: true };
      },
    };
  }

  // ── الأقسام (التمثيل الحالي: قائمة DEPARTMENTS في شاشة المستخدمين) ──
  const deptReferencedBy = (name) => {
    if (typeof Auth === "undefined" || typeof Auth.getUsers !== "function") return null;
    if (Auth.getUsers().some((u) => u.department === name)) return "لا يمكن تنفيذ الإجراء: يوجد مستخدمون منتمون إلى هذا القسم.";
    if (typeof students !== "undefined" && students.some((s) => s.program === name)) return "لا يمكن تنفيذ الإجراء: يوجد طلاب مسجلون في هذا القسم.";
    return null;
  };
  const departmentsStore = selfStore(
    "departments", "DEP",
    () => (typeof DEPARTMENTS !== "undefined" ? DEPARTMENTS : []).map((name, i) => ({ id: `DEP-${i + 1}`, name })),
    (data, { items, record }) => {
      const name = trim(data.name);
      if (!name) return { name: "اسم القسم مطلوب." };
      if (items.some((d) => d.name === name && (!record || record.id !== d.id))) return { name: "يوجد قسم بنفس الاسم بالفعل." };
      if (record && record.name !== name) {
        const block = deptReferencedBy(record.name);
        if (block) return { name: block };
      }
      return null;
    },
    (rec) => deptReferencedBy(rec.name),
  );

  // ── السنوات الدراسية (التمثيل الحالي: قائمة YEARS وعمود year في المقررات) ──
  const yearReferencedBy = (label) => {
    if (typeof courseCatalog !== "undefined" && courseCatalog.some((c) => c.year === label)) return "لا يمكن تنفيذ الإجراء: يوجد مقررات مسجلة على هذه الفرقة.";
    if (typeof students !== "undefined" && students.some((s) => s.year === label)) return "لا يمكن تنفيذ الإجراء: يوجد طلاب في هذه الفرقة.";
    return null;
  };
  const yearsStore = selfStore(
    "years", "YR",
    () => (typeof YEARS !== "undefined" ? YEARS : []).map((label, i) => ({ id: `YR-${i + 1}`, label })),
    (data, { items, record }) => {
      const label = trim(data.label);
      if (!label) return { label: "اسم الفرقة مطلوب." };
      if (items.some((y) => y.label === label && (!record || record.id !== y.id))) return { label: "يوجد فرقة بنفس الاسم بالفعل." };
      if (record && record.label !== label) {
        const block = yearReferencedBy(record.label);
        if (block) return { label: block };
      }
      return null;
    },
    (rec) => yearReferencedBy(rec.label),
  );

  // ── المقررات: كتالوج courseCatalog العام + مزامنة المقررات المسندة (courses) ──
  const coursesStore = (() => {
    const syncAssigned = () => {
      if (typeof courses === "undefined") return;
      for (let i = courses.length - 1; i >= 0; i--) {
        const cat = courseCatalog.find((c) => c.code === courses[i].code);
        if (!cat) { courses.splice(i, 1); continue; }
        ["name", "hours", "year", "graded", "students", "doctorName"].forEach((k) => { courses[i][k] = cat[k]; });
      }
    };
    const snap = read("courses");
    if (snap && Array.isArray(snap.items) && typeof courseCatalog !== "undefined") {
      courseCatalog.splice(0, courseCatalog.length, ...snap.items);
      syncAssigned();
    }
    const normalize = (data) => ({
      code: trim(data.code).toUpperCase(),
      name: trim(data.name),
      doctorName: trim(data.doctorName),
      year: trim(data.year),
      hours: Number(data.hours),
      students: data.students === "" || data.students == null ? 0 : Number(data.students),
      graded: data.graded === true,
    });
    const validate = (v, { items, record }) => {
      const errs = {};
      if (!/^[A-Z]{2,6}\d{3}$/.test(v.code)) errs.code = "كود المقرر لازم يكون حروفًا كبيرة يتبعها 3 أرقام (مثال: COMP301).";
      else if (items.some((c) => c.code === v.code && (!record || record.code !== c.code))) errs.code = "يوجد مقرر بنفس الكود بالفعل.";
      if (!v.name) errs.name = "اسم المقرر مطلوب.";
      const yearLabels = yearsStore.list().map((y) => y.label);
      if (!v.year) errs.year = "الفرقة الدراسية مطلوبة.";
      else if (!yearLabels.includes(v.year)) errs.year = "الفرقة الدراسية غير معروفة.";
      if (!Number.isInteger(v.hours) || v.hours < 1 || v.hours > 6) errs.hours = "عدد الساعات لازم يكون رقمًا صحيحًا من 1 إلى 6.";
      if (!Number.isInteger(v.students) || v.students < 0) errs.students = "عدد الطلاب لازم يكون رقمًا صحيحًا غير سالب.";
      return Object.keys(errs).length ? errs : null;
    };
    const save = () => { write("courses", { items: clone(courseCatalog) }); syncAssigned(); };
    return {
      list: () => courseCatalog.slice(),
      get: (code) => courseCatalog.find((c) => c.code === code) || null,
      create(data) {
        const g = guard(); if (g) return g;
        const v = normalize(data);
        const errs = validate(v, { items: courseCatalog });
        if (errs) return { ok: false, errors: errs };
        courseCatalog.push(v); save();
        return { ok: true, record: v };
      },
      update(code, data) {
        const g = guard(); if (g) return g;
        const record = courseCatalog.find((c) => c.code === code);
        if (!record) return { ok: false, error: "المقرر غير موجود." };
        const v = normalize({ ...data, code: record.code });
        const errs = validate(v, { items: courseCatalog, record });
        if (errs) return { ok: false, errors: errs };
        Object.assign(record, v); save();
        return { ok: true, record };
      },
      remove(code) {
        const g = guard(); if (g) return g;
        const idx = courseCatalog.findIndex((c) => c.code === code);
        if (idx === -1) return { ok: false, error: "المقرر غير موجود." };
        if (typeof courses !== "undefined" && courses.some((c) => c.code === code)) return { ok: false, error: "لا يمكن حذف المقرر وهو مسند إلى عضو هيئة تدريس. ألغِ الإسناد أولًا." };
        if (typeof lectures !== "undefined" && lectures.some((l) => l.course === code)) return { ok: false, error: "لا يمكن حذف المقرر لوجود محاضرات مرتبطة به." };
        courseCatalog.splice(idx, 1); save();
        return { ok: true };
      },
    };
  })();

  // ── الإعلانات الجامعية: القائمة العامة announcements (سجلاتها بدون معرفات) ──
  const announcementsStore = (() => {
    const genId = () => randId("ANN");
    const announcementGuard = () => {
      const me = typeof Auth !== "undefined" && typeof Auth.current === "function" ? Auth.current() : null;
      return me && ["admin", "affairs", "doctor"].includes(me.role) ? null : deny();
    };
    const normalize = () => {
      if (typeof announcements === "undefined") return;
      announcements.forEach((a) => { if (!a.id) a.id = genId(); });
    };
    const snap = read("announcements");
    if (snap && Array.isArray(snap.items) && typeof announcements !== "undefined") {
      announcements.splice(0, announcements.length, ...snap.items);
    }
    normalize();
    const validCourse = (code) => !code || (typeof courseCatalog !== "undefined" && courseCatalog.some((c) => c.code === code));
    const validate = (data) => {
      const v = { title: trim(data.title), body: trim(data.body), at: trim(data.at), course: trim(data.course) };
      const errs = {};
      if (!v.title) errs.title = "عنوان الإعلان مطلوب.";
      if (!v.body) errs.body = "محتوى الإعلان مطلوب.";
      if (!validCourse(v.course)) errs.course = "المقرر المحدد غير موجود.";
      return Object.keys(errs).length ? errs : null;
    };
    const save = () => { normalize(); write("announcements", { items: clone(announcements) }); };
    // المنشئ الفعلي (المستخدم الذي أنشأ الإعلان)، وليس الدور فقط — ليكون التعديل والحذف لصاحب الإعلان نفسه
    const currentCreator = () => {
      try {
        const me = typeof Auth !== "undefined" && typeof Auth.current === "function" ? Auth.current() : null;
        return me ? { code: String(me.code || ""), role: String(me.role || ""), name: String(me.name || "") } : null;
      } catch (_) { return null; }
    };
    const isOwner = (record) => {
      const me = currentCreator();
      return !!me && String(record.createdBy || "") === me.code;
    };
    return {
      list: () => announcements.slice(),
      get: (id) => announcements.find((a) => a.id === id) || null,
      create(data) {
        const g = announcementGuard(); if (g) return g;
        const errs = validate(data);
        if (errs) return { ok: false, errors: errs };
        const me = currentCreator();
        if (!me) return { ok: false, error: "لا يمكن إضافة إعلان بدون جلسة نشطة." };
        const record = {
          id: genId(),
          title: trim(data.title),
          body: trim(data.body),
          at: trim(data.at),
          course: trim(data.course),
          createdBy: me.code,
          creatorRole: me.role,
          creatorName: me.name,
        };
        announcements.unshift(record); save();
        return { ok: true, record };
      },
      update(id, data) {
        const g = announcementGuard(); if (g) return g;
        const record = announcements.find((a) => a.id === id);
        if (!record) return { ok: false, error: "الإعلان غير موجود." };
        if (!isOwner(record)) {
          return { ok: false, error: "لا يمكنك تعديل إعلان لم تقم بإنشائه." };
        }
        const errs = validate(data);
        if (errs) return { ok: false, errors: errs };
        record.title = trim(data.title); record.body = trim(data.body);
        record.at = trim(data.at);
        // نموذج الأدمن لا يتضمن حقل المقرر — لا نمسحه عند التعديل
        if (data.course !== undefined) record.course = trim(data.course);
        save();
        return { ok: true, record };
      },
      remove(id) {
        const g = announcementGuard(); if (g) return g;
        const idx = announcements.findIndex((a) => a.id === id);
        if (idx === -1) return { ok: false, error: "الإعلان غير موجود." };
        const record = announcements[idx];
        const me = currentCreator();
        if (!me || (me.role !== "admin" && !isOwner(record))) {
          return { ok: false, error: "لا يمكنك حذف إعلان لم تقم بإنشائه." };
        }
        announcements.splice(idx, 1); save();
        return { ok: true };
      },
    };
  })();

  // ── المستندات: سجلات requestDocumentsById المرتبطة بطلبات الطلاب ──
  const documentsStore = (() => {
    const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp"];
    const STATUSES = ["pending", "accepted", "rejected"];
    const allDocs = () => studentRequests.flatMap((r) => (r.documents || []).map((d) => ({ ...d, requestId: r.id, studentName: r.studentName })));
    const findDoc = (id) => {
      for (const r of studentRequests) {
        const doc = (r.documents || []).find((d) => d.id === id);
        if (doc) return { request: r, doc };
      }
      return null;
    };
    const fileTypeOf = (fileName) => {
      const ext = trim(fileName).split(".").pop().toLowerCase();
      return IMAGE_EXTS.includes(ext) ? "image" : ext || "file";
    };
    const applySnap = (byRequest) => {
      studentRequests.forEach((r) => {
        const items = Array.isArray(byRequest[r.id]) ? byRequest[r.id] : [];
        let target = requestDocumentsById[r.id];
        if (!target) target = requestDocumentsById[r.id] = [];
        target.splice(0, target.length, ...clone(items));
        r.documents = target;
      });
    };
    const snap = read("documents");
    if (snap && snap.byRequest && typeof studentRequests !== "undefined") applySnap(snap.byRequest);
    const save = () => {
      const byRequest = {};
      studentRequests.forEach((r) => { byRequest[r.id] = clone(r.documents || []); });
      write("documents", { byRequest });
    };
    const validate = (data, { isEdit }) => {
      const v = {
        requestId: trim(data.requestId), name: trim(data.name), type: trim(data.type),
        fileName: trim(data.fileName), status: trim(data.status), rejectionReason: trim(data.rejectionReason),
      };
      const errs = {};
      if (!isEdit) {
        if (!v.requestId) errs.requestId = "الطلب المرتبط مطلوب.";
        else if (!studentRequests.some((r) => r.id === v.requestId)) errs.requestId = "الطلب المحدد غير موجود.";
      }
      if (!v.name) errs.name = "اسم المستند مطلوب.";
      if (!v.type) errs.type = "نوع المستند مطلوب.";
      if (!v.fileName) errs.fileName = "اسم الملف مطلوب.";
      else if (!/^[^\\/]+\.[a-z0-9]{1,5}$/i.test(v.fileName)) errs.fileName = "اسم الملف لازم يكون بصيغة ملف صحيحة (مثال: certificate.pdf).";
      if (!STATUSES.includes(v.status)) errs.status = "حالة المستند غير معروفة.";
      if (v.status === "rejected" && !v.rejectionReason) errs.rejectionReason = "سبب الرفض مطلوب عند رفض المستند.";
      return Object.keys(errs).length ? errs : null;
    };
    return {
      list: allDocs,
      get: (id) => { const f = findDoc(id); return f ? { ...f.doc, requestId: f.request.id, studentName: f.request.studentName } : null; },
      create(data) {
        const g = guard(); if (g) return g;
        const errs = validate(data, { isEdit: false });
        if (errs) return { ok: false, errors: errs };
        const request = studentRequests.find((r) => r.id === trim(data.requestId));
        if (!request.documents) request.documents = requestDocumentsById[request.id] = [];
        const record = {
          id: randId("DOC"), name: trim(data.name), type: trim(data.type),
          fileName: trim(data.fileName), fileType: fileTypeOf(data.fileName),
          status: trim(data.status), rejectionReason: trim(data.rejectionReason),
        };
        request.documents.push(record); save();
        return { ok: true, record: { ...record, requestId: request.id, studentName: request.studentName } };
      },
      update(id, data) {
        const g = guard(); if (g) return g;
        const found = findDoc(id);
        if (!found) return { ok: false, error: "المستند غير موجود." };
        const errs = validate({ ...data, requestId: found.request.id }, { isEdit: true });
        if (errs) return { ok: false, errors: errs };
        const d = found.doc;
        d.name = trim(data.name); d.type = trim(data.type);
        d.fileName = trim(data.fileName); d.fileType = fileTypeOf(data.fileName);
        d.status = trim(data.status); d.rejectionReason = trim(data.rejectionReason);
        save();
        return { ok: true, record: { ...d, requestId: found.request.id, studentName: found.request.studentName } };
      },
      remove(id) {
        const g = guard(); if (g) return g;
        const found = findDoc(id);
        if (!found) return { ok: false, error: "المستند غير موجود." };
        found.request.documents.splice(found.request.documents.indexOf(found.doc), 1); save();
        return { ok: true };
      },
    };
  })();

  // ── الأسئلة الشائعة لمعرفة المساعد الذكي (كيان جديد في هذا المشروع) ──
  const faqsStore = selfStore(
    "faqs", "FAQ",
    () => [
      { question: "كيف أقدّم طلب التحاق للجامعة؟", answer: "من صفحة طلبات الالتحاق في بوابة شؤون الطلاب، املأ البيانات وارفع بطاقة الترشيح والشهادة الثانوية، وستصلك حالة الطلب عبر النظام.", category: "طلبات الالتحاق", published: true },
      { question: "كيف أتابع حالة طلبي الإداري؟", answer: "ادخل إلى صفحة الطلبات، وستجد حالة كل طلب (قيد المراجعة، قيد التنفيذ، مقبول، مرفوض) مع الجدول الزمني لخطوات التنفيذ.", category: "التسجيل", published: true },
      { question: "ما مواعيد تقديم طلبات المنح؟", answer: "تُفتح بوابة المنح مع بداية كل فصل دراسي، ويُعلن الموعد النهائي عبر إعلانات الجامعة.", category: "المنح", published: true },
      { question: "كيف أقدّم تظلمًا على درجة؟", answer: "من صفحة التظلمات اختر المقرر ونوع الاختبار وارفع صورة ورقة الإجابة، وتراجع اللجنة الطلب خلال 48 ساعة.", category: "تظلمات", published: false },
    ],
    (data) => {
      const errs = {};
      if (!trim(data.question)) errs.question = "السؤال مطلوب.";
      if (!trim(data.answer)) errs.answer = "الإجابة مطلوبة.";
      if (trim(data.category) && !SECTION_LABELS().includes(trim(data.category))) errs.category = "التصنيف غير معروف.";
      return Object.keys(errs).length ? errs : null;
    },
  );

  // ── خدمات الجامعة (كيان جديد؛ التصنيفات من أقسام الخدمات الحالية) ──
  const servicesStore = selfStore(
    "services", "SVC",
    () => [
      { title: "طلب الالتحاق بالجامعة", description: "تقديم ومتابعة طلبات الالتحاق ورفع بطاقة الترشيح والشهادات إلكترونيًا.", section: "طلبات الالتحاق", available: true },
      { title: "المنح الدراسية", description: "التقديم على المنح الدراسية ورفع المستندات المالية ومتابعة حالة الطلب.", section: "المنح", available: true },
      { title: "التسجيل الأكاديمي", description: "إضافة وحذف المقررات وتعديل الخطة الدراسية بالتنسيق مع الإرشاد الأكاديمي.", section: "التسجيل", available: true },
      { title: "التربية العسكرية", description: "تسجيل مقرر التربية العسكرية ومتابعة حالة الإتمام للطلاب المستوفين للشروط.", section: "التربية العسكرية", available: true },
      { title: "الدعم الفني", description: "الإبلاغ عن المشكلات التقنية في النظام ومتابعة حلها من فريق الدعم.", section: "الدعم", available: false },
    ],
    (data) => {
      const errs = {};
      if (!trim(data.title)) errs.title = "اسم الخدمة مطلوب.";
      if (!trim(data.description)) errs.description = "وصف الخدمة مطلوب.";
      if (trim(data.section) && !SECTION_LABELS().includes(trim(data.section))) errs.section = "القسم غير معروف.";
      return Object.keys(errs).length ? errs : null;
    },
  );

  return {
    departments: departmentsStore,
    years: yearsStore,
    courses: coursesStore,
    announcements: announcementsStore,
    documents: documentsStore,
    faqs: faqsStore,
    services: servicesStore,
  };
})();

// ===== صفحات الأدمن =====

// ── ثوابت مشتركة ──────────────────────────────────────────────────────
const DEPARTMENTS = [
  "علوم الحاسب", "بحتة حاسب", "إحصاء حاسب", "فيزياء حاسب",
  "الرياضيات", "الفيزياء", "الكيمياء", "اللغة العربية",
  "اللغة الإنجليزية", "شئون الطلاب", "الإدارة",
];

const YEARS = ["الأولى", "الثانية", "الثالثة", "الرابعة"];

// خيارات القسم/الفرقة من مخزن الإدارة (Catalog) مع الرجوع للقائمة الثابتة
const deptOptions = () =>
  typeof Catalog !== "undefined"
    ? Catalog.departments.list().map(d => ({ value: d.name, label: d.name }))
    : DEPARTMENTS.map(d => ({ value: d, label: d }));
const yearOptions = () =>
  typeof Catalog !== "undefined"
    ? Catalog.years.list().map(y => ({ value: y.label, label: y.label }))
    : YEARS.map(y => ({ value: y, label: y }));

const ROLE_OPTIONS = [
  { value: "student", label: "طالب" },
  { value: "doctor",  label: "دكتور" },
  { value: "affairs", label: "شئون الطلاب" },
  { value: "admin",   label: "أدمن" },
];

const STATUS_OPTIONS = [
  { value: "active",   label: "نشط" },
  { value: "disabled", label: "معطّل" },
];

const ROLE_TABS = [
  { id: "student", label: "الطلاب" },
  { id: "doctor",  label: "الدكاترة" },
  { id: "affairs", label: "شئون الطلاب" },
  { id: "admin",   label: "الأدمن" },
];

const ROLE_BADGE_TONE = { student: "blue", doctor: "green", affairs: "amber", admin: "red" };
const STATUS_TONE     = { active: "green", disabled: "gray" };
const STATUS_LABEL    = { active: "نشط", disabled: "معطّل" };

// ── مساعدات ───────────────────────────────────────────────────────────
const roleBadge   = (role)   => badge(Auth.getRoleMeta()[role]?.label || role, ROLE_BADGE_TONE[role] || "gray");
const statusBadge = (status) => badge(STATUS_LABEL[status] || status,          STATUS_TONE[status]   || "gray");

// toast معرّف في ui.js (مكتبة F2 المشتركة) عشان تتوفر لكل الصفحات

// ── لوحة تحكم الإدارة ─────────────────────────────────────────────────
const adminDashboard = (view) => {
  const users    = Auth.getUsers();
  const students = users.filter(u => u.role === "student");
  const doctors  = users.filter(u => u.role === "doctor");
  const affairs  = users.filter(u => u.role === "affairs");
  const admins   = users.filter(u => u.role === "admin");

  view.innerHTML = `
    ${pageHead("لوحة تحكم الإدارة", "نظرة شاملة على النظام والمستخدمين")}

    <div class="grid g4" style="margin-bottom:14px">
      ${stat("إجمالي الطلاب",       students.length,          "users",     "blue")}
      ${stat("أعضاء هيئة التدريس",  doctors.length,           "grad",      "green")}
      ${stat("شئون الطلاب",          affairs.length,           "clipboard", "amber")}
      ${stat("الطلبات",              studentRequests.length,   "file",      "red")}
    </div>
    <div class="grid g4" style="margin-bottom:20px">
      ${stat("التظلمات",             gradeAppeals.length,      "alert",     "red")}
      ${stat("المقررات",             courseCatalog.length,     "book",      "amber")}
      ${stat("الإشعارات",            announcements.length,     "bell",      "blue")}
      ${stat("المستخدمين",           users.length,             "users",     "green")}
    </div>

    <h3 style="margin:0 0 12px;font-size:15px;font-weight:800">اختصارات الإدارة</h3>
    <div class="grid g4" style="margin-bottom:20px" id="shortcuts"></div>

    <div class="grid g2">
      <div class="card">
        <h3>توزيع المستخدمين حسب الدور</h3>
        <div class="list" id="role-dist"></div>
      </div>
      <div class="card">
        <h3>نشاط الطلبات الأخيرة</h3>
        <div class="list" id="recent-requests"></div>
      </div>
    </div>`;

  // اختصارات — تُعرض فقط ما يملك المستخدم صلاحية الوصول إليه
  const shortcuts = [
    { icon: "users",     label: "إدارة المستخدمين", href: "users.html",                    tone: "blue",  perm: "users.manage"    },
    { icon: "shield",    label: "الصلاحيات والأدوار", href: "roles.html",                  tone: "red",   perm: "users.manage"    },
    { icon: "mega",      label: "إعدادات النظام",    href: "settings.html",                 tone: "amber", perm: "settings.manage" },
    { icon: "search",    label: "البحث الشامل",      href: "search.html",                   tone: "green" },
    { icon: "file",      label: "الطلبات",            href: "../affairs/requests.html",      tone: "amber", perm: "requests.manage" },
    { icon: "alert",     label: "التظلمات",            href: "../affairs/grade-appeals.html", tone: "red",   perm: "grades.manage"   },
    { icon: "book",      label: "المقررات",            href: "../doctor/courses.html",        tone: "green" },
  ].filter(s => !s.perm || Auth.can(s.perm));
  const sc = document.getElementById("shortcuts");
  shortcuts.forEach(s => {
    const a = document.createElement("a");
    a.href = s.href;
    a.className = "card";
    a.style.cssText = "display:flex;align-items:center;gap:12px;text-decoration:none;padding:16px;";
    a.innerHTML = `<div class="ico ${s.tone}">${icon(s.icon, 20)}</div><b style="font-size:14px">${s.label}</b>`;
    sc.appendChild(a);
  });

  // توزيع الأدوار
  const dist = document.getElementById("role-dist");
  [
    { role: "student", count: students.length,                label: "الطلاب" },
    { role: "doctor",  count: doctors.length,                 label: "الدكاترة" },
    { role: "affairs", count: affairs.length,                 label: "شئون الطلاب" },
    { role: "admin",   count: admins.length,                  label: "الأدمن" },
  ].forEach(r => {
    const div = document.createElement("div");
    div.className = "li";
    div.innerHTML = `<div class="ico ${ROLE_BADGE_TONE[r.role]}" style="width:34px;height:34px">${icon("users", 16)}</div>
      <div class="grow"><b>${r.label}</b><small>${r.count} مستخدم</small></div>
      ${roleBadge(r.role)}`;
    dist.appendChild(div);
  });

  // آخر طلبات
  const rr = document.getElementById("recent-requests");
  studentRequests.slice(0, 5).forEach(req => {
    const meta = requestStatusMeta[req.status] || { label: req.status, tone: "gray" };
    const div  = document.createElement("div");
    div.className = "li";
    div.innerHTML = `<div class="grow"><b>${esc(req.studentName)}</b><small>${esc(req.category)} · ${req.submittedAt}</small></div>${badge(meta.label, meta.tone)}`;
    rr.appendChild(div);
  });
};

// ── نموذج إضافة مستخدم (modal) ─────────────────────────────────────────
function openAddUserModal(onAdded) {
  modal(`
    <h2>إضافة مستخدم جديد</h2>
    <p>يُرجى ملء جميع الحقول المطلوبة. كلمة المرور الأولية تُولَّد تلقائيًا من الكود الجامعي.</p>

    <div class="grid g2">
      ${field("الاسم *", '<input class="input" id="nu-name" placeholder="الاسم الكامل">', "nu-name")}
      ${field("الكود الجامعي *", '<input class="input" id="nu-code" placeholder="مثال: ST4010" dir="ltr">', "nu-code")}
    </div>
    ${field("البريد الإلكتروني *", '<input class="input" id="nu-email" type="email" placeholder="example@uni.edu.eg" dir="ltr">', "nu-email")}
    <div class="grid g2">
      <div class="field"><label>الدور *</label><div id="nu-role-dd"></div><div class="e" id="e-nu-role"></div></div>
      <div class="field"><label>الحالة</label><div id="nu-status-dd"></div></div>
    </div>
    <div class="grid g2">
      <div class="field" id="nu-dept-wrap">
        <label>القسم</label><div id="nu-dept-dd"></div>
      </div>
      <div class="field" id="nu-year-wrap">
        <label>السنة الدراسية <span id="nu-year-req"></span></label>
        <div id="nu-year-dd"></div>
        <div class="e" id="e-nu-year"></div>
      </div>
    </div>
    <div class="acts" style="margin-top:8px">
      <button class="btn primary" id="nu-save">إضافة المستخدم</button>
      <button class="btn ghost"   id="nu-cancel">إلغاء</button>
    </div>`,
  (m, close) => {
    const roleDd   = createDropdown(m.querySelector("#nu-role-dd"), {
      placeholder: "اختر الدور",
      options: ROLE_OPTIONS,
      onChange: updateYearVisibility,
    });
    const statusDd = createDropdown(m.querySelector("#nu-status-dd"), {
      value: "active",
      options: STATUS_OPTIONS,
    });
    const deptDd   = createDropdown(m.querySelector("#nu-dept-dd"), {
      placeholder: "اختر القسم",
      searchable: true,
      options: deptOptions(),
    });
    const yearDd   = createDropdown(m.querySelector("#nu-year-dd"), {
      placeholder: "اختر السنة",
      options: yearOptions(),
    });

    function updateYearVisibility(role) {
      const yearWrap = m.querySelector("#nu-year-wrap");
      const yearReq  = m.querySelector("#nu-year-req");
      if (role === "student") {
        yearWrap.style.opacity = "1";
        yearReq.textContent = "*";
      } else {
        yearWrap.style.opacity = "0.4";
        yearReq.textContent = "";
        yearDd.set("");
      }
    }
    updateYearVisibility(roleDd.get());

    m.querySelector("#nu-cancel").onclick = close;

    m.querySelector("#nu-save").onclick = () => {
      // مسح أخطاء سابقة
      ["nu-name","nu-code","nu-email","nu-role","nu-year"].forEach(id => setErr(id, ""));

      const name   = (m.querySelector("#nu-name").value  || "").trim();
      const code   = (m.querySelector("#nu-code").value  || "").trim();
      const email  = (m.querySelector("#nu-email").value || "").trim();
      const role   = roleDd.get();
      const status = statusDd.get() || "active";
      const dept   = deptDd.get();
      const year   = yearDd.get();

      let invalid = false;
      if (!name)  { setErr("nu-name",  "الاسم مطلوب.");              invalid = true; }
      if (!code)  { setErr("nu-code",  "الكود الجامعي مطلوب.");      invalid = true; }
      if (!email) { setErr("nu-email", "البريد الإلكتروني مطلوب.");  invalid = true; }
      if (!role)  { setErr("nu-role",  "الدور مطلوب.");              invalid = true; }
      if (role === "student" && !year) { setErr("nu-year", "السنة الدراسية مطلوبة للطلاب."); invalid = true; }
      if (invalid) return;

      const result = Auth.addUser({ name, code, email, role, status, department: dept || null, year: year || null });
      if (!result.ok) {
        // وجّه الخطأ للحقل المناسب
        if (result.error.includes("الكود"))   setErr("nu-code",  result.error);
        else if (result.error.includes("البريد")) setErr("nu-email", result.error);
        else if (result.error.includes("صيغة"))  setErr("nu-email", result.error);
        else                                       setErr("nu-name",  result.error);
        return;
      }
      close();
      toast(`تم إضافة المستخدم ${result.user.name} بنجاح. كلمة المرور الأولية: ${result.user.password}`);
      onAdded && onAdded(result.user);
    };
  });
}

// ── تفاصيل مستخدم (modal) ───────────────────────────────────────────────
function openViewUserModal(user) {
  modal(`
    <h2>${esc(user.name)}</h2>
    <div class="list">
      ${[
        ["الدور",             roleBadge(user.role)],
        ["الحالة",            statusBadge(user.status)],
        ["الكود الجامعي",     `<b dir="ltr">${esc(user.code)}</b>`],
        ["البريد الإلكتروني", esc(user.email || "—")],
        ["القسم",             esc(user.department || "—")],
        ["السنة الدراسية",    esc(user.year       || "—")],
      ].map(([label, val]) =>
        `<div class="li" style="padding:10px 0"><div class="grow"><b>${label}</b></div>${val}</div>`
      ).join("")}
    </div>
    <div class="acts"><button class="btn ghost" data-close>إغلاق</button></div>`,
  (m, close) => { m.querySelector("[data-close]").onclick = close; });
}

// ── تعديل مستخدم (modal) ────────────────────────────────────────────────
function openEditUserModal(user, onSaved) {
  modal(`
    <h2>تعديل بيانات المستخدم</h2>
    <div class="grid g2">
      ${field("الاسم *",              `<input class="input" id="eu-name"  value="${esc(user.name)}"  placeholder="الاسم">`,   "eu-name")}
      ${field("البريد الإلكتروني *", `<input class="input" id="eu-email" value="${esc(user.email || "")}" placeholder="email" dir="ltr">`, "eu-email")}
    </div>
    <div class="grid g2">
      <div class="field"><label>القسم</label><div id="eu-dept-dd"></div></div>
      <div class="field" id="eu-year-wrap"><label>السنة الدراسية</label><div id="eu-year-dd"></div><div class="e" id="e-eu-year"></div></div>
    </div>
    <div class="field"><label>الحالة</label><div id="eu-status-dd"></div></div>
    <div class="acts">
      <button class="btn primary" id="eu-save">حفظ التعديلات</button>
      <button class="btn ghost"   id="eu-cancel">إلغاء</button>
    </div>`,
  (m, close) => {
    const deptDd = createDropdown(m.querySelector("#eu-dept-dd"), {
      value: user.department || "",
      placeholder: "اختر القسم",
      searchable: true,
      options: deptOptions(),
    });
    const yearDd = createDropdown(m.querySelector("#eu-year-dd"), {
      value: user.year || "",
      placeholder: "اختر السنة",
      options: yearOptions(),
    });
    const statusDd = createDropdown(m.querySelector("#eu-status-dd"), {
      value: user.status || "active",
      options: STATUS_OPTIONS,
    });

    // إخفاء السنة لغير الطلاب
    if (user.role !== "student") {
      m.querySelector("#eu-year-wrap").style.opacity = "0.4";
    }

    m.querySelector("#eu-cancel").onclick = close;
    m.querySelector("#eu-save").onclick = () => {
      ["eu-name","eu-email","eu-year"].forEach(id => setErr(id, ""));

      const name   = (m.querySelector("#eu-name").value  || "").trim();
      const email  = (m.querySelector("#eu-email").value || "").trim();
      const dept   = deptDd.get();
      const year   = yearDd.get();
      const status = statusDd.get() || "active";

      let invalid = false;
      if (!name)  { setErr("eu-name",  "الاسم مطلوب.");              invalid = true; }
      if (!email) { setErr("eu-email", "البريد الإلكتروني مطلوب.");  invalid = true; }
      if (user.role === "student" && !year) { setErr("eu-year", "السنة الدراسية مطلوبة للطلاب."); invalid = true; }
      if (invalid) return;

      const result = Auth.editUser(user.code, { name, email, department: dept || null, year: year || null, status });
      if (!result.ok) {
        setErr("eu-email", result.error);
        return;
      }
      close();
      toast("تم حفظ التعديلات بنجاح.");
      onSaved && onSaved(result.user);
    };
  });
}

// ── تغيير الدور (modal) ──────────────────────────────────────────────────
function openChangeRoleModal(user, onChanged) {
  const roleDd = { get: () => "" }; // سيتم تعيينه داخل mount
  modal(`
    <h2>تغيير دور المستخدم</h2>
    <p>المستخدم الحالي: <b>${esc(user.name)}</b> — الدور الحالي: ${roleBadge(user.role)}</p>
    <div class="field"><label>الدور الجديد *</label><div id="cr-role-dd"></div><div class="e" id="e-cr-role"></div></div>
    <div class="acts">
      <button class="btn primary" id="cr-save">تغيير الدور</button>
      <button class="btn ghost"   id="cr-cancel">إلغاء</button>
    </div>`,
  (m, close) => {
    const dd = createDropdown(m.querySelector("#cr-role-dd"), {
      value: user.role,
      options: ROLE_OPTIONS,
    });
    m.querySelector("#cr-cancel").onclick = close;
    m.querySelector("#cr-save").onclick = () => {
      setErr("cr-role", "");
      const newRole = dd.get();
      if (!newRole) { setErr("cr-role", "اختر الدور الجديد."); return; }
      if (newRole === user.role) { setErr("cr-role", "الدور الجديد مطابق للدور الحالي."); return; }
      confirmDlg({
        title: "تأكيد تغيير الدور",
        body:  `هل أنت متأكد من تغيير دور ${esc(user.name)} من "${Auth.getRoleMeta()[user.role]?.label}" إلى "${Auth.getRoleMeta()[newRole]?.label}"؟ سيؤثر ذلك على صلاحيات المستخدم فور دخوله التالي.`,
        label: "تغيير الدور",
        onOk: () => {
          const result = Auth.changeRole(user.code, newRole);
          if (!result.ok) { toast(result.error, "red"); return; }
          close();
          toast(`تم تغيير دور ${user.name} بنجاح.`);
          onChanged && onChanged();
        },
      });
    };
  });
}

// ── قائمة الإجراءات لكل مستخدم ──────────────────────────────────────────
function renderUserActions(user, redrawTable) {
  return `<div style="display:flex;gap:6px;flex-wrap:wrap">
    <button class="btn ghost" style="padding:6px 10px;font-size:12px" data-act="view"   data-code="${esc(user.code)}">عرض</button>
    <button class="btn outline" style="padding:6px 10px;font-size:12px" data-act="edit"  data-code="${esc(user.code)}">تعديل</button>
    <button class="btn ${user.status === "disabled" ? "primary" : "danger"}" style="padding:6px 10px;font-size:12px" data-act="${user.status === "disabled" ? "reset" : "disable"}" data-code="${esc(user.code)}">${user.status === "disabled" ? "إعادة تعيين" : "تعطيل"}</button>
    <button class="btn ghost" style="padding:6px 10px;font-size:12px;border-color:var(--blue);color:var(--blue)" data-act="role" data-code="${esc(user.code)}">تغيير الدور</button>
  </div>`;
}

function bindUserActions(tableEl, getUsers, redraw) {
  tableEl.addEventListener("click", e => {
    const btn  = e.target.closest("[data-act]");
    if (!btn) return;
    const code = btn.dataset.code;
    const act  = btn.dataset.act;
    const user = Auth.getUserByCode(code);
    if (!user) return;

    if (act === "view") {
      openViewUserModal(user);
    } else if (act === "edit") {
      openEditUserModal(user, () => redraw());
    } else if (act === "disable") {
      confirmDlg({
        title:  "تعطيل الحساب",
        body:   `هل أنت متأكد من تعطيل حساب ${esc(user.name)}؟ لن يتمكن المستخدم من تسجيل الدخول حتى تُعيد تنشيطه.`,
        label:  "تعطيل الحساب",
        danger: true,
        onOk:  () => {
          const r = Auth.disableUser(code);
          if (!r.ok) { toast(r.error, "red"); return; }
          toast(`تم تعطيل حساب ${user.name}.`, "red");
          redraw();
        },
      });
    } else if (act === "reset") {
      confirmDlg({
        title: "إعادة تعيين الحساب",
        body:  `سيتم تفعيل حساب ${esc(user.name)} وإعادة تعيين كلمة المرور للقيمة الأولية.`,
        label: "إعادة التعيين",
        onOk: () => {
          const r = Auth.resetUser(code);
          if (!r.ok) { toast(r.error, "red"); return; }
          toast(`تم إعادة تعيين حساب ${user.name}. كلمة المرور الأولية: ${r.tempPassword}`);
          redraw();
        },
      });
    } else if (act === "role") {
      openChangeRoleModal(user, () => redraw());
    }
  });
}

// ── صفحة إدارة المستخدمين ───────────────────────────────────────────────
const adminUsers = (view) => {
  let activeTab = "student";

  const render = () => {
    view.innerHTML = `
      ${pageHead(
        "إدارة المستخدمين",
        "عرض الحسابات المسجلة وإدارة الصلاحيات",
        '<button class="btn primary" id="add-user-btn">' + icon("users", 14) + ' إضافة مستخدم</button>'
      )}
      <div class="card">
        <div id="tabs-host"></div>
        <div id="table-host"></div>
      </div>`;

    tabs(view.querySelector("#tabs-host"), ROLE_TABS, activeTab, (tab) => {
      activeTab = tab;
      renderTable();
    });
    renderTable();

    view.querySelector("#add-user-btn").onclick = () => {
      openAddUserModal(() => renderTable());
    };
  };

  const renderTable = () => {
    const host = view.querySelector("#table-host");
    if (!host) return;
    host.innerHTML = "";

    const users = Auth.getUsers(activeTab);

    const colsByRole = {
      student: [
        { title: "الاسم",             render: u => esc(u.name) },
        { title: "الكود",             render: u => `<b dir="ltr">${esc(u.code)}</b>` },
        { title: "البريد",            render: u => `<span dir="ltr" style="font-size:12px">${esc(u.email || "—")}</span>` },
        { title: "القسم",             render: u => esc(u.department || "—") },
        { title: "السنة",             render: u => esc(u.year || "—") },
        { title: "الحالة",            render: u => statusBadge(u.status) },
        { title: "الإجراءات",         render: u => renderUserActions(u) },
      ],
      doctor: [
        { title: "الاسم",             render: u => esc(u.name) },
        { title: "الكود",             render: u => `<b dir="ltr">${esc(u.code)}</b>` },
        { title: "البريد",            render: u => `<span dir="ltr" style="font-size:12px">${esc(u.email || "—")}</span>` },
        { title: "القسم",             render: u => esc(u.department || "—") },
        { title: "الحالة",            render: u => statusBadge(u.status) },
        { title: "الإجراءات",         render: u => renderUserActions(u) },
      ],
      affairs: [
        { title: "الاسم",             render: u => esc(u.name) },
        { title: "الكود",             render: u => `<b dir="ltr">${esc(u.code)}</b>` },
        { title: "البريد",            render: u => `<span dir="ltr" style="font-size:12px">${esc(u.email || "—")}</span>` },
        { title: "الحالة",            render: u => statusBadge(u.status) },
        { title: "الإجراءات",         render: u => renderUserActions(u) },
      ],
      admin: [
        { title: "الاسم",             render: u => esc(u.name) },
        { title: "الكود",             render: u => `<b dir="ltr">${esc(u.code)}</b>` },
        { title: "البريد",            render: u => `<span dir="ltr" style="font-size:12px">${esc(u.email || "—")}</span>` },
        { title: "الحالة",            render: u => statusBadge(u.status) },
        { title: "الإجراءات",         render: u => renderUserActions(u) },
      ],
    };

    const tableWrapper = document.createElement("div");
    host.appendChild(tableWrapper);

    createTable(tableWrapper, {
      cols:  colsByRole[activeTab] || colsByRole.student,
      rows:  users,
      pageSize: 10,
      search: {
        placeholder: "ابحث بالاسم أو الكود أو البريد...",
        test: (u, q) => `${u.name} ${u.code} ${u.email || ""} ${u.department || ""}`.toLowerCase().includes(q.toLowerCase()),
      },
      filter: {
        label: "الحالة",
        options: [
          { value: "", label: "الكل" },
          ...STATUS_OPTIONS,
        ],
        test: (u, v) => !v || u.status === v,
      },
      empty: `<div style="padding:40px;text-align:center;color:var(--sub)">لا يوجد مستخدمون في هذا التبويب.</div>`,
      onRender: (body) => bindUserActions(body, () => Auth.getUsers(activeTab), renderTable),
    });
  };

  render();
};

// ── الصلاحيات والأدوار (مصفوفة الأدوار × الصلاحيات) ─────────────────────
const adminRoles = (view) => {
  const roles = Auth.getPermissionRoles();
  const perms = Auth.getPermissionCatalog();
  let matrix = Auth.getPermissions();
  let dirty  = false;

  const SAVE_LABEL = icon("check", 14) + " حفظ التغييرات";

  const render = () => {
    view.innerHTML = `
      ${pageHead(
        "الصلاحيات والأدوار",
        "فعّل أو عطّل صلاحية لكل دور ثم احفظ — تُطبَّق التغييرات فورًا على جميع مستخدمي الدور.",
        `<button class="btn ghost" id="perm-reset">استعادة الافتراضي</button>
         <button class="btn primary" id="perm-save" disabled>${SAVE_LABEL}</button>`
      )}
      <div class="card">
        <div class="tw">
          <table style="min-width:820px">
            <thead>
              <tr>
                <th style="position:sticky;right:0">الدور</th>
                ${perms.map(p => `<th title="${esc(p.desc)}">${esc(p.label)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${roles.map(r => `
                <tr>
                  <td style="position:sticky;right:0;background:#fff">${roleBadge(r.key)}</td>
                  ${perms.map(p => `
                    <td style="text-align:center">
                      ${chk(
                        `data-role="${r.key}" data-perm="${p.key}" ${matrix[r.key][p.key] ? "checked" : ""} ${r.key === "admin" ? "disabled" : ""} aria-label="${esc(p.label)} — ${esc(r.label)}"`,
                        true
                      )}
                    </td>`).join("")}
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
        <p style="margin:12px 2px 0;font-size:12px;color:var(--mut)">
          دور الأدمن محمي: يحتفظ بكل الصلاحيات دائمًا ولا يمكن تقليصه، حتى لا يُقفل الوصول للإدارة والإعدادات.
        </p>
      </div>`;

    const saveBtn = view.querySelector("#perm-save");

    view.querySelectorAll("input[data-perm]").forEach(cb => {
      cb.onchange = () => {
        matrix[cb.dataset.role][cb.dataset.perm] = cb.checked;
        dirty = true;
        saveBtn.disabled = false;
      };
    });

    saveBtn.onclick = () => {
      confirmDlg({
        title: "حفظ صلاحيات الأدوار",
        body:  "سيتم تطبيق الصلاحيات الجديدة فورًا على جميع مستخدمي الأدوار. هل تريد المتابعة؟",
        label: "حفظ",
        onOk: () => {
          saveBtn.disabled = true;
          saveBtn.textContent = "جاري الحفظ...";
          // محاكاة زمن الحفظ على الخادم في النسخة التجريبية
          setTimeout(() => {
            const r = Auth.savePermissions(matrix);
            if (!r.ok) {
              toast(r.error, "red");
              saveBtn.disabled = false;
              saveBtn.innerHTML = SAVE_LABEL;
              return;
            }
            dirty = false;
            toast("تم حفظ الصلاحيات بنجاح.");
            render();
          }, 400);
        },
      });
    };

    view.querySelector("#perm-reset").onclick = () => {
      confirmDlg({
        title: "استعادة الصلاحيات الافتراضية",
        body:  "سيتم استبدال مصفوفة الصلاحيات الحالية بالقيم الافتراضية لكل دور.",
        label: "استعادة",
        danger: true,
        onOk: () => {
          const r = Auth.resetPermissions();
          if (!r.ok) { toast(r.error, "red"); return; }
          matrix = Auth.getPermissions();
          dirty = false;
          toast("تمت استعادة الصلاحيات الافتراضية.");
          render();
        },
      });
    };
  };

  render();
};

// ── إعدادات النظام ──────────────────────────────────────────────────────
const adminSettings = (view) => {
  const render = () => {
    const groups = Settings.all();

    view.innerHTML = `
      ${pageHead(
        "إعدادات النظام",
        "إعدادات التطبيق العامة — تُحفظ في قاعدة البيانات وتُستخدم في الشاشات المختلفة.",
        `<button class="btn ghost" id="set-reset">استعادة الافتراضي</button>
         <button class="btn primary" id="set-save">${icon("check", 14)} حفظ الإعدادات</button>`
      )}
      <div id="set-form"></div>`;

    const form = view.querySelector("#set-form");
    const getters = {};

    const addField = (host, f) => {
      const wrap = document.createElement("div");
      wrap.className = "field";
      const help = f.help ? `<div class="h">${esc(f.help)}</div>` : "";
      const err  = `<div class="e" id="e-set-${f.key}" role="alert"></div>`;

      if (f.type === "boolean") {
        wrap.innerHTML = `
          <label>${esc(f.label)}</label>
          <div>${chk(`id="set-inp-${f.key}" ${f.value ? "checked" : ""} aria-label="${esc(f.label)}"`, true)}</div>
          ${help}${err}`;
        host.appendChild(wrap);
        getters[f.key] = () => view.querySelector(`#set-inp-${f.key}`).checked;
        return;
      }

      if (f.type === "select") {
        wrap.innerHTML = `
          <label>${esc(f.label)}</label>
          <div id="set-inp-${f.key}"></div>
          ${help}${err}`;
        host.appendChild(wrap);
        const dd = createDropdown(wrap.querySelector(`#set-inp-${f.key}`), {
          value: f.value,
          options: f.options.map(o => ({ value: o, label: o })),
        });
        getters[f.key] = () => dd.get();
        return;
      }

      const inputType = f.type === "number" ? "number" : "text";
      const value = f.type === "extlist" ? (f.value || []).join(", ") : f.value;
      wrap.innerHTML = `
        <label>${esc(f.label)}</label>
        <input class="input" id="set-inp-${f.key}" type="${inputType}" value="${esc(value)}" ${f.type === "number" ? `min="${f.min}" max="${f.max}"` : ""}>
        ${help}${err}`;
      host.appendChild(wrap);
      getters[f.key] = () => view.querySelector(`#set-inp-${f.key}`).value;
    };

    groups.forEach(g => {
      const card = document.createElement("div");
      card.className = "card";
      card.style.marginBottom = "14px";
      card.innerHTML = `<h3>${icon(g.icon, 16)} ${esc(g.label)}</h3>`;
      g.fields.forEach(f => addField(card, f));
      form.appendChild(card);
    });

    view.querySelector("#set-save").onclick = () => {
      groups.forEach(g => g.fields.forEach(f => setErr("set-" + f.key, "")));

      const patch = {};
      Object.keys(getters).forEach(k => { patch[k] = getters[k](); });

      const btn = view.querySelector("#set-save");
      btn.disabled = true;
      btn.textContent = "جاري الحفظ...";

      setTimeout(() => {
        const r = Settings.update(patch);
        if (!r.ok) {
          Object.keys(r.errors).forEach(k => {
            if (k === "_") toast(r.errors[k], "red");
            else setErr("set-" + k, r.errors[k]);
          });
          btn.disabled = false;
          btn.innerHTML = icon("check", 14) + " حفظ الإعدادات";
          return;
        }
        toast("تم حفظ الإعدادات بنجاح.");
        render();
      }, 400);
    };

    view.querySelector("#set-reset").onclick = () => {
      confirmDlg({
        title: "استعادة الإعدادات الافتراضية",
        body:  "سيتم استبدال جميع إعدادات النظام بالقيم الافتراضية.",
        label: "استعادة",
        danger: true,
        onOk: () => {
          const r = Settings.reset();
          if (!r.ok) { toast(r.error, "red"); return; }
          toast("تمت استعادة الإعدادات الافتراضية.");
          render();
        },
      });
    };
  };

  render();
};

// ── البحث الشامل (لموظفي الإدارة) ───────────────────────────────────────
const adminGlobalSearch = (view, _p, query = {}) => {
  const CATEGORIES = [
    { key: "students",   label: "الطلاب",   icon: "users",     perm: "students.view",   list: "../affairs/students.html" },
    { key: "requests",   label: "الطلبات",  icon: "file",      perm: "requests.manage", list: "../affairs/requests.html" },
    { key: "admissions", label: "الالتحاق", icon: "clipboard", perm: "requests.manage", list: "../affairs/admissions.html" },
    { key: "courses",    label: "المقررات", icon: "book",      perm: "grades.manage",   list: "../doctor/courses.html" },
    { key: "grades",     label: "الدرجات",  icon: "grad",      perm: "grades.manage",   list: "../affairs/grade-appeals.html" },
  ].filter(c => Auth.can(c.perm));

  const LIMIT = 5;
  let activeCat = "all";
  let token = 0;

  view.innerHTML = `
    ${pageHead("البحث الشامل", "بحث موحد في الطلاب والطلبات والالتحاق والمقررات والدرجات — حسب صلاحيات دورك.")}
    <div class="card" style="margin-bottom:14px">
      <div class="tools" style="margin-bottom:0">
        <input class="input" id="gs-q" style="flex:1;min-width:220px" placeholder="ابحث بالاسم أو الكود الجامعي أو رقم الطلب أو اسم المقرر..." aria-label="بحث شامل" value="${esc(query.q || "")}">
        <button class="btn primary" id="gs-go">${icon("search", 14)} بحث</button>
      </div>
      <div id="gs-cats" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px"></div>
    </div>
    <div id="gs-out"></div>`;

  const input  = view.querySelector("#gs-q");
  const out    = view.querySelector("#gs-out");
  const catBox = view.querySelector("#gs-cats");

  const catAllowed = key => CATEGORIES.some(c => c.key === key);
  const enabled    = key => activeCat === "all" || activeCat === key;

  const drawCats = () => {
    const all = [{ key: "all", label: "الكل" }, ...CATEGORIES];
    catBox.innerHTML = all.map(c =>
      `<button type="button" class="btn ${c.key === activeCat ? "primary" : "ghost"}" data-cat="${c.key}" style="padding:7px 12px;font-size:12px">${esc(c.label)}</button>`
    ).join("");
    catBox.querySelectorAll("button").forEach(b => {
      b.onclick = () => { activeCat = b.dataset.cat; drawCats(); run(input.value); };
    });
  };

  const collect = q => {
    const has = (...vals) => vals.some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q));
    const res = {};

    if (enabled("students") && catAllowed("students")) {
      res.students = students
        .filter(s => has(s.name, s.id, s.email, s.course, s.program))
        .slice(0, LIMIT)
        .map(s => ({
          title: esc(s.name),
          sub:   `كود ${s.id} · ${esc(s.course)} · ${esc(s.program)}`,
          badge: badge("طالب", "blue"),
          href:  `../affairs/student-detail.html?id=${encodeURIComponent(s.id)}`,
        }));
    }

    if (enabled("requests") && catAllowed("requests")) {
      res.requests = studentRequests
        .filter(r => has(r.id, r.studentName, r.studentId, r.category, r.section))
        .slice(0, LIMIT)
        .map(r => {
          const meta = requestStatusMeta[r.status] || { label: r.status, tone: "gray" };
          return {
            title: esc(r.category),
            sub:   `${esc(r.studentName)} · ${r.id} · ${esc(r.section)}`,
            badge: badge(meta.label, meta.tone),
            href:  `../affairs/request-detail.html?id=${encodeURIComponent(r.id)}`,
          };
        });
    }

    if (enabled("admissions") && catAllowed("admissions")) {
      res.admissions = highSchoolApplications
        .filter(a => has(a.id, a.applicationNumber, a.studentName, a.nationalId))
        .slice(0, LIMIT)
        .map(a => {
          const meta = admissionStatusMeta[a.status] || { label: a.status, tone: "gray" };
          return {
            title: esc(a.studentName),
            sub:   `${a.id} · ${esc(a.applicationNumber)}`,
            badge: badge(meta.label, meta.tone),
            href:  `../affairs/admission-detail.html?id=${encodeURIComponent(a.id)}`,
          };
        });
    }

    if (enabled("courses") && catAllowed("courses")) {
      res.courses = courses
        .filter(c => has(c.code, c.name, c.year))
        .slice(0, LIMIT)
        .map(c => ({
          title: `${c.code} — ${esc(c.name)}`,
          sub:   `السنة ${esc(c.year)} · ${c.hours} ساعات · ${c.students} طالب`,
          badge: badge("مقرر", "amber"),
          href:  `../doctor/course-detail.html?code=${encodeURIComponent(c.code)}`,
        }));
    }

    if (enabled("grades") && catAllowed("grades")) {
      const appeals = gradeAppeals
        .filter(a => has(a.id, a.studentName, a.studentId, a.course))
        .slice(0, LIMIT)
        .map(a => {
          const meta = appealStatusMeta[a.status] || { label: a.status, tone: "gray" };
          return {
            title: `تظلم — ${esc(a.studentName)}`,
            sub:   `${a.id} · ${esc(a.course)} · درجة ${a.grade}`,
            badge: badge(meta.label, meta.tone),
            href:  `../affairs/grade-appeal-detail.html?id=${encodeURIComponent(a.id)}`,
          };
        });
      const records = students
        .filter(s => (s.mid !== null || s.work !== null) && has(s.name, s.id, s.course))
        .slice(0, LIMIT)
        .map(s => ({
          title: esc(s.name),
          sub:   `كود ${s.id} · ${esc(s.course)} · ميدتيرم ${s.mid ?? "—"} / أعمال ${s.work ?? "—"}`,
          badge: badge("درجة", "green"),
          href:  `../doctor/grades.html?course=${encodeURIComponent(s.course)}`,
        }));
      res.grades = [...appeals, ...records].slice(0, LIMIT);
    }

    return res;
  };

  const drawResults = q => {
    let res;
    try { res = collect(q); } catch (e) {
      out.innerHTML = `<div class="card">${errorBox("تعذر إجراء البحث", "حدث خطأ غير متوقع أثناء البحث، حاول مرة أخرى.")}</div>`;
      return;
    }

    const sections = CATEGORIES
      .map(c => ({ ...c, items: res[c.key] || [] }))
      .filter(c => c.items.length > 0);

    if (!sections.length) {
      out.innerHTML = `<div class="card">${empty("لا توجد نتائج مطابقة", `لم يتم العثور على شيء يطابق "${esc(q)}". جرّب كلمات بحث مختلفة.`)}</div>`;
      return;
    }

    out.innerHTML = sections.map(c => `
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <div class="ico gray" style="width:32px;height:32px">${icon(c.icon, 16)}</div>
          <b style="font-size:14px">${esc(c.label)}</b>
          ${badge(c.items.length, "blue")}
          <div style="flex:1"></div>
          <a class="btn ghost" style="padding:5px 10px;font-size:12px" href="${c.list}">عرض الكل</a>
        </div>
        <div class="list">
          ${c.items.map(it => `
            <div class="li gs-row" data-href="${it.href}" style="cursor:pointer" role="link" tabindex="0">
              <div class="grow"><b>${it.title}</b><small>${it.sub}</small></div>
              ${it.badge}
            </div>`).join("")}
        </div>
      </div>`).join("");

    out.querySelectorAll(".gs-row").forEach(row => {
      const nav = () => go(row.dataset.href);
      row.onclick = nav;
      row.onkeydown = e => { if (e.key === "Enter") nav(); };
    });
  };

  const run = q => {
    const queryText = (q || "").trim();
    const t = ++token;

    if (!queryText) {
      out.innerHTML = `<div class="card">${empty("ابحث في النظام", "اكتب اسم طالب أو كود جامعي أو رقم طلب أو اسم مقرر — النتائج تظهر هنا مجمعة حسب الفئة.")}</div>`;
      return;
    }

    out.innerHTML = skeleton(3, 72);
    // محاكاة زمن الاستعلام عن الخادم في النسخة التجريبية
    setTimeout(() => {
      if (t !== token) return;
      drawResults(queryText);
    }, 250);
  };

  input.oninput = () => run(input.value);
  input.onkeydown = e => { if (e.key === "Enter") run(input.value); };
  view.querySelector("#gs-go").onclick = () => { run(input.value); input.focus(); };

  drawCats();
  run(input.value);
};

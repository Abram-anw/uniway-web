// ===== شاشة "إدارة أنواع الطلبات والمستندات المطلوبة" =====
// قائمة أنواع الطلبات الثمانية + مدير مستندات كل نوع (إضافة/تعديل/حذف/ترتيب/إلزامي).
// القراءة والكتابة كلها عبر خدمة RequestTypes (المصدر الموحّد لملف الإعدادات
// الذي يستهلكه تطبيق الطالب) — لا نسخة منفصلة من الإعدادات في هذه الواجهة.
const adminRequestTypesPage = (view) => {
  const state = { selectedId: null, error: "" };

  const ICON_OPTIONS = [
    { value: "file", label: "ملف" },
    { value: "star", label: "نجمة" },
    { value: "award", label: "وسام" },
    { value: "clock", label: "ساعة" },
    { value: "layers", label: "طبقات" },
    { value: "idCard", label: "بطاقة" },
    { value: "alert", label: "تنبيه" },
    { value: "plusCircle", label: "إضافة" },
  ];
  const KIND_OPTIONS = [
    { value: "file", label: "رفع ملف" },
    { value: "text", label: "نص مكتوب" },
    { value: "select", label: "قائمة اختيار" },
  ];
  const KIND_LABEL = { file: "ملف", text: "نص", select: "قائمة اختيار" };

  const render = () => {
    if (state.error) {
      view.innerHTML = pageHead("إدارة أنواع الطلبات والمستندات المطلوبة") +
        `<div class="card">${errorBox("تعذر تحميل ملف الإعدادات", state.error, '<button class="btn primary" id="rt-retry">إعادة المحاولة</button>')}</div>`;
      const retry = $("#rt-retry", view);
      if (retry) retry.onclick = boot;
      return;
    }
    const type = state.selectedId ? RequestTypes.get(state.selectedId) : null;
    if (state.selectedId && !type) state.selectedId = null;
    if (state.selectedId && type) renderDocs(type);
    else renderTypes();
  };

  const boot = () => {
    state.error = "";
    view.innerHTML = pageHead("إدارة أنواع الطلبات والمستندات المطلوبة") + `<div class="card">${skeleton(4)}</div>`;
    RequestTypes.ready()
      .then(() => { state.error = ""; render(); })
      .catch((e) => { state.error = (e && e.message) || "تعذر قراءة data/request-types.json"; render(); });
  };

  // ── قائمة أنواع الطلبات ────────────────────────────────────────────────
  function renderTypes() {
    const types = RequestTypes.list();
    const mandatoryCount = (t) => (t.requirements || []).filter((r) => r.mandatory).length;

    view.innerHTML = pageHead(
      "إدارة أنواع الطلبات والمستندات المطلوبة",
      "المصدر الموحّد الذي يقرأه تطبيق الطالب في شاشة «متطلبات الطلب»",
      `<button class="btn ghost" id="rt-export" type="button">${icon("upload", 15)} تنزيل ملف الإعدادات</button>
       <button class="btn primary" id="rt-add" type="button">${icon("file", 15)} إضافة نوع طلب</button>`,
    ) + `<div class="card" id="rt-table"></div>`;

    $("#rt-add", view).onclick = () => openTypeModal(null);
    $("#rt-export", view).onclick = exportConfig;

    createTable($("#rt-table", view), {
      cols: [
        { title: "نوع الطلب", render: (t) => `<b>${esc(t.name)}</b>` },
        { title: "الوصف", render: (t) => esc(t.description) },
        { title: "المستندات المطلوبة", render: (t) => `${(t.requirements || []).length} مستند · ${mandatoryCount(t)} إلزامي` },
        {
          title: "إجراءات",
          render: (t) => `<div style="display:flex;gap:6px;white-space:nowrap"><button class="btn ghost" type="button" data-rt-docs="${esc(t.id)}">إدارة المستندات</button><button class="btn ghost" type="button" data-rt-edit="${esc(t.id)}">تعديل</button><button class="btn danger" type="button" data-rt-del="${esc(t.id)}">حذف</button></div>`,
        },
      ],
      rows: types,
      search: {
        placeholder: "ابحث باسم نوع الطلب أو الوصف...",
        test: (t, q) => `${t.name} ${t.description}`.toLowerCase().includes(q.toLowerCase()),
      },
      empty: empty("لا توجد أنواع طلبات", 'اضغط "إضافة نوع طلب" لإضافة أول نوع.'),
      onRender: (body) => {
        body.querySelectorAll("[data-rt-docs]").forEach((b) => { b.onclick = () => { state.selectedId = b.dataset.rtDocs; render(); }; });
        body.querySelectorAll("[data-rt-edit]").forEach((b) => { b.onclick = () => { const t = RequestTypes.get(b.dataset.rtEdit); if (t) openTypeModal(t); }; });
        body.querySelectorAll("[data-rt-del]").forEach((b) => { b.onclick = () => { const t = RequestTypes.get(b.dataset.rtDel); if (t) confirmDeleteType(t); }; });
      },
    });
  }

  function confirmDeleteType(t) {
    confirmDlg({
      title: "تأكيد حذف نوع الطلب",
      body: `هل أنت متأكد من حذف نوع الطلب <b>${esc(t.name)}</b>؟ الطلبات المقدَّمة سابقًا لن تتأثر.`,
      danger: true,
      label: "نعم، حذف",
      onOk: () => {
        const res = RequestTypes.remove(t.id);
        if (res && res.ok) { toast("تم حذف نوع الطلب بنجاح."); render(); return; }
        modal(
          `<h2>تعذر الحذف</h2><p>${esc((res && res.error) || "حدث خطأ غير متوقع أثناء الحذف.")}</p>
           <div class="acts"><button class="btn primary" type="button" data-close>موافق</button></div>`,
          (m, close) => { $("[data-close]", m).onclick = close; },
        );
      },
    });
  }

  function openTypeModal(record) {
    modal(
      `<h2>${record ? `تعديل نوع الطلب: ${esc(record.name)}` : "إضافة نوع طلب جديد"}</h2>
       <p>املأ البيانات ثم اضغط حفظ. الاسم هو ما يظهر للطالب في تطبيق الطلبات.</p>
       <div class="field"><label>اسم نوع الطلب</label><input class="input" id="rt-name" type="text" placeholder="مثال: إفادة قيد"><div class="e" id="e-rt-name" role="alert"></div></div>
       <div class="field"><label>وصف نوع الطلب</label><textarea class="input" id="rt-desc" rows="2" placeholder="متى يستخدم الطالب هذا الطلب؟"></textarea><div class="e" id="e-rt-desc" role="alert"></div></div>
       <div class="field"><label>الأيقونة في تطبيق الطالب</label><div id="rt-icon-dd"></div></div>
       <div class="alert bad" id="rt-alert" role="alert" hidden></div>
       <div class="acts"><button class="btn primary" id="rt-save" type="button">${record ? "حفظ التعديلات" : "إضافة"}</button><button class="btn ghost" id="rt-cancel" type="button">إلغاء</button></div>`,
      (m, close) => {
        $("#rt-name", m).value = record ? record.name : "";
        $("#rt-desc", m).value = record ? record.description : "";
        const iconDd = createDropdown($("#rt-icon-dd", m), {
          value: record ? record.iconName : "file",
          options: ICON_OPTIONS,
        });
        $("#rt-cancel", m).onclick = close;
        $("#rt-save", m).onclick = () => {
          ["rt-name", "rt-desc"].forEach((id) => setErr(id, ""));
          const alertEl = $("#rt-alert", m); alertEl.hidden = true;
          const data = { name: $("#rt-name", m).value.trim(), description: $("#rt-desc", m).value.trim(), iconName: iconDd.get() };
          let missing = false;
          if (!data.name) { setErr("rt-name", "اسم نوع الطلب مطلوب."); missing = true; }
          if (!data.description) { setErr("rt-desc", "وصف نوع الطلب مطلوب."); missing = true; }
          if (missing) return;
          const btn = $("#rt-save", m);
          btn.disabled = true; btn.textContent = "جاري الحفظ...";
          setTimeout(() => {
            const res = record ? RequestTypes.update(record.id, data) : RequestTypes.create(data);
            if (res && res.ok) { close(); toast(record ? "تم حفظ التعديلات بنجاح." : "تمت إضافة نوع الطلب بنجاح."); render(); return; }
            btn.disabled = false; btn.textContent = record ? "حفظ التعديلات" : "إضافة";
            if (res && res.errors) {
              let shown = false;
              Object.entries(res.errors).forEach(([k, msg]) => {
                const target = k === "name" ? "rt-name" : k === "description" ? "rt-desc" : null;
                if (target) { setErr(target, msg); shown = true; }
              });
              if (!shown) { alertEl.textContent = "تعذر حفظ البيانات، راجع القيم المدخلة."; alertEl.hidden = false; }
              return;
            }
            alertEl.textContent = (res && res.error) || "تعذر حفظ البيانات، حاول مرة أخرى."; alertEl.hidden = false;
          }, 350);
        };
      },
    );
  }

  function exportConfig() {
    const data = RequestTypes.exportConfig();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "request-types.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("تم تنزيل ملف الإعدادات كنسخة احتياطية. التغييرات تُحفظ محليًا في المصدر الموحّد (localStorage uniway_request_types) الذي تقرأه شاشة الطالب M8 مباشرة.");
  }

  // ── مدير مستندات نوع الطلب ─────────────────────────────────────────────
  function renderDocs(type) {
    const reqs = type.requirements || [];
    const mandatoryCount = reqs.filter((r) => r.mandatory).length;

    view.innerHTML = pageHead(
      type.name,
      `مستندات وبيانات مطلوبة — ${mandatoryCount} إلزامي من ${reqs.length}. الترتيب المعرَض هنا هو ترتيب الظهور في شاشة «متطلبات الطلب» بتطبيق الطالب`,
      `<button class="btn ghost" id="rt-back" type="button">عودة للأنواع</button>
       <button class="btn primary" id="rt-add-doc" type="button">${icon("file", 15)} إضافة مستند</button>`,
    ) +
      (reqs.length
        ? `<div class="card">${reqs.map((r, i) => docRow(type, r, i, reqs.length)).join("")}</div>`
        : `<div class="card">${empty("لا توجد مستندات لهذا النوع", "يمكن للطالب إرسال الطلب دون مستندات. اضغط \"إضافة مستند\" لإضافة المتطلبات.")}</div>`);

    $("#rt-back", view).onclick = () => { state.selectedId = null; render(); };
    $("#rt-add-doc", view).onclick = () => openDocModal(type, null);

    view.querySelectorAll("[data-rd-up]").forEach((b) => { b.onclick = () => { const res = RequestTypes.moveDocument(type.id, b.dataset.rdUp, -1); if (res.ok) render(); }; });
    view.querySelectorAll("[data-rd-down]").forEach((b) => { b.onclick = () => { const res = RequestTypes.moveDocument(type.id, b.dataset.rdDown, 1); if (res.ok) render(); }; });
    view.querySelectorAll("[data-rd-edit]").forEach((b) => { b.onclick = () => { const r = (RequestTypes.get(type.id).requirements || []).find((x) => x.id === b.dataset.rdEdit); if (r) openDocModal(type, r); }; });
    view.querySelectorAll("[data-rd-del]").forEach((b) => {
      b.onclick = () => {
        const r = (RequestTypes.get(type.id).requirements || []).find((x) => x.id === b.dataset.rdDel);
        if (!r) return;
        confirmDlg({
          title: "تأكيد حذف المستند",
          body: `هل أنت متأكد من حذف المستند <b>${esc(r.name)}</b> من نوع الطلب «${esc(type.name)}»؟ الطلبات المقدَّمة سابقًا ومرفقاتها لن تتأثر.`,
          danger: true,
          label: "نعم، حذف",
          onOk: () => {
            const res = RequestTypes.removeDocument(type.id, r.id);
            if (res && res.ok) { toast("تم حذف المستند من نوع الطلب."); render(); return; }
            modal(
              `<h2>تعذر الحذف</h2><p>${esc((res && res.error) || "حدث خطأ غير متوقع أثناء الحذف.")}</p>
               <div class="acts"><button class="btn primary" type="button" data-close>موافق</button></div>`,
              (m2, close2) => { $("[data-close]", m2).onclick = close2; },
            );
          },
        });
      };
    });
  }

  const docRow = (type, r, i, total) =>
    `<div style="display:flex;gap:10px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--line)">
      <b style="min-width:22px;color:var(--mut)">${i + 1}.</b>
      <div style="flex:1;min-width:0">
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><b style="font-size:13px">${esc(r.name)}</b>${badge(r.mandatory ? "إلزامي" : "اختياري", r.mandatory ? "red" : "gray")}${badge(KIND_LABEL[r.kind] || r.kind, "blue")}</div>
        <div style="font-size:11.5px;color:var(--mut);margin-top:3px">${esc(r.hint)}${r.kind === "select" && r.options ? ` — الخيارات: ${esc(r.options.join("، "))}` : ""}</div>
      </div>
      <div style="display:flex;gap:6px;white-space:nowrap">
        <button class="btn ghost" type="button" data-rd-up="${esc(r.id)}" ${i === 0 ? "disabled" : ""} aria-label="تحريك لأعلى">↑</button>
        <button class="btn ghost" type="button" data-rd-down="${esc(r.id)}" ${i === total - 1 ? "disabled" : ""} aria-label="تحريك لأسفل">↓</button>
        <button class="btn ghost" type="button" data-rd-edit="${esc(r.id)}">تعديل</button>
        <button class="btn danger" type="button" data-rd-del="${esc(r.id)}">حذف</button>
      </div>
    </div>`;

  function openDocModal(type, record) {
    modal(
      `<h2>${record ? `تعديل المستند: ${esc(record.name)}` : `إضافة مستند إلى «${esc(type.name)}»`}</h2>
       <p>الإلزامي يعني أن الطالب يجب تقديمه قبل إرسال الطلب، والاختياري يمكن إرسال الطلب دونه.</p>
       <div class="field"><label>اسم المستند / البيان</label><input class="input" id="rd-name" type="text" placeholder="مثال: صورة بطاقة الرقم القومي"><div class="e" id="e-rd-name" role="alert"></div></div>
       <div class="field"><label>نوع الحقل في تطبيق الطالب</label><div id="rd-kind-dd"></div><div class="e" id="e-rd-kind" role="alert"></div></div>
       <div class="field"><label>نص التوضيح للطالب</label><input class="input" id="rd-hint" type="text" placeholder="مثال: صورة واضحة للوجهين"><div class="e" id="e-rd-hint" role="alert"></div></div>
       <div class="field" id="rd-options-wrap"><label>خيارات القائمة (مفصولة بفاصلة)</label><input class="input" id="rd-options" type="text" dir="rtl" placeholder="خيار أول، خيار ثاني"><div class="e" id="e-rd-options" role="alert"></div></div>
       <div class="field"><label>الإلزامية</label><label class="chk lg"><input type="checkbox" id="rd-mand"><span class="box"></span></label><div class="h">إلزامي: يجب على الطالب تقديمه قبل إرسال الطلب — اختياري: يمكن إرسال الطلب بدونه.</div></div>
       <div class="alert bad" id="rd-alert" role="alert" hidden></div>
       <div class="acts"><button class="btn primary" id="rd-save" type="button">${record ? "حفظ التعديلات" : "إضافة"}</button><button class="btn ghost" id="rd-cancel" type="button">إلغاء</button></div>`,
      (m, close) => {
        $("#rd-name", m).value = record ? record.name : "";
        $("#rd-hint", m).value = record ? record.hint : "";
        $("#rd-mand", m).checked = record ? record.mandatory === true : true;
        $("#rd-options", m).value = record && record.options ? record.options.join("، ") : "";
        let kind = record ? record.kind : "file";
        const kindDd = createDropdown($("#rd-kind-dd", m), {
          value: kind,
          options: KIND_OPTIONS,
          onChange: (v) => { kind = v; syncOptions(); },
        });
        const syncOptions = () => { $("#rd-options-wrap", m).style.display = kind === "select" ? "" : "none"; };
        syncOptions();
        $("#rd-cancel", m).onclick = close;
        $("#rd-save", m).onclick = () => {
          ["rd-name", "rd-hint", "rd-kind", "rd-options"].forEach((id) => setErr(id, ""));
          const alertEl = $("#rd-alert", m); alertEl.hidden = true;
          const data = {
            name: $("#rd-name", m).value.trim(),
            hint: $("#rd-hint", m).value.trim(),
            kind,
            mandatory: $("#rd-mand", m).checked,
            options: kind === "select" ? $("#rd-options", m).value.split(/[,،]/).map((s) => s.trim()).filter(Boolean) : null,
          };
          let missing = false;
          if (!data.name) { setErr("rd-name", "اسم المستند مطلوب."); missing = true; }
          if (!data.hint) { setErr("rd-hint", "نص التوضيح مطلوب."); missing = true; }
          if (!missing) {
            const btn = $("#rd-save", m);
            btn.disabled = true; btn.textContent = "جاري الحفظ...";
            setTimeout(() => {
              const res = record ? RequestTypes.updateDocument(type.id, record.id, data) : RequestTypes.addDocument(type.id, data);
              if (res && res.ok) { close(); toast(record ? "تم حفظ التعديلات بنجاح." : "تمت إضافة المستند بنجاح."); render(); return; }
              btn.disabled = false; btn.textContent = record ? "حفظ التعديلات" : "إضافة";
              if (res && res.errors) {
                let shown = false;
                Object.entries(res.errors).forEach(([k, msg]) => {
                  const target = { name: "rd-name", hint: "rd-hint", kind: "rd-kind", options: "rd-options" }[k];
                  if (target) { setErr(target, msg); shown = true; }
                });
                if (!shown) { alertEl.textContent = "تعذر حفظ البيانات، راجع القيم المدخلة."; alertEl.hidden = false; }
                return;
              }
              alertEl.textContent = (res && res.error) || "تعذر حفظ البيانات، حاول مرة أخرى."; alertEl.hidden = false;
            }, 350);
          }
        };
      },
    );
  }

  boot();
};

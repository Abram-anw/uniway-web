// ===== crudPage: قالب إدارة CRUD المشترك (قائمة + نموذج إضافة/تعديل + تأكيد حذف) =====
// كل شاشات إدارة الكيانات تستخدم نفس القالب عبر كائن إعدادات (config) يحدد:
//   title / subtitle: عناوين الصفحة
//   store: مخزن Catalog الموحّد (list/get/create/update/remove)
//   idKey: اسم حقل المعرف (code للمقررات مثلًا)
//   columns: أعمدة الجدول (بنفس صيغة createTable)
//   fields: حقول النموذج { key, label, type: text|number|textarea|select|checkbox,
//                          required, dir, min, max, placeholder, hint, options(), readOnlyOnEdit }
//   rowLabel(rec): وسم السجل في رسائل الحذف/التعديل
//   search: { placeholder, test } للبحث في القائمة
//   validate(data, {isEdit, record}): تحقق إضافي خاص بالكيان → أخطاء { field: message }
// منطق العرض والعمليات المشتركة كلها هنا؛ تعديل القالب يُطبق على الشاشات السبع كلها.
const crudPage = (view, cfg) => {
  if (!cfg || !cfg.store) {
    view.innerHTML = errorBox("الشاشة غير مكتملة", "لم يتم تحديد إعدادات الإدارة لهذه الصفحة.");
    return;
  }

  const state = { loading: true, error: "" };

  const renderList = () => {
    if (state.loading) {
      view.innerHTML = pageHead(cfg.title, cfg.subtitle) + `<div class="card">${skeleton(4)}</div>`;
      return;
    }
    if (state.error) {
      view.innerHTML = pageHead(cfg.title, cfg.subtitle) +
        `<div class="card">${errorBox("تعذر تحميل البيانات", state.error, '<button class="btn primary" id="crud-retry">إعادة المحاولة</button>')}</div>`;
      const retry = $("#crud-retry", view);
      if (retry) retry.onclick = load;
      return;
    }

    let rows;
    try { rows = cfg.store.list(); } catch (e) { state.error = e.message; renderList(); return; }

    view.innerHTML = pageHead(cfg.title, cfg.subtitle, `<button class="btn primary" id="crud-add" type="button">${icon("file", 15)} إضافة جديد</button>`) +
      `<div class="card" id="crud-table"></div>`;

    const addBtn = $("#crud-add", view);
    if (addBtn) addBtn.onclick = () => openForm(null);

    createTable($("#crud-table", view), {
      cols: [
        ...cfg.columns,
        {
          title: "إجراءات",
          render: (r) => {
            if (cfg.rowActions) return cfg.rowActions(r);
            return `<div style="display:flex;gap:6px;white-space:nowrap"><button class="btn ghost" type="button" data-crud-edit="${esc(r[cfg.idKey])}">تعديل</button><button class="btn danger" type="button" data-crud-del="${esc(r[cfg.idKey])}">حذف</button></div>`;
          },
        },
      ],
      rows,
      search: cfg.search || undefined,
      empty: empty(cfg.emptyTitle || "لا توجد سجلات بعد", cfg.emptyBody || 'اضغط "إضافة جديد" لإضافة أول سجل.'),
      onRender: (body) => {
        body.querySelectorAll("[data-crud-view]").forEach((b) => {
          b.onclick = () => {
            const rec = cfg.store.get(b.dataset.crudView);
            if (rec && cfg.onView) cfg.onView(rec);
          };
        });
        body.querySelectorAll("[data-crud-edit]").forEach((b) => {
          b.onclick = () => { const rec = cfg.store.get(b.dataset.crudEdit); if (rec) openForm(rec); };
        });
        body.querySelectorAll("[data-crud-del]").forEach((b) => {
          b.onclick = () => { const rec = cfg.store.get(b.dataset.crudDel); if (rec) confirmDelete(rec); };
        });
      },
    });
  };

  // تحميل أولي — حالة تحميل ثم قراءة البيانات من المخزن
  const load = () => {
    state.loading = true; state.error = "";
    renderList();
    setTimeout(() => {
      try { cfg.store.list(); state.loading = false; }
      catch (e) { state.error = e.message; }
      renderList();
    }, 250);
  };

  const openForm = (record) => {
    const isEdit = !!record;

    const fieldsHtml = cfg.fields.map((f) => {
      let inner;
      const dir = f.dir ? ` dir="${f.dir}"` : "";
      const af = f.autofocus ? " autofocus" : "";
      if (f.type === "select") inner = `<div id="f-${f.key}"></div>`;
      else if (f.type === "textarea") inner = `<textarea class="input" id="f-${f.key}" rows="3"${dir}${af} placeholder="${f.placeholder || ""}"></textarea>`;
      else if (f.type === "checkbox") inner = chk(`id="f-${f.key}"`);
      else inner = `<input class="input" id="f-${f.key}" type="${f.type === "number" ? "number" : "text"}"${f.min != null ? ` min="${f.min}"` : ""}${f.max != null ? ` max="${f.max}"` : ""}${dir}${af} placeholder="${f.placeholder || ""}">`;
      const lockHint = isEdit && f.readOnlyOnEdit && !f.hint ? "هذا الحقل لا يمكن تغييره بعد الإنشاء." : "";
      return field(f.label, inner + (f.hint || lockHint ? `<div class="h">${f.hint || lockHint}</div>` : ""), f.key);
    }).join("");

    modal(
      `<h2>${isEdit ? `تعديل: ${esc(cfg.rowLabel(record))}` : cfg.formTitle || "إضافة سجل جديد"}</h2>
       <p>${cfg.formSubtitle || "املأ البيانات المطلوبة ثم اضغط حفظ."}</p>
       ${fieldsHtml}
       <div class="alert bad" id="crud-alert" role="alert" hidden></div>
       <div class="acts">
         <button class="btn primary" id="crud-save" type="button">${isEdit ? "حفظ التعديلات" : "إضافة"}</button>
         <button class="btn ghost" id="crud-cancel" type="button">إلغاء</button>
       </div>`,
      (m, close) => {
        const controls = {};
        cfg.fields.forEach((f) => {
          const el = $(`#f-${f.key}`, m);
          if (!el) return;
          if (f.type === "select") {
            controls[f.key] = createDropdown(el, {
              options: f.options ? f.options() : [],
              value: record ? String(record[f.key] == null ? "" : record[f.key]) : (f.default != null ? String(f.default) : ""),
              placeholder: f.placeholder || "اختر",
            });
          } else if (f.type === "checkbox") {
            el.checked = record ? record[f.key] === true : f.default === true;
          } else if (record) {
            el.value = record[f.key] == null ? "" : record[f.key];
          } else if (f.default != null) {
            el.value = f.default;
          }
          if (isEdit && f.readOnlyOnEdit) el.disabled = true;
          else {
            el.disabled = false;
            el.readOnly = false;
            el.tabIndex = 0;
          }
        });

        const showAlert = (msg) => {
          const a = $("#crud-alert", m);
          a.textContent = msg; a.hidden = false;
        };
        const clearAll = () => {
          cfg.fields.forEach((f) => setErr(f.key, ""));
          const a = $("#crud-alert", m); a.hidden = true;
        };

        $("#crud-cancel", m).onclick = close;

        $("#crud-save", m).onclick = () => {
          clearAll();
          const data = {};
          let missing = false;
          cfg.fields.forEach((f) => {
            if (isEdit && f.readOnlyOnEdit) { data[f.key] = record[f.key]; return; }
            const el = $(`#f-${f.key}`, m);
            let v;
            if (f.type === "select") v = controls[f.key] ? controls[f.key].get() : "";
            else if (f.type === "checkbox") v = el.checked;
            else if (f.type === "number") v = el.value.trim() === "" ? "" : Number(el.value);
            else v = el.value.trim();
            if (f.required && (v === "" || v == null)) {
              setErr(f.key, f.requiredMessage || "هذا الحقل مطلوب.");
              missing = true;
            }
            data[f.key] = v;
          });
          if (!missing && cfg.validate) {
            const errs = cfg.validate(data, { isEdit, record });
            if (errs) {
              Object.entries(errs).forEach(([k, msg]) => setErr(k, msg));
              return;
            }
          }
          if (missing) return;

          const saveBtn = $("#crud-save", m);
          saveBtn.disabled = true;
          saveBtn.textContent = "جاري الحفظ...";
          setTimeout(() => {
            const res = isEdit ? cfg.store.update(record[cfg.idKey], data) : cfg.store.create(data);
            if (res && res.ok) {
              close();
              toast(isEdit ? "تم حفظ التعديلات بنجاح." : "تمت الإضافة بنجاح.");
              renderList();
              return;
            }
            saveBtn.disabled = false;
            saveBtn.textContent = isEdit ? "حفظ التعديلات" : "إضافة";
            if (res && res.errors) {
              let shown = false;
              Object.entries(res.errors).forEach(([k, msg]) => {
                if ($(`#e-${k}`, m)) { setErr(k, msg); shown = true; }
              });
              if (!shown) showAlert(res.errors._ || "تعذر حفظ البيانات، راجع القيم المدخلة.");
              return;
            }
            showAlert((res && res.error) || "تعذر حفظ البيانات، حاول مرة أخرى.");
          }, 350);
        };
      },
    );
  };

  const confirmDelete = (record) => {
    confirmDlg({
      title: "تأكيد حذف السجل",
      body: `هل أنت متأكد من حذف <b>${esc(cfg.rowLabel(record))}</b>؟ لا يمكن التراجع عن هذا الإجراء.`,
      danger: true,
      label: "نعم، حذف",
      onOk: () => {
        const res = cfg.store.remove(record[cfg.idKey]);
        if (res && res.ok) {
          toast("تم حذف السجل بنجاح.");
          renderList();
          return;
        }
        modal(
          `<h2>تعذر الحذف</h2><p>${esc((res && res.error) || "حدث خطأ غير متوقع أثناء الحذف.")}</p>
           <div class="acts"><button class="btn primary" type="button" data-close>موافق</button></div>`,
          (m2, close2) => { $("[data-close]", m2).onclick = close2; },
        );
      },
    });
  };

  load();
};

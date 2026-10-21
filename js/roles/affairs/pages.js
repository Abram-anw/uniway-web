const requestDocumentStatusMeta = {
  pending: { label: "قيد المراجعة", tone: "amber" },
  accepted: { label: "مقبول", tone: "green" },
  rejected: { label: "مرفوض", tone: "red" },
};

const addTimelineEvent = (request, title, actor = "نظام") => {
  request.timeline.push({
    title,
    time: new Date().toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    actor,
  });
};

const getRequestById = (requestId) => studentRequests.find((item) => item.id === requestId);

const renderDocumentPreviewModal = (documentItem) => {
  const filename = documentItem.fileName || "إرفاق غير متوفر";
  const previewBody = documentItem.fileType === "image"
    ? `<div class="card" style="padding:18px;background:var(--bg);display:grid;place-items:center"><div style="padding:32px;border-radius:16px;background:#fff;border:1px solid var(--line);width:100%;max-width:420px;text-align:center"><div class="ico blue" style="margin:0 auto 12px">${icon("file", 26)}</div><b>${esc(filename)}</b><small style="display:block;color:var(--mut);margin-top:8px">معاينة الملف غير متاحة مباشرة في هذا العرض التجريبي. يمكن تنزيل الملف من مصدر الرفع الحالي.</small></div></div>`
    : `<div class="card" style="padding:18px;background:var(--bg)"><div class="state" style="padding:24px 12px"><div class="ico blue">${icon("file", 24)}</div><b>${esc(filename)}</b><small style="display:block;color:var(--sub)">نوع الملف: ${esc(documentItem.type || "مستند")}</small><div style="margin-top:18px"><a href="#" class="btn primary" onclick="event.preventDefault();">تحميل الملف</a></div></div></div>`;

  modal(
    `<h2>معاينة المستند</h2><p>${esc(documentItem.name || documentItem.type || "مستند")}</p>${previewBody}<div class="acts"><button class="btn ghost" data-close>إغلاق</button></div>`,
    (m, close) => {
      const closeBtn = $('[data-close]', m);
      closeBtn.onclick = close;
    },
  );
};

const renderRequestStatusSummary = (request) => {
  const approvedDocs = request.documents.filter((doc) => doc.status === "accepted").length;
  const rejectedDocs = request.documents.filter((doc) => doc.status === "rejected").length;
  const pendingDocs = request.documents.filter((doc) => doc.status === "pending").length;

  return `
    <div class="grid g3">
      ${stat("نوع الطلب", request.category, "clipboard", "blue")}
      ${stat("عدد المستندات", request.documents.length, "file", "amber")}
      ${stat("الحالة", requestStatusMeta[request.status].label, "check", requestStatusMeta[request.status].tone)}
    </div>
    <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:10px">
      ${badge(`مقبولة: ${approvedDocs}`, "green")}
      ${badge(`مرفوضة: ${rejectedDocs}`, "red")}
      ${badge(`قيد المراجعة: ${pendingDocs}`, "amber")}
    </div>
  `;
};

const getAdmissionById = (id) => highSchoolApplications.find((app) => app.id === id);
const getGradeAppealById = (id) => gradeAppeals.find((item) => item.id === id);

const renderAdmissionDetailPage = (view, [id]) => {
  const application = getAdmissionById(id);
  if (!application) {
    view.innerHTML =
      pageHead("تفاصيل الطلب", "الطلب المحدد غير موجود") +
      `<div class="card">${errorBox("لم يتم العثور على الطلب", "تأكد من رقم الطلب أو عد إلى قائمة الطلبات.", '<a class="btn primary" href="admissions.html">العودة إلى قائمة الطلبات</a>')}</div>`;
    return;
  }

  const info = [
    { label: "اسم الطالب", value: application.studentName },
    { label: "الرقم القومي", value: application.nationalId },
    { label: "بطاقة الترشيح", value: application.nominationCardName },
    { label: "رقم الطلب", value: application.applicationNumber },
    { label: "تاريخ التقديم", value: application.submittedAt },
    { label: "الحالة الحالية", value: admissionStatusMeta[application.status].label },
  ];

  view.innerHTML =
    pageHead(application.applicationNumber, `طلب قبول • ${application.studentName}`, '<a class="btn ghost" href="admissions.html">رجوع</a>') +
    `<div class="card" style="margin-bottom:16px">${badge(admissionStatusMeta[application.status].label, admissionStatusMeta[application.status].tone)}</div>
    <div class="grid g2">
      <div class="card">
        <h3>معلومات الطالب والطلب</h3>
        <div class="list">
          ${info
            .map(
              (item) => `
                <div class="li" style="padding:10px 0">
                  <div class="grow">
                    <b>${item.label}</b>
                    <small>${esc(item.value)}</small>
                  </div>
                  ${item.label === "بطاقة الترشيح" ? '<button class="btn ghost" data-open-card>عرض البطاقة</button>' : ""}
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
      <div class="card">
        <h3>إجراءات المراجعة</h3>
        <div class="list">
          <div class="li" style="padding:12px 0">
            <div class="grow"><b>قبول الطلب</b><small>اعتماد الطلب النهائي.</small></div>
            <button class="btn primary" data-accept-app>قبول</button>
          </div>
          <div class="li" style="padding:12px 0">
            <div class="grow"><b>رفض الطلب</b><small>تسجيل سبب الرفض في السجل.</small></div>
            <button class="btn danger" data-reject-app>رفض</button>
          </div>
          <div class="li" style="padding:12px 0">
            <div class="grow"><b>طلب معلومات إضافية</b><small>توضيح أو مستندات إضافية.</small></div>
            <button class="btn outline" data-request-info-app>طلب معلومات</button>
          </div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <h3>سجل الطلب</h3>
      <div class="list">
        ${application.history
          .map(
            (event) => `
              <div class="li" style="padding:10px 0">
                <span class="ico blue">${icon("check", 16)}</span>
                <div class="grow">
                  <b>${esc(event.title)}</b>
                  <small>${event.actor} • ${event.time}</small>
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>`;

  $(`[data-open-card]`, view).onclick = () => renderNominationCardModal(application);

  $(`[data-accept-app]`, view).onclick = () => {
    confirmDlg({
      title: "قبول الطلب",
      body: `هل أنت متأكد من قبول طلب القبول رقم ${application.applicationNumber}؟`,
      label: "قبول الطلب",
      onOk: () => {
        updateAdmissionStatus(application, "accepted", "تم قبول طلب القبول", "موظف شؤون الطلاب");
        renderAdmissionDetailPage(view, [application.id]);
      },
    });
  };

  $(`[data-reject-app]`, view).onclick = () => {
    modal(
      `<h2>رفض الطلب</h2><p>يرجى كتابة سبب الرفض قبل الحفظ.</p>${field("سبب الرفض", '<textarea class="input" id="app-reject-reason"></textarea>', "app-reject-reason")}<div class="acts"><button class="btn danger ok">حفظ الرفض</button><button class="btn ghost no">إلغاء</button></div>`,
      (m, close) => {
        const reasonInput = $('#app-reject-reason', m);
        const okBtn = $('.ok', m);
        const noBtn = $('.no', m);
        okBtn.onclick = () => {
          const reason = (reasonInput.value || "").trim();
          if (!reason) {
            setErr("app-reject-reason", "سبب الرفض مطلوب ولا يمكن أن يكون فارغًا.");
            return;
          }
          updateAdmissionStatus(application, "rejected", "تم رفض طلب القبول", "موظف شؤون الطلاب", { reason });
          close();
          renderAdmissionDetailPage(view, [application.id]);
        };
        noBtn.onclick = close;
      },
    );
  };

  $(`[data-request-info-app]`, view).onclick = () => {
    modal(
      `<h2>طلب معلومات إضافية</h2><p>اكتب ما يلزم من معلومات أو مستندات إضافية.</p>${field("المطلوب", '<textarea class="input" id="app-info-request"></textarea>', "app-info-request")}<div class="acts"><button class="btn primary ok">إرسال الطلب</button><button class="btn ghost no">إلغاء</button></div>`,
      (m, close) => {
        const input = $('#app-info-request', m);
        const okBtn = $('.ok', m);
        const noBtn = $('.no', m);
        okBtn.onclick = () => {
          const explanation = (input.value || "").trim();
          if (!explanation) {
            setErr("app-info-request", "يجب إدخال شرح المعلومات المطلوب إكمالها.");
            return;
          }
          updateAdmissionStatus(application, "missing_info", "تم طلب معلومات إضافية", "موظف شؤون الطلاب", { infoRequest: explanation });
          close();
          renderAdmissionDetailPage(view, [application.id]);
        };
        noBtn.onclick = close;
      },
    );
  };
};

const renderNominationCardModal = (application) => {
  const cardName = application.nominationCardName || "بطاقة الترشيح غير موجودة";
  modal(
    `<h2>بطاقة الترشيح</h2><p>${esc(application.studentName)}</p><div class="card" style="padding:18px;background:var(--bg)"><div class="state" style="padding:24px 12px"><div class="ico blue">${icon("file", 26)}</div><b>${esc(cardName)}</b><small style="display:block;color:var(--sub);margin-top:8px">يمكن معاينة الملف في واجهة الرفع أو تنزيله من المصدر الموثوق إذا كان النوع غير مدعوم داخل المتصفح.</small><div style="margin-top:16px"><button class="btn primary" data-download>تحميل الملف</button></div></div></div><div class="acts"><button class="btn ghost" data-close>إغلاق</button></div>`,
    (m, close) => {
      $('[data-close]', m).onclick = close;
      $('[data-download]', m).onclick = () => alert("تحميل الملف يتم عبر مصدر المستند المرفوع للمستخدم الحالي.");
    },
  );
};

const affairsAdmissionsPage = (view, _p, query = {}) => {
  const selectedStatus = query.status || "";
  const filtered = highSchoolApplications.filter((app) => (!selectedStatus || app.status === selectedStatus));

  useTemplate(view, "affairs-admissions-template");
  const statusIcons = {
    new: "users",
    accepted: "check",
    rejected: "alert",
    missing_info: "file",
    pending: "clipboard",
  };
  const statusContainer = $("[data-admission-statuses]", view);
  Object.entries(admissionStatusMeta).forEach(([key, meta]) => {
    const link = document.createElement("a");
    link.href = `admissions.html?status=${encodeURIComponent(key)}`;
    link.className = "card link";
    link.style.cssText = "padding:14px;min-height:88px";
    const iconElement = document.createElement("span");
    iconElement.className = `ico ${meta.tone}`;
    iconElement.style.cssText = "width:34px;height:34px";
    iconElement.innerHTML = icon(statusIcons[key] || "clipboard", 18);
    const details = document.createElement("span");
    details.style.cssText = "flex:1;min-width:0";
    const title = document.createElement("b");
    title.style.cssText = "display:block;font-size:13px;margin-bottom:4px";
    title.textContent = meta.label;
    const count = document.createElement("small");
    count.style.color = "var(--mut)";
    count.textContent = `${highSchoolApplications.filter((app) => app.status === key).length} طلب`;
    details.append(title, count);
    link.append(iconElement, details);
    statusContainer.append(link);
  });

  createTable($("[data-admissions-table]", view), {
    cols: [
      { title: "اسم الطالب", render: (app) => app.studentName },
      { title: "رقم الطلب", render: (app) => `<b>${app.applicationNumber}</b>` },
      { title: "تاريخ التقديم", render: (app) => app.submittedAt },
      { title: "الحالة", render: (app) => badge(admissionStatusMeta[app.status].label, admissionStatusMeta[app.status].tone) },
    ],
    rows: filtered,
    onRow: (app) => go(`admission-detail.html?id=${app.id}`),
    search: {
      placeholder: "ابحث بالاسم أو رقم الطلب...",
      test: (app, q) => `${app.studentName} ${app.applicationNumber}`.toLowerCase().includes(q.toLowerCase()),
    },
    filter: {
      label: "فلتر الحالة",
      options: Object.entries(admissionStatusMeta).map(([key, meta]) => ({ value: key, label: meta.label })),
      test: (app, v) => app.status === v,
    },
    empty: empty("لا توجد طلبات قبول", "لا توجد طلبات تفي بالشروط الحالية."),
  });
};

const renderGradeAppealDetailPage = (view, [id]) => {
  const appeal = getGradeAppealById(id);
  if (!appeal) {
    view.innerHTML =
      pageHead("تفاصيل الاستئناف", "الاستئناف المحدد غير موجود") +
      `<div class="card">${errorBox("لا توجد بيانات للاستئناف", "تأكد من رقم الاستئناف أو عد إلى قائمة الاستئنافات.", '<a class="btn primary" href="grade-appeals.html">العودة إلى الاستئنافات</a>')}</div>`;
    return;
  }

  const info = [
    { label: "الاسم", value: appeal.studentName },
    { label: "المقرر", value: appeal.course },
    { label: "نوع الامتحان", value: appeal.examType },
    { label: "الدرجة", value: `${appeal.grade}` },
    { label: "السبب", value: appeal.reason },
    { label: "المرفقات", value: appeal.attachments.map((file) => file.name).join(", ") || "لا توجد مرفقات" },
  ];

  view.innerHTML =
    pageHead(appeal.id, `استئناف • ${appeal.studentName}`, '<a class="btn ghost" href="grade-appeals.html">رجوع</a>') +
    `<div class="card" style="margin-bottom:16px">${badge(appealStatusMeta[appeal.status].label, appealStatusMeta[appeal.status].tone)}</div>
    <div class="grid g2">
      <div class="card">
        <h3>تفاصيل الاستئناف</h3>
        <div class="list">
          ${info
            .map(
              (entry) => `
                <div class="li" style="padding:10px 0">
                  <div class="grow">
                    <b>${entry.label}</b>
                    <small>${esc(entry.value)}</small>
                  </div>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
      <div class="card">
        <h3>تحديث الحالة</h3>
        <div class="list">
          ${Object.entries(appealStatusMeta)
            .map(
              ([key, meta]) => `
                <div class="li" style="padding:10px 0">
                  <div class="grow"><b>${meta.label}</b><small>تحديث الحالة الحالية للاستئناف.</small></div>
                  <button class="btn ${key === "accepted" ? "primary" : key === "rejected" ? "danger" : "outline"}" data-appeal-status="${key}">${meta.label}</button>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    </div>
    <div class="grid g2" style="margin-top:16px">
      <div class="card">
        <h3>الدردشة</h3>
        <div class="scroll" style="height:260px;overflow:auto;border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--bg);margin-bottom:12px">
          ${appeal.messages.length ? appeal.messages.map((msg) => `
            <div class="bub ${msg.from === "employee" ? "me" : ""}">
              <b>${msg.sender}</b>
              <div>${esc(msg.text)}</div>
              <small>${msg.time}</small>
            </div>
          `).join("") : `<div class="state" style="padding:20px 10px">${empty("لا توجد رسائل", "ابدأ مراسلة الطالب في هذا الاستئناف.")}</div>`}
        </div>
        <div class="compose">
          <input class="input" id="appeal-chat-msg" placeholder="اكتب رسالة للطالب..." />
          <button class="btn primary" id="send-appeal-msg">إرسال</button>
        </div>
      </div>
      <div class="card">
        <h3>سجل الاستئناف</h3>
        <div class="list">
          ${appeal.history
            .map(
              (event) => `
                <div class="li" style="padding:10px 0">
                  <span class="ico blue">${icon("check", 16)}</span>
                  <div class="grow">
                    <b>${esc(event.title)}</b>
                    <small>${event.actor} • ${event.time}</small>
                  </div>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    </div>`;

  Object.entries(appealStatusMeta).forEach(([key, meta]) => {
    const button = $(`[data-appeal-status="${key}"]`, view);
    if (!button) return;
    button.onclick = () => {
      if (key === "rejected" || key === "needs_info") {
        const title = key === "rejected" ? "رفض الاستئناف" : "طلب معلومات إضافية";
        modal(
          `<h2>${title}</h2><p>يرجى إدخال سبب القرار.</p>${field("السبب", '<textarea class="input" id="appeal-action-reason"></textarea>', "appeal-action-reason")}<div class="acts"><button class="btn primary ok">حفظ</button><button class="btn ghost no">إلغاء</button></div>`,
          (m, close) => {
            const reasonInput = $('#appeal-action-reason', m);
            const okBtn = $('.ok', m);
            const noBtn = $('.no', m);
            okBtn.onclick = () => {
              const reason = (reasonInput.value || "").trim();
              if (!reason) {
                setErr("appeal-action-reason", "سبب القرار مطلوب ولا يمكن أن يكون فارغًا.");
                return;
              }
              updateGradeAppealStatus(appeal, key, key === "rejected" ? "تم رفض الاستئناف" : "تم طلب معلومات إضافية", "موظف شؤون الطلاب", { reason });
              close();
              renderGradeAppealDetailPage(view, [appeal.id]);
            };
            noBtn.onclick = close;
          },
        );
        return;
      }

      updateGradeAppealStatus(appeal, key, "تم تحديث حالة الاستئناف", "موظف شؤون الطلاب");
      renderGradeAppealDetailPage(view, [appeal.id]);
    };
  });

  $('#send-appeal-msg', view).onclick = () => {
    const value = ($('#appeal-chat-msg', view).value || "").trim();
    if (!value) return;
    appeal.messages.push({
      from: "employee",
      sender: "موظف شؤون الطلاب",
      text: value,
      time: new Date().toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }),
    });
    appeal.history.unshift({
      title: "تم إرسال رسالة للاستئناف",
      time: new Date().toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }),
      actor: "موظف شؤون الطلاب",
    });
    $('#appeal-chat-msg', view).value = "";
    renderGradeAppealDetailPage(view, [appeal.id]);
  };
};

const affairsGradeAppealsPage = (view) => {
  useTemplate(view, "affairs-grade-appeals-template");

  $("h1", view).textContent = "استئنافات الطلاب";
  $("p", view).textContent = "مراجعة طلبات إعادة النظر في الدرجات وإدارة الحالة";
  createTable($("[data-appeals-table]", view), {
    cols: [
      { title: "اسم الطالب", render: (item) => item.studentName },
      { title: "رقم الاستئناف", render: (item) => `<b>${item.id}</b>` },
      { title: "المقرر", render: (item) => item.course },
      { title: "تاريخ التقديم", render: (item) => item.submittedAt },
      { title: "الحالة", render: (item) => badge(appealStatusMeta[item.status].label, appealStatusMeta[item.status].tone) },
    ],
    rows: gradeAppeals,
    onRow: (item) => go(`grade-appeal-detail.html?id=${item.id}`),
    search: {
      placeholder: "ابحث بالاسم أو المقرر أو رقم الاستئناف...",
      test: (item, q) => `${item.studentName} ${item.course} ${item.id}`.toLowerCase().includes(q.toLowerCase()),
    },
    empty: empty("لا توجد استئنافات", "لا توجد طلبات استئناف حالياً."),
  });
};

const affairsAdmissionDetailPage = (view, [id]) => renderAdmissionDetailPage(view, [id]);
const affairsGradeAppealDetailPage = (view, [id]) => renderGradeAppealDetailPage(view, [id]);

const studentSearchRows = (query = "") => {
  const value = (query || "").trim().toLowerCase();
  if (!value) return students.slice();
  return students.filter((student) => `${student.name} ${student.id}`.toLowerCase().includes(value));
};

const affairsStudentSearchPage = (view) => {
  const rows = studentSearchRows();
  useTemplate(view, "affairs-student-search-template");

  createTable($("[data-student-search-table]", view), {
    cols: [
      { title: "اسم الطالب", render: (student) => student.name },
      { title: "كود الطالب", render: (student) => `<b>${student.id}</b>` },
      { title: "المقرر", render: (student) => student.course },
      { title: "البريد الإلكتروني", render: (student) => student.email },
    ],
    rows,
    search: {
      placeholder: "ابحث باسم الطالب أو كود الطالب...",
      test: (student, q) => `${student.name} ${student.id}`.toLowerCase().includes(q.toLowerCase()),
    },
    onRow: (student) => go(`student-detail.html?id=${student.id}`),
    empty: empty("لا توجد نتائج", "لا يوجد طلاب مطابقون لبحثك الحالي."),
  });
};

const affairsStudentDetailPage = (view, [studentId]) => {
  const student = studentById(studentId);
  if (!student) {
    view.innerHTML =
      pageHead("بيانات الطالب", "الطالب المطلوب غير موجود") +
      `<div class="card">${errorBox("لم يتم العثور على هذا الطالب", "تأكد من كود الطالب أو عد إلى شاشة البحث.", '<a class="btn primary" href="students.html">العودة إلى البحث</a>')}</div>`;
    return;
  }

  const relatedThreads = threads.filter((thread) => thread.sid === student.id);
  const unreadTotal = relatedThreads.reduce((sum, thread) => sum + (thread.unread || 0), 0);
  const studentInfo = [
    { label: "اسم الطالب", value: student.name },
    { label: "كود الطالب", value: student.id },
    { label: "المقرر", value: student.course },
    { label: "البريد الإلكتروني", value: student.email },
  ];

  useTemplate(view, "affairs-student-detail-template");
  $("[data-student-subtitle]", view).textContent = `معلومات الطالب • ${student.name}`;
  const infoList = $("[data-student-info]", view);
  studentInfo.forEach(({ label, value }) => {
    const row = document.createElement("div");
    row.className = "li";
    row.style.padding = "10px 0";
    const details = document.createElement("div");
    details.className = "grow";
    const name = document.createElement("b");
    name.textContent = label;
    const content = document.createElement("small");
    content.textContent = value;
    details.append(name, content);
    row.append(details);
    infoList.append(row);
  });
  $("[data-student-documents]", view).href =
    `documents.html?studentId=${encodeURIComponent(student.id)}`;
  $("[data-student-conversations]", view).href =
    `conversations.html?id=${encodeURIComponent(student.id)}`;
  $("[data-student-unread]", view).textContent = unreadTotal
    ? `${unreadTotal} رسالة غير مقروءة`
    : "لا توجد رسائل غير مقروءة";
};

const affairsStudentDocumentsPage = (view, _p, query = {}) => {
  const targetStudentId = (query.studentId || "").trim();
  const rows = studentRequests.flatMap((request) =>
    (request.documents || []).map((documentItem) => ({
      ...documentItem,
      studentName: request.studentName,
      studentId: request.studentId,
      uploadedAt: request.submittedAt,
      requestId: request.id,
      requestCategory: request.category,
      previewKey: `${request.id}-${documentItem.id}`,
    })),
  );

  const filteredRows = targetStudentId
    ? rows.filter((row) => row.studentId === targetStudentId || row.studentName === targetStudentId)
    : rows;

  useTemplate(view, "affairs-student-documents-template");

  createTable($("[data-student-documents-table]", view), {
    cols: [
      { title: "اسم الطالب", render: (row) => row.studentName },
      { title: "كود الطالب", render: (row) => `<b>${row.studentId}</b>` },
      { title: "اسم المستند", render: (row) => row.name || row.type || row.fileName },
      { title: "تاريخ الرفع", render: (row) => row.uploadedAt },
      { title: "الحالة", render: (row) => badge(requestDocumentStatusMeta[row.status]?.label || row.status, requestDocumentStatusMeta[row.status]?.tone || "gray") },
      { title: "معاينة", render: (row) => `<button class="btn ghost" data-doc-preview="${row.previewKey}">معاينة</button>` },
    ],
    rows: filteredRows,
    search: {
      placeholder: "ابحث باسم الطالب أو اسم المستند أو الكود...",
      test: (row, q) => `${row.studentName} ${row.studentId} ${row.name || row.type || row.fileName}`.toLowerCase().includes(q.toLowerCase()),
    },
    filter: {
      label: "تصفية حسب الحالة",
      options: [
        { value: "", label: "الكل" },
        { value: "pending", label: "قيد المراجعة" },
        { value: "accepted", label: "مقبول" },
        { value: "rejected", label: "مرفوض" },
      ],
      test: (row, value) => !value || row.status === value,
    },
    onRender: (body) => {
      body.querySelectorAll('[data-doc-preview]').forEach((button) => {
        button.onclick = () => {
          const doc = filteredRows.find((item) => `${item.requestId}-${item.id}` === button.dataset.docPreview);
          if (doc) renderDocumentPreviewModal(doc);
        };
      });
    },
    empty: empty("لا توجد مستندات", "لا توجد مستندات متوافقة مع البحث أو الفلتر الحالي."),
  });
};

const affairsStudentConversationsPage = (view, [id]) => {
  let filter = "";
  const cur = threads.find((thread) => thread.sid === id);
  const stu = cur && studentById(cur.sid);
  if (cur) cur.unread = 0;

  view.innerHTML =
    pageHead("محادثات الطلاب", `${unreadTotal()} رسائل غير مقروءة`) +
    `<div class="chat"><div class="card ${id ? "hide-m" : ""}"><div style="padding:12px;border-bottom:1px solid var(--line)"><select class="select" id="flt" aria-label="فلتر الطالب"><option value="">كل الطلاب</option>${students.map((student) => `<option value="${student.id}">${student.name}</option>`).join("")}</select></div><div class="scroll" id="list" style="padding:0"></div></div><div class="card ${id ? "" : "hide-m"}" id="pane"></div></div>`;

  function renderList() {
    const list = threads.filter((thread) => !filter || thread.sid === filter);
    $('#list', view).innerHTML = list.length
      ? list
          .map((thread) => {
            const student = studentById(thread.sid);
            if (!student) return "";
            const last = thread.msgs[thread.msgs.length - 1];
            return `<a href="conversations.html?id=${thread.sid}" class="th ${thread.sid === id ? "on" : ""}"><span class="avatar">${student.name[0]}</span><div style="flex:1;min-width:0"><b style="font-size:13px">${student.name}</b><div style="font-size:12px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(last?.text || last?.file || "لا توجد رسائل")}</div></div>${thread.unread ? badge(thread.unread, "red") : ""}</a>`;
          })
          .join("")
      : empty("لا توجد محادثات", "", "chat");
  }

  $('#flt', view).onchange = (event) => {
    filter = event.target.value;
    renderList();
  };

  renderList();

  const pane = $('#pane', view);
  if (!id) {
    pane.innerHTML = empty("اختر محادثة للبدء", "رسائل الطلاب تظهر هنا بنفس نمط الشات الحالي في التطبيق.", "chat");
    return;
  }

  if (!cur || !stu) {
    pane.innerHTML = errorBox("المحادثة غير متاحة", "", '<a class="btn primary" href="conversations.html">العودة إلى المحادثات</a>');
    return;
  }

  pane.innerHTML = `<div style="padding:12px 14px;border-bottom:1px solid var(--line);display:flex;gap:10px;align-items:center"><span class="avatar">${stu.name[0]}</span><div style="flex:1"><b>${stu.name}</b><div style="font-size:12px;color:var(--mut)">${stu.id} · البريد: ${esc(stu.email)}</div></div><a class="btn ghost menu" href="conversations.html">القائمة</a></div>
    <div class="scroll" id="msgs"></div><div class="compose"><input class="input" id="txt" placeholder="اكتب ردك..."><button class="btn primary" id="snd" aria-label="إرسال">${icon("send")}</button></div>`;

  const msgs = $('#msgs', pane);
  const txt = $('#txt', pane);

  const draw = () => {
    msgs.innerHTML = cur.msgs
      .map((message) => `<div class="bub ${message.from === "d" ? "me" : ""}">${message.file ? `<div>${icon("clip", 13)} ${esc(message.file)}</div>` : ""}${esc(message.text || "")}${message.at ? `<small>${message.at}</small>` : ""}</div>`)
      .join("");
    msgs.scrollTop = msgs.scrollHeight;
    renderList();
  };

  const send = () => {
    if (!txt.value.trim()) return;
    cur.msgs.push({ from: "d", text: txt.value.trim(), at: "الآن" });
    txt.value = "";
    draw();
  };

  txt.oninput = () => {
    $('#snd', pane).disabled = !txt.value.trim();
  };
  txt.onkeydown = (event) => event.key === "Enter" && send();
  $('#snd', pane).onclick = send;
  $('#snd', pane).disabled = true;
  draw();
};

const splitCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
};

const parseMilitaryEducationCsv = (text) => {
  const lines = (text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    throw new Error("الملف فارغ، يرجى استخدام ملف CSV يحتوي على بيانات الطلبة.");
  }

  const header = splitCsvLine(lines[0]).map((item) => item.replace(/"/g, "").trim().toLowerCase());
  const expectedColumns = ["studentcode", "studentname", "coursestatus", "result", "completionstatus"];
  const missingColumns = expectedColumns.filter((key) => !header.includes(key));

  if (missingColumns.length) {
    throw new Error(`أعمدة الملف غير صحيحة. الأعمدة المطلوبة: ${expectedColumns.join("، ")}. الأعمدة المفقودة: ${missingColumns.join("، ")}.`);
  }

  const indexes = Object.fromEntries(
    expectedColumns.map((key) => [key, header.indexOf(key)]),
  );

  const records = [];
  const errors = [];
  const seenCodes = new Set();

  lines.slice(1).forEach((line, index) => {
    const row = splitCsvLine(line);
    if (!row.some((cell) => cell && cell !== "")) {
      return;
    }
    const record = {
      studentCode: (row[indexes.studentcode] || "").replace(/"/g, "").trim(),
      studentName: (row[indexes.studentname] || "").replace(/"/g, "").trim(),
      courseStatus: (row[indexes.coursestatus] || "").replace(/"/g, "").trim(),
      result: (row[indexes.result] || "").replace(/"/g, "").trim(),
      completionStatus: (row[indexes.completionstatus] || "").replace(/"/g, "").trim(),
    };

    const student = militaryStudents.find((item) => item.studentCode === record.studentCode);
    if (!student) {
      errors.push(`السطر ${index + 2}: كود الطالب "${record.studentCode || "غير موجود"}" غير مسجل في النظام.`);
      return;
    }

    if (!record.studentName || record.studentName !== student.studentName) {
      errors.push(`السطر ${index + 2}: اسم الطالب لا يطابق الكود ${record.studentCode}.`);
      return;
    }

    if (!militaryEducationAllowedCourseStatus.includes(record.courseStatus)) {
      errors.push(`السطر ${index + 2}: حالة المقرر غير صالحة: ${record.courseStatus || "فارغ"}.`);
      return;
    }

    if (!militaryEducationAllowedResults.includes(record.result)) {
      errors.push(`السطر ${index + 2}: النتيجة غير صالحة: ${record.result || "فارغة"}.`);
      return;
    }

    const normalizedCompletion = (record.completionStatus === "منتهي" || record.completionStatus === "غير منتهي") ? record.completionStatus : (record.courseStatus === "مكتمل" || record.result === "مقبول" || record.result === "ناجح") ? "منتهي" : "غير منتهي";
    if (record.completionStatus && record.completionStatus !== normalizedCompletion) {
      errors.push(`السطر ${index + 2}: حالة الإكمال لا تتوافق مع البيانات المدخلة (${record.completionStatus} / ${normalizedCompletion}).`);
      return;
    }

    const dedupKey = `${record.studentCode}-${record.result}-${record.courseStatus}`;
    if (seenCodes.has(dedupKey) || militaryEducationResults.some((item) => item.studentCode === record.studentCode)) {
      errors.push(`السطر ${index + 2}: الطالب ${record.studentCode} موجود بالفعل في النتائج أو مكرر في الملف.`);
      return;
    }
    seenCodes.add(dedupKey);

    records.push(
      normalizeMilitaryEducationResult({
        id: `MRE-${Date.now()}-${records.length + 1}`,
        studentCode: record.studentCode,
        studentName: student.studentName,
        courseStatus: record.courseStatus,
        result: record.result,
        completionStatus: normalizedCompletion,
        completed: normalizedCompletion === "منتهي",
        updatedAt: new Date().toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }),
      }),
    );
  });

  return { records, errors };
};

const openMilitaryEducationResultModal = (existingRecord = null, onSaved) => {
  const studentOptions = militaryStudents
    .map((student) => `<option value="${student.studentCode}">${student.studentCode} - ${student.studentName}</option>`)
    .join("");

  const currentData = existingRecord || {
    studentCode: militaryStudents[0]?.studentCode || "",
    studentName: militaryStudents[0]?.studentName || "",
    courseStatus: "مسجل",
    result: "مؤجل",
    completionStatus: "غير منتهي",
  };

  modal(
    `<h2>${existingRecord ? "تعديل النتيجة" : "إضافة نتيجة"}</h2>
      <div class="field">
        <label>كود الطالب</label>
        <select class="select" id="military-student-code">${studentOptions}</select>
      </div>
      <div class="field">
        <label>اسم الطالب</label>
        <input class="input" id="military-student-name" readonly value="${esc(currentData.studentName)}" />
      </div>
      <div class="field">
        <label>حالة المقرر</label>
        <select class="select" id="military-course-status">
          ${militaryEducationAllowedCourseStatus.map((status) => `<option value="${status}" ${status === currentData.courseStatus ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>النتيجة</label>
        <select class="select" id="military-result">
          ${militaryEducationAllowedResults.map((status) => `<option value="${status}" ${status === currentData.result ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>حالة الإكمال</label>
        <select class="select" id="military-completion-status">
          ${Object.keys(militaryEducationCompletionMeta).map((status) => `<option value="${status}" ${status === currentData.completionStatus ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </div>
      <div class="acts">
        <button class="btn primary save-military-result">${existingRecord ? "حفظ التعديل" : "إضافة النتيجة"}</button>
        <button class="btn ghost no">إلغاء</button>
      </div>`,
    (m, close) => {
      const codeInput = $('#military-student-code', m);
      const nameInput = $('#military-student-name', m);
      const courseStatusInput = $('#military-course-status', m);
      const resultInput = $('#military-result', m);
      const completionInput = $('#military-completion-status', m);

      if (existingRecord) {
        codeInput.value = existingRecord.studentCode;
      } else {
        codeInput.value = currentData.studentCode;
      }

      const syncStudentName = () => {
        const student = militaryStudents.find((item) => item.studentCode === codeInput.value);
        nameInput.value = student ? student.studentName : "";
      };
      syncStudentName();
      codeInput.onchange = syncStudentName;

      $('.save-military-result', m).onclick = () => {
        const studentCode = codeInput.value.trim();
        const student = militaryStudents.find((item) => item.studentCode === studentCode);

        if (!student) {
          setErr("military-student-code", "يرجى اختيار طالب مسجل في النظام.");
          return;
        }

        const courseStatus = courseStatusInput.value;
        const result = resultInput.value;
        const completionStatus = completionInput.value;

        if (!militaryEducationAllowedCourseStatus.includes(courseStatus)) {
          return;
        }

        if (!militaryEducationAllowedResults.includes(result)) {
          return;
        }

        const nextRecord = normalizeMilitaryEducationResult({
          ...(existingRecord || { id: `MRE-${Date.now()}` }),
          studentCode,
          studentName: student.studentName,
          courseStatus,
          result,
          completionStatus,
          completed: completionStatus === "منتهي",
          updatedAt: new Date().toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }),
        });

        if (existingRecord) {
          const idx = militaryEducationResults.findIndex((item) => item.id === existingRecord.id);
          if (idx >= 0) militaryEducationResults[idx] = nextRecord;
        } else {
          const duplicate = militaryEducationResults.some((item) => item.studentCode === studentCode);
          if (duplicate) {
            modal(`<h2>لا يمكن تكرار الطالب</h2><p>هذا الطالب لديه نتيجة مسجلة بالفعل في قائمة التعليم العسكري.</p><div class="acts"><button class="btn primary" data-close>موافق</button></div>`, (m2, close2) => {
              $('[data-close]', m2).onclick = close2;
            });
            return;
          }
          militaryEducationResults.push(nextRecord);
        }

        close();
        onSaved && onSaved(nextRecord, !!existingRecord);
      };

      $('.no', m).onclick = close;
    },
  );
};

const affairsMilitaryEducationPage = (view) => {
  const state = {
    search: "",
    completedOnly: false,
    summary: null,
  };

  const render = () => {
    const filteredRows = militaryEducationResults
      .map((record) => normalizeMilitaryEducationResult(record))
      .filter((record) => {
        const matchesText = !state.search || `${record.studentCode} ${record.studentName}`.toLowerCase().includes(state.search.toLowerCase());
        const matchesCompletion = !state.completedOnly || record.completionStatus === "منتهي";
        return matchesText && matchesCompletion;
      });

    const completedCount = militaryEducationResults.filter((record) => normalizeMilitaryEducationResult(record).completionStatus === "منتهي").length;

    view.innerHTML =
      pageHead("نتائج التعليم العسكري", "استيراد النتائج، البحث، التصفية، وإدارة السجل مباشرة داخل التطبيق") +
      `<div class="grid g4" style="margin-bottom:16px">
        ${stat("إجمالي النتائج", militaryEducationResults.length, "clipboard", "blue")}
        ${stat("الطلاب المنتهون", completedCount, "check", "green")}
        ${stat("قيد التنفيذ", militaryEducationResults.filter((record) => record.courseStatus === "قيد التنفيذ").length, "alert", "amber")}
        ${stat("المرشحين", militaryStudents.length, "users", "gray")}
      </div>
      <div class="card" style="margin-bottom:16px; padding:16px">
        <div class="head" style="margin-bottom:12px">
          <h3 style="margin:0">استيراد ملف النتائج</h3>
        </div>
        <div class="grid" style="grid-template-columns:1fr auto; gap:12px; align-items:end;">
          <div id="military-upload"></div>
          <button class="btn primary" id="import-military-file">استيراد الملف</button>
        </div>
        ${state.summary ? `<div style="margin-top:12px">${state.summary.type === "success" ? success(state.summary.title, state.summary.body) : errorBox(state.summary.title, state.summary.body)}</div>` : ""}
      </div>
      <div class="card">
        <div class="head" style="margin-bottom:10px">
          <div><h3 style="margin:0">جدول النتائج</h3></div>
          <div class="row">
            <button class="btn primary" id="add-military-result">إضافة نتيجة</button>
          </div>
        </div>
        <div id="military-results-table"></div>
      </div>`;

    const uploader = createUpload($('#military-upload', view), {
      exts: ["csv"],
      maxMB: 2,
      onPick: () => {},
    });

    $('#import-military-file', view).onclick = async () => {
      const file = uploader.get();
      if (!file) {
        state.summary = { type: "error", title: "لم يتم اختيار ملف", body: "يرجى اختيار ملف CSV أولاً ثم اضغط على استيراد الملف." };
        render();
        return;
      }

      try {
        const text = await file.text();
        const { records, errors } = parseMilitaryEducationCsv(text);
        if (errors.length) {
          state.summary = { type: "error", title: "توجد صفوف غير صالحة", body: errors.slice(0, 4).join(" • ") + (errors.length > 4 ? " • ..." : "") };
          render();
          return;
        }

        const inserted = records.filter((record) => !militaryEducationResults.some((item) => item.studentCode === record.studentCode));
        if (!inserted.length) {
          state.summary = { type: "error", title: "لا توجد بيانات جديدة", body: "كل صفوف الملف مكررة أو موجودة بالفعل في النتائج الحالية." };
          render();
          return;
        }
        militaryEducationResults.push(...inserted);
        state.summary = { type: "success", title: "تم استيراد الملف بنجاح", body: `تمت إضافة ${inserted.length} سجل جديد بنجاح.` };
        render();
      } catch (error) {
        state.summary = { type: "error", title: "فشل استيراد الملف", body: error.message || "حدث خطأ أثناء قراءة الملف." };
        render();
      }
    };

    $('#add-military-result', view).onclick = () => {
      openMilitaryEducationResultModal(null, (record, isEdit) => {
        state.summary = {
          type: "success",
          title: isEdit ? "تم تحديث النتيجة" : "تمت إضافة النتيجة",
          body: `${record.studentName} • ${record.result} • ${record.completionStatus}`,
        };
        render();
      });
    };

    createTable($('#military-results-table', view), {
      cols: [
        { title: "كود الطالب", render: (record) => `<b>${record.studentCode}</b>` },
        { title: "اسم الطالب", render: (record) => record.studentName },
        { title: "حالة المقرر", render: (record) => badge(militaryEducationStatusMeta[record.courseStatus]?.label || record.courseStatus, militaryEducationStatusMeta[record.courseStatus]?.tone || "blue") },
        { title: "النتيجة", render: (record) => record.result },
        { title: "حالة الإكمال", render: (record) => `${badge(militaryEducationCompletionMeta[record.completionStatus]?.label || record.completionStatus, militaryEducationCompletionMeta[record.completionStatus]?.tone || "gray")}<div style="margin-top:8px"><button class="btn ghost" data-edit-military-result="${record.id}">تعديل</button></div>` },
      ],
      rows: filteredRows,
      search: {
        placeholder: "ابحث بالكود أو اسم الطالب...",
        test: (record, q) => `${record.studentCode} ${record.studentName}`.toLowerCase().includes(q.toLowerCase()),
      },
      filter: {
        label: "تصفية النتائج",
        options: [
          { value: "", label: "الكل" },
          { value: "completed", label: "الطلاب المنتهون" },
        ],
        test: (record, value) => value === "" || (value === "completed" && record.completionStatus === "منتهي"),
      },
      onRender: (body) => {
        body.querySelectorAll('[data-edit-military-result]').forEach((button) => {
          button.onclick = (event) => {
            event.stopPropagation();
            const record = militaryEducationResults.find((item) => item.id === button.dataset.editMilitaryResult);
            if (!record) return;
            openMilitaryEducationResultModal(record, (nextRecord, isEdit) => {
              state.summary = {
                type: "success",
                title: isEdit ? "تم تحديث النتيجة" : "تمت إضافة النتيجة",
                body: `${nextRecord.studentName} • ${nextRecord.result} • ${nextRecord.completionStatus}`,
              };
              render();
            });
          };
        });
      },
      empty: empty("لا توجد نتائج", "لا توجد سجلات مطابقة للبحث أو الفلتر الحالي."),
    });

    const searchableInput = $('.t-q', view);
    if (searchableInput) {
      searchableInput.value = state.search;
      searchableInput.oninput = (event) => {
        state.search = event.target.value.trim();
        render();
      };
    }

    const filterSelect = $('.t-f', view);
    if (filterSelect) {
      filterSelect.value = state.completedOnly ? "completed" : "";
      filterSelect.onchange = (event) => {
        state.completedOnly = event.target.value === "completed";
        render();
      };
    }
  };

  render();
};

const affairsDashboard = (view) => {
  const openRequests = studentRequests.filter((r) => ["pending", "inprogress"].includes(r.status)).length;
  const urgentRequests = studentRequests.filter((r) => r.priority === "عالية").length;
  const approvedToday = studentRequests.filter((r) => r.status === "approved").length;
  const totalRequests = studentRequests.length;

  useTemplate(view, "affairs-dashboard-template");
  const statValues = {
    total: totalRequests,
    open: openRequests,
    urgent: urgentRequests,
    approved: approvedToday,
  };
  Object.entries(statValues).forEach(([key, value]) => {
    $(`[data-stat="${key}"]`, view).textContent = value;
  });

  const sections = $("[data-sections]", view);
  affairsSections.forEach((section) => {
    const link = document.createElement("a");
    link.href = `requests.html?section=${encodeURIComponent(section.label)}`;
    link.className = "card link";
    link.style.cssText = "padding:14px;min-height:82px";
    const sectionIcon = document.createElement("span");
    sectionIcon.className = "ico blue";
    sectionIcon.style.cssText = "width:34px;height:34px";
    sectionIcon.innerHTML = icon(section.icon, 18);
    const details = document.createElement("span");
    details.style.cssText = "flex:1;min-width:0";
    const title = document.createElement("b");
    title.style.cssText = "display:block;font-size:13px;margin-bottom:4px";
    title.textContent = section.label;
    const count = document.createElement("small");
    count.style.color = "var(--mut)";
    count.textContent = `${section.count} طلب`;
    details.append(title, count);
    link.append(sectionIcon, details);
    sections.append(link);
  });

  const quickRequests = $("[data-quick-requests]", view);
  studentRequests.slice(0, 4).forEach((request) => {
    const status = requestStatusMeta[request.status];
    const link = document.createElement("a");
    link.href = `request-detail.html?id=${encodeURIComponent(request.id)}`;
    link.className = "li";
    link.style.padding = "10px 0";
    link.innerHTML = `<span class="ico ${status.tone}">${icon("clipboard", 18)}</span>
      <div class="grow"><b>${esc(request.id)}</b><small>${esc(request.studentName)} · ${esc(request.category)}</small></div>
      ${badge(status.label, status.tone)}`;
    quickRequests.append(link);
  });

  createTable($("[data-latest-requests]", view), {
    cols: [
      { title: "رقم الطلب", render: (r) => `<b>${r.id}</b>` },
      { title: "الطالب", render: (r) => r.studentName },
      { title: "القسم", render: (r) => r.section },
      { title: "نوع الطلب", render: (r) => r.category },
      { title: "الحالة", render: (r) => badge(requestStatusMeta[r.status].label, requestStatusMeta[r.status].tone) },
      { title: "تاريخ الإرسال", render: (r) => r.submittedAt },
    ],
    rows: studentRequests.slice(0, 5),
    pageSize: 4,
    onRow: (r) => go(`request-detail.html?id=${r.id}`),
    empty: empty("لا توجد طلبات في هذا القسم", "ستظهر أحدث الطلبات هنا عند التقديم."),
  });
};

const affairsRequestsPage = (view, _p, query = {}) => {
  const selectedSection = query.section || "";
  const filteredRows = studentRequests.filter((request) => {
    if (!selectedSection) return true;
    return request.section === selectedSection || request.category === selectedSection;
  });

  useTemplate(view, "affairs-requests-template");

  createTable($("[data-requests-table]", view), {
    cols: [
      { title: "رقم الطلب", render: (r) => `<b>${r.id}</b>` },
      { title: "الطالب", render: (r) => r.studentName },
      { title: "الرقم الجامعي", render: (r) => r.studentId },
      { title: "القسم", render: (r) => r.section },
      { title: "نوع الطلب", render: (r) => r.category },
      { title: "الحالة", render: (r) => badge(requestStatusMeta[r.status].label, requestStatusMeta[r.status].tone) },
      { title: "تاريخ الإرسال", render: (r) => r.submittedAt },
    ],
    rows: filteredRows,
    onRow: (r) => go(`request-detail.html?id=${r.id}`),
    search: {
      placeholder: "ابحث برقم الطلب أو اسم الطالب أو القسم...",
      test: (r, q) =>
        `${r.id} ${r.studentName} ${r.section} ${r.category}`
          .toLowerCase()
          .includes(q.toLowerCase()),
    },
    filter: {
      label: "تصفية حسب الحالة",
      options: [
        { value: "pending", label: "قيد المراجعة" },
        { value: "inprogress", label: "قيد التنفيذ" },
        { value: "approved", label: "مقبول" },
        { value: "rejected", label: "مرفوض" },
        { value: "closed", label: "مغلق" },
      ],
      test: (r, v) => r.status === v,
    },
    empty: empty("لا توجد طلبات", "لا توجد طلبات تتوافق مع البحث أو الفلتر الحالي."),
  });
};

const affairsRequestDetailPage = (view, [requestId]) => {
  const request = getRequestById(requestId);

  if (!request) {
    view.innerHTML =
      pageHead("تفاصيل الطلب", "الطلب المحدد غير موجود") +
      `<div class="card">${errorBox("لم يتم العثور على هذا الطلب", "تأكد من الرابط أو عد إلى قائمة الطلبات.", '<a class="btn primary" href="requests.html">العودة إلى الطلبات</a>')}</div>`;
    return;
  }

  const render = () => {
    const requestStatus = requestStatusMeta[request.status] || requestStatusMeta.pending;
    const studentInfo = [
      { label: "اسم الطالب", value: request.studentName },
      { label: "رمز الطالب", value: request.studentId },
      { label: "القسم", value: request.section },
      { label: "نوع الطلب", value: request.category },
      { label: "تاريخ التقديم", value: request.submittedAt },
      { label: "الحالة الحالية", value: requestStatus.label },
    ];

    const reviewNotes = request.notes.length
      ? request.notes
          .map(
            (note) => `
              <div class="li" style="padding:10px 0">
                <span class="ico amber">${icon("file", 16)}</span>
                <div class="grow">
                  <b>${esc(note.author)}</b>
                  <small>${esc(note.text)}</small>
                </div>
                <small>${note.time}</small>
              </div>
            `,
          )
          .join("")
      : empty("لا توجد ملاحظات مراجعة", "سيظهر سجل الملاحظات هنا عند إضافة أول ملاحظة.");

    const chatMessages = request.messages.length
      ? request.messages
          .map(
            (msg) => `
              <div class="bub ${msg.from === "employee" ? "me" : ""}">
                <b>${msg.sender || (msg.from === "employee" ? "موظف شؤون الطلاب" : "الطالب")}</b>
                <div>${esc(msg.text)}</div>
                <small>${msg.time}</small>
              </div>
            `,
          )
          .join("")
      : `<div class="state" style="padding:20px 10px">${empty("لا توجد رسائل", "ابدأ المحادثة مع الطالب في هذا الطلب.")}</div>`;

    view.innerHTML =
      pageHead(
        request.id,
        `${request.studentName} · ${request.category}`,
        '<a class="btn ghost" href="requests.html">رجوع</a>',
      ) +
      `<div class="card" style="margin-bottom:16px">${renderRequestStatusSummary(request)}</div>
      <div class="grid g2">
        <div class="card">
          <h3>معلومات الطالب والطلب</h3>
          <div class="list">
            ${studentInfo
              .map(
                (item) => `
                  <div class="li" style="padding:10px 0">
                    <div class="grow">
                      <b>${item.label}</b>
                      <small>${esc(item.value)}</small>
                    </div>
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>
        <div class="card">
          <h3>إجراءات الطلب</h3>
          <div class="list">
            <div class="li" style="padding:10px 0">
              <div class="grow">
                <b>الموافقة النهائية</b>
                <small>${request.documents.every((doc) => doc.status === "accepted") ? "جميع المستندات تم قبولها" : "يجب قبول جميع المستندات قبل الاعتماد النهائي"}</small>
              </div>
              <button class="btn primary" data-action="approve" ${request.documents.some((doc) => doc.status !== "accepted") ? "disabled" : ""}>اعتماد الطلب</button>
            </div>
            <div class="li" style="padding:10px 0">
              <div class="grow">
                <b>رفض الطلب</b>
                <small>تمت إعادة المراجعة أو رفض الطلب نهائيًا.</small>
              </div>
              <button class="btn danger" data-action="reject">رفض الطلب</button>
            </div>
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <h3>مراجعة المستندات</h3>
        <div class="list">
          ${request.documents
            .map(
              (documentItem) => `
                <div class="li" style="padding:12px 8px;align-items:center;gap:14px">
                  <span class="ico ${requestDocumentStatusMeta[documentItem.status].tone}">${icon(documentItem.status === "accepted" ? "check" : documentItem.status === "rejected" ? "alert" : "file", 18)}</span>
                  <div class="grow">
                    <b>${esc(documentItem.name)}</b>
                    <small>${esc(documentItem.fileName || "الملف غير متوفر")} · ${requestDocumentStatusMeta[documentItem.status].label}</small>
                    ${documentItem.rejectionReason ? `<small style="color:var(--bad)">سبب الرفض: ${esc(documentItem.rejectionReason)}</small>` : ""}
                  </div>
                  <button class="btn ghost" data-doc-preview="${documentItem.id}">معاينة</button>
                  <button class="btn outline" data-doc-accept="${documentItem.id}" ${documentItem.status === "accepted" ? "disabled" : ""}>قبول</button>
                  <button class="btn danger" data-doc-reject="${documentItem.id}" ${documentItem.status === "rejected" ? "disabled" : ""}>رفض</button>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card">
          <h3>ملاحظات المراجعة</h3>
          <div class="list" style="margin-bottom:12px">${reviewNotes}</div>
          <div class="field">
            <label>إضافة ملاحظة</label>
            <textarea class="input" id="review-note" placeholder="اكتب ملاحظة داخلية..."></textarea>
            <div class="e" id="e-review-note" role="alert"></div>
          </div>
          <button class="btn primary" id="save-note">إضافة ملاحظة</button>
        </div>
        <div class="card">
          <h3>الدردشة</h3>
          <div class="scroll" style="height:260px;overflow:auto;border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--bg);margin-bottom:12px">${chatMessages}</div>
          <div class="compose">
            <input class="input" id="chat-message" placeholder="اكتب رسالة للطالب..." />
            <button class="btn primary" id="send-message">إرسال</button>
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <h3>سجل الإجراءات</h3>
        <div class="list">
          ${request.timeline
            .slice()
            .reverse()
            .map(
              (event) => `
                <div class="li" style="padding:10px 0">
                  <span class="ico blue">${icon("check", 16)}</span>
                  <div class="grow">
                    <b>${esc(event.title)}</b>
                    <small>${event.actor} · ${event.time}</small>
                  </div>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>`;

    const noteInput = $("#review-note", view);
    $("#save-note", view).onclick = () => {
      const text = (noteInput.value || "").trim();
      if (!text) {
        setErr("review-note", "يجب إدخال نص الملاحظة قبل الحفظ.");
        return;
      }
      request.notes.unshift({
        author: "موظف شؤون الطلاب",
        text,
        time: new Date().toLocaleString("ar-EG", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      });
      request.status = request.status === "rejected" ? "rejected" : "inprogress";
      addTimelineEvent(request, "تمت إضافة ملاحظة مراجعة", "موظف شؤون الطلاب");
      noteInput.value = "";
      render();
    };

    const sendMessage = $("#send-message", view);
    const chatInput = $("#chat-message", view);
    sendMessage.onclick = () => {
      const text = (chatInput.value || "").trim();
      if (!text) return;
      request.messages.push({
        from: "employee",
        sender: "موظف شؤون الطلاب",
        text,
        time: new Date().toLocaleString("ar-EG", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      });
      addTimelineEvent(request, "تمت إضافة رسالة للمراجعة", "موظف شؤون الطلاب");
      chatInput.value = "";
      render();
    };

    view.querySelectorAll("[data-doc-preview]").forEach((button) => {
      button.onclick = () => {
        const doc = request.documents.find((item) => item.id === button.dataset.docPreview);
        if (doc) renderDocumentPreviewModal(doc);
      };
    });

    view.querySelectorAll("[data-doc-accept]").forEach((button) => {
      button.onclick = () => {
        const doc = request.documents.find((item) => item.id === button.dataset.docAccept);
        if (!doc) return;
        doc.status = "accepted";
        doc.rejectionReason = "";
        request.status = request.documents.every((item) => item.status === "accepted") ? request.status : "inprogress";
        addTimelineEvent(request, `تم قبول المستند: ${doc.name}`, "موظف شؤون الطلاب");
        render();
      };
    });

    view.querySelectorAll("[data-doc-reject]").forEach((button) => {
      button.onclick = () => {
        const doc = request.documents.find((item) => item.id === button.dataset.docReject);
        if (!doc) return;
        modal(
          `<h2>رفض المستند</h2><p>يرجى كتابة سبب الرفض قبل الحفظ.</p>${field("سبب الرفض", '<textarea class="input" id="reject-reason"></textarea>', "reject-reason")}<div class="acts"><button class="btn primary ok">حفظ السبب</button><button class="btn ghost no">إلغاء</button></div>`,
          (m, close) => {
            const reasonInput = $('#reject-reason', m);
            const okBtn = $('.ok', m);
            const noBtn = $('.no', m);
            okBtn.onclick = () => {
              const reason = (reasonInput.value || "").trim();
              if (!reason) {
                setErr("reject-reason", "سبب الرفض مطلوب ولا يمكن أن يكون فارغًا.");
                return;
              }
              doc.status = "rejected";
              doc.rejectionReason = reason;
              request.status = "inprogress";
              addTimelineEvent(request, `تم رفض المستند: ${doc.name}`, "موظف شؤون الطلاب");
              close();
              render();
            };
            noBtn.onclick = close;
          },
        );
      };
    });

    view.querySelectorAll("[data-action]").forEach((button) => {
      button.onclick = () => {
        const action = button.dataset.action;
        if (action === "approve") {
          const allAccepted = request.documents.every((doc) => doc.status === "accepted");
          if (!allAccepted) {
            modal(`<h2>تعذر اعتماد الطلب</h2><p>يجب قبول جميع المستندات قبل اعتماد الطلب النهائي.</p><div class="acts"><button class="btn primary" data-close>موافق</button></div>`, (m, close) => {
              $('[data-close]', m).onclick = close;
            });
            return;
          }
          confirmDlg({
            title: "اعتماد الطلب",
            body: `هل أنت متأكد من اعتماد الطلب ${request.id}؟`,
            label: "اعتماد الطلب",
            onOk: () => {
              request.status = "approved";
              addTimelineEvent(request, "تم اعتماد الطلب نهائيًا", "موظف شؤون الطلاب");
              render();
            },
          });
          return;
        }

        if (action === "reject") {
          modal(
            `<h2>رفض الطلب</h2><p>يرجى إدخال سبب الرفض قبل الحفظ.</p>${field("سبب الرفض", '<textarea class="input" id="request-reject-reason"></textarea>', "request-reject-reason")}<div class="acts"><button class="btn danger ok">حفظ الرفض</button><button class="btn ghost no">إلغاء</button></div>`,
            (m, close) => {
              const reasonInput = $('#request-reject-reason', m);
              const okBtn = $('.ok', m);
              const noBtn = $('.no', m);
              okBtn.onclick = () => {
                const reason = (reasonInput.value || "").trim();
                if (!reason) {
                  setErr("request-reject-reason", "سبب الرفض مطلوب.");
                  return;
                }
                request.status = "rejected";
                request.documents.forEach((doc) => {
                  if (doc.status === "pending") doc.status = "rejected";
                  if (!doc.rejectionReason) doc.rejectionReason = reason;
                });
                addTimelineEvent(request, `تم رفض الطلب: ${reason}`, "موظف شؤون الطلاب");
                close();
                render();
              };
              noBtn.onclick = close;
            },
          );
        }
      };
    });
  };

  render();
};

const affairsRequestReviewPage = affairsRequestDetailPage;

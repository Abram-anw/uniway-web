// ===== صفحات الدكتور (SCRUM-93 → 97) =====
const courseCols = [
  { title: "الكود", render: (c) => `<b>${c.code}</b>` },
  { title: "الاسم", render: (c) => c.name },
  { title: "عدد الطلاب", render: (c) => c.students },
  ...studyPrograms.map((program) => ({
    title: program,
    render: (course) =>
      courseProgramCounts(course.code).find((item) => item.program === program)
        .count,
  })),
  { title: "الساعات", render: (c) => c.hours },
  { title: "السنة الدراسية", render: (c) => c.year },
];
const cname = (code) =>
  (courses.find((c) => c.code === code) || {}).name || code;
const lecRows = (list) =>
  list
    .map(
      (l) =>
        `<div class="li">${badge(l.type, l.type === "PDF" ? "red" : "amber")}<div class="grow"><b>${esc(l.title)}</b><small>${l.at}</small></div></div>`,
    )
    .join("");
const courseOptions = () =>
  courses.map((c) => ({ value: c.code, label: courseLabel(c) }));

// ---------- SCRUM-93: لوحة الدكتور ----------
function dashboard(view) {
  // هيكل الصفحة (العنوان والكروت) موجود في doctor/dashboard.html؛ هنا بنملا الأرقام والجدول فقط
  const statValues = {
    courses: courses.length,
    students: courses.reduce((sum, course) => sum + course.students, 0),
    grades: courses.filter((course) => !course.graded).length,
    messages: unreadTotal(),
  };
  Object.entries(statValues).forEach(([key, value]) => {
    $(`[data-stat="${key}"]`, view).textContent = value;
  });
  createTable($("[data-course-table]", view), {
    cols: courseCols,
    rows: courses,
    onRow: (c) => go(`course-detail.html?code=${c.code}`),
  });
}

function coursesPage(view) {
  useTemplate(view, "doctor-courses-template");
  createTable($("[data-course-table]", view), {
    cols: courseCols,
    rows: courses,
    onRow: (c) => go(`course-detail.html?code=${c.code}`),
    search: {
      placeholder: "ابحث بالكود أو الاسم...",
      test: (c, q) =>
        c.name.includes(q) || c.code.toLowerCase().includes(q.toLowerCase()),
    },
    empty: empty("لا توجد مقررات مسندة إليك حاليًا"),
  });
}

function courseCatalogPage(view) {
  function render() {
    view.innerHTML =
      pageHead(
        "إضافة مقرر",
        "اختر مقررًا من كتالوج المقررات لإضافته إلى مقرراتك",
        '<a class="btn ghost" href="courses.html">العودة لمقرراتي</a>',
      ) +
      `<div class="course-catalog-grid">${courseCatalog
        .map((course) => {
          const added = courses.some(
            (assigned) => assigned.code === course.code,
          );
          return `<article class="card course-catalog-card">
            <div class="course-catalog-heading">
              <span class="badge">${course.code}</span>
              ${added ? badge("مضاف لمقرراتك", "green") : ""}
            </div>
            <h2>${esc(course.name)}</h2>
            <p>${course.year} · ${course.hours} ساعات · ${course.students} طالب</p>
            ${
              added
                ? `<a class="btn outline" href="course-detail.html?code=${course.code}">عرض المقرر</a>`
                : `<button class="btn primary" type="button" data-add-course="${course.code}">إضافة إلى مقرراتي</button>`
            }
          </article>`;
        })
        .join("")}</div>`;

    view.querySelectorAll("[data-add-course]").forEach((button) => {
      button.onclick = () => {
        const course = courseCatalog.find(
          (item) => item.code === button.dataset.addCourse,
        );
        if (!course || courses.some((item) => item.code === course.code)) {
          return;
        }

        const assignedCourse = { ...course, graded: false };
        const courseIndex = courses.length;
        courses.push(assignedCourse);
        students.push(...createCourseStudents(assignedCourse, courseIndex));
        render();
      };
    });
  }

  render();
}

function courseDetail(view, [code]) {
  const course = courses.find((c) => c.code === code);
  if (!course) {
    view.innerHTML = `<div class="card">${errorBox("هذا المقرر غير مسند إليك", "يمكنك فقط عرض مقرراتك.", '<a class="btn primary" href="courses.html">العودة للمقررات</a>')}</div>`;
    return;
  }
  let tab = "grades";
  view.innerHTML =
    pageHead(
      course.name,
      `${course.code} · ${course.students} طالب · ${course.hours} ساعات · السنة ${course.year}`,
      '<a class="btn ghost" href="courses.html">رجوع</a>',
    ) + '<div id="tabs"></div><div class="card" id="pane"></div>';
  const tabList = [
    { id: "grades", label: "الدرجات" },
    { id: "programs", label: "توزيع الشعب" },
    { id: "lectures", label: "المحاضرات" },
    { id: "ann", label: "إعلانات المقرر" },
    { id: "chat", label: "الشات" },
  ];
  function show() {
    tabs($("#tabs", view), tabList, tab, (t) => {
      tab = t;
      show();
    });
    const pane = $("#pane", view);
    if (tab === "grades") {
      pane.innerHTML = `<div class="list"><div class="li"><div class="grow"><b>حالة الدرجات</b><small>${course.graded ? "تم رفع درجات الميدتيرم وأعمال السنة" : "لم يتم رفع أي درجات بعد"}</small></div>${badge(course.graded ? "مرفوعة" : "تحتاج رفع", course.graded ? "green" : "amber")}<a class="btn primary" href="grades.html?course=${code}">رفع الدرجات</a></div></div>`;
    } else if (tab === "programs") {
      const programCounts = courseProgramCounts(code);
      pane.innerHTML = `<h3>توزيع طلاب ${esc(course.name)} حسب الشعبة</h3><div class="course-program-grid">${programCounts
        .map(
          ({ program, count }) =>
            `<article class="course-program-card" data-program="${esc(program)}" tabindex="0" role="button" aria-label="عرض طلاب قسم ${esc(program)}"><span>${esc(program)}</span><b>${count}</b><small>طالب</small></article>`,
        )
        .join(
          "",
        )}</div><p class="course-program-total">إجمالي الطلاب في المقرر: <b>${programCounts.reduce((total, item) => total + item.count, 0)}</b></p>`;
      const showProgramStudents = (program) => {
        const programStudents = students.filter(
          (student) =>
            student.course === code && student.program === program,
        );
        modal(
          `<div class="course-students-dialog">
           <div class="course-students-heading">
             <div>
               <h2>طلاب قسم ${esc(program)}</h2>
               <p>${esc(course.name)} · الدكتور: ${esc(course.doctorName || "غير محدد")}</p>
             </div>
             <span class="badge blue">${programStudents.length} طالب</span>
           </div>
           <div class="course-students-hint">اضغط على الطالب لفتح المحادثة معه</div>
           ${
             programStudents.length
               ? `<div class="course-students-list">${programStudents
                   .map(
                     (student) =>
                       `<button type="button" class="course-student-row" data-student-id="${esc(student.id)}">
                          <span class="avatar">${esc(student.name.charAt(0))}</span>
                          <span class="course-student-main"><b>${esc(student.name)}</b><small>${esc(student.id)}</small></span>
                          <span class="course-student-email" dir="ltr">${esc(student.email)}</span>
                          <span class="course-student-action">${icon("chat", 16)} فتح الشات</span>
                        </button>`,
                   )
                   .join("")}</div>`
               : empty("لا يوجد طلاب في هذا القسم", "سيظهر الطلبة المسجلون في المادة هنا.")
           }
           </div>`,
          (dialog, close) => {
            dialog.querySelectorAll("[data-student-id]").forEach((studentRow) => {
              studentRow.onclick = () => {
                const studentId = studentRow.dataset.studentId;
                if (!threads.some((thread) => thread.sid === studentId)) {
                  threads.push({ sid: studentId, unread: 0, msgs: [] });
                }
                close();
                window.location.href = `chats.html?id=${encodeURIComponent(studentId)}`;
              };
            });
          },
        );
      };
      pane.querySelectorAll("[data-program]").forEach((card) => {
        const open = () => showProgramStudents(card.dataset.program);
        card.onclick = open;
        card.onkeydown = (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open();
          }
        };
      });
    } else if (tab === "lectures") {
      const l = lectures.filter((x) => x.course === code);
      pane.innerHTML = `<div class="head" style="margin-bottom:6px"><h3 style="margin:0">${l.length} محاضرات</h3><a class="btn primary" href="lectures.html?course=${code}">رفع محاضرة</a></div>${l.length ? `<div class="list">${lecRows(l)}</div>` : empty("لا توجد محاضرات لهذا المقرر")}`;
    } else if (tab === "ann") {
      const a = announcements.filter((x) => x.course === code);
      pane.innerHTML = `<div class="head" style="margin-bottom:6px"><h3 style="margin:0">إعلانات المقرر</h3><button class="btn primary" id="new">إعلان جديد</button></div>${a.length ? `<div class="list">${a.map((x) => `<div class="li"><span class="ico amber">${icon("mega")}</span><div class="grow"><b>${esc(x.title)}</b><small>${esc(x.body)} · ${x.at}</small></div></div>`).join("")}</div>` : empty("لا توجد إعلانات", "انشر إعلانًا ليصل لطلاب المقرر.", "mega")}`;
      $("#new", pane).onclick = () =>
        modal(
          `<h2>إعلان جديد</h2>${field("العنوان", '<input class="input" id="at">', "at")}${field("نص الإعلان", '<textarea class="input" id="ab"></textarea>', "ab")}<div class="acts"><button class="btn primary" id="pub" disabled>نشر الإعلان</button><button class="btn ghost" id="no">إلغاء</button></div>`,
          (m, close) => {
            const chk = () =>
              ($("#pub", m).disabled =
                !$("#at", m).value.trim() || !$("#ab", m).value.trim());
            $("#at", m).oninput = chk;
            $("#ab", m).oninput = chk;
            $("#no", m).onclick = close;
            $("#pub", m).onclick = () => {
              const result = Catalog.announcements.create({
                course: code,
                title: $("#at", m).value.trim(),
                body: $("#ab", m).value.trim(),
                at: "الآن",
              });
              if (!result || !result.ok) {
                toast((result && result.error) || "تعذر نشر الإعلان.");
                return;
              }
              close();
              show();
            };
          },
        );
    } else {
      const t = threads.filter(
        (x) => (studentById(x.sid) || {}).course === code,
      );
      pane.innerHTML = t.length
        ? `<div class="list">${t
            .map((x) => {
              const s = studentById(x.sid);
              return `<a href="chats.html?id=${x.sid}" class="li"><span class="avatar">${s.name[0]}</span><div class="grow"><b>${s.name}</b><small>${esc(x.msgs[x.msgs.length - 1].text)}</small></div>${x.unread ? badge(x.unread, "red") : ""}</a>`;
            })
            .join("")}</div>`
        : empty("لا توجد محادثات في هذا المقرر", "", "chat");
    }
  }
  show();
}

// ---------- SCRUM-94: رفع الدرجات ----------
const GTYPES = [
  { value: "mid", label: "ميدتيرم" },
  { value: "work", label: "أعمال سنة" },
  { value: "ORL", label: "شفوي" },
  { value: "fin", label: "الفاينل" },
];
const GMAX = { mid: 20, work: 30, fin: 50 };
function gradesPage(view, _p, q) {
  if (!courses.length) {
    view.innerHTML = `<div class="card">${empty("لا توجد مقررات مسندة إليك حاليًا")}</div>`;
    return;
  }
  let course = q.course || "",
    type = "",
    mode = "manual",
    vals = {},
    dirty = false,
    file = null,
    tbl;
  const max = () => GMAX[type] || 0,
    list = () => students.filter((s) => s.course === course);
  const bad = (v) => v !== "" && (isNaN(+v) || +v < 0 || +v > max());
  const stats = () => {
    const l = list();
    return {
      filled: l.filter((s) => (vals[s.id] || "") !== "").length,
      errors: l.filter((s) => bad(vals[s.id] || "")).length,
      total: l.length,
    };
  };
  view.innerHTML =
    pageHead(
      "رفع الدرجات",
      "اختر المقرر أولًا ثم أدخل الدرجات أو ارفع ملف Excel",
    ) +
    `<div class="card"><div class="grid g3">${field("المقرر", '<div id="d-c"></div>', "c")}${field("نوع الدرجات", '<div id="d-t"></div>', "t")}${field("الفصل الدراسي", '<div id="d-s"></div>', "s")}</div></div><div style="height:16px"></div><div class="card" id="body"></div>`;
  const ddC = createDropdown($("#d-c", view), {
    value: course,
    options: courseOptions(),
    searchable: true,
    placeholder: "اختر المقرر",
    onChange: (v, old) => {
      if (dirty && v !== old) {
        ddC.set(old);
        confirmDlg({
          title: "لديك درجات غير محفوظة، هل تريد المتابعة؟",
          body: "تغيير المقرر سيمسح الدرجات التي لم تحفظها.",
          label: "متابعة",
          onOk: () => {
            ddC.set(v);
            pickCourse(v);
          },
        });
      } else pickCourse(v);
    },
  });
  const ddT = createDropdown($("#d-t", view), {
    options: GTYPES,
    placeholder: "اختر النوع",
    disabled: !course,
    onChange: (v) => {
      type = v;
      vals = {};
      dirty = false;
      body();
    },
  });
  const ddS = createDropdown($("#d-s", view), {
    value: "1",
    disabled: !course,
    options: [
      { value: "1", label: "الفصل الأول 2026/2027" },
      { value: "2", label: "الفصل الثاني 2026/2027" },
    ],
  });
  function pickCourse(v) {
    course = v;
    vals = {};
    dirty = false;
    ddT.disable(false);
    ddS.disable(false);
    body();
  }
  function updateActions() {
    const s = stats(),
      ready = course && type;
    $("#save", view).disabled = !ready || !dirty;
    $("#rev", view).disabled = !ready;
    $("#send", view).disabled = !ready || s.errors > 0 || s.filled === 0;
  }
  function body() {
    const el = $("#body", view);
    if (!(course && type)) {
      el.innerHTML = empty(
        "اختر المقرر ونوع الدرجات لعرض قائمة الطلاب",
        "أزرار الحفظ والمراجعة والإرسال ستتفعل بعد الاختيار.",
        "users",
      );
      return;
    }
    el.innerHTML = `<div id="tb"></div><div id="content"></div><div class="acts" style="margin-top:18px"><button class="btn outline" id="save">حفظ</button><button class="btn outline" id="rev">مراجعة</button><button class="btn primary" id="send">إرسال الدرجات</button></div>`;
    const showTab = () => {
      tabs(
        $("#tb", el),
        [
          { id: "manual", label: "إدخال يدوي" },
          { id: "excel", label: "رفع ملف Excel" },
        ],
        mode,
        (t) => {
          mode = t;
          showTab();
        },
      );
      const c = $("#content", el);
      if (mode === "excel") {
        c.innerHTML =
          '<div class="grid" style="max-width:520px"><button class="btn outline" id="tpl">تحميل قالب الملف</button><div id="up"></div></div>';
        $("#tpl", c).onclick = () => {
          const csv =
            "\ufeffالرقم الجامعي,الاسم,الدرجة\n" +
            list()
              .map((s) => `${s.id},${s.name},`)
              .join("\n");
          const a = document.createElement("a");
          a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
          a.download = `${course}-grades-template.csv`;
          a.click();
        };
        createUpload($("#up", c), {
          exts: ["xlsx", "xls", "csv"],
          maxMB: 5,
          onPick: (f) => {
            file = f;
            if (!f) return;
            // Mock: هنا تحط الـ parser الحقيقي للملف. دلوقتي بيملّى درجات تجريبية.
            list().forEach(
              (s, i) =>
                (vals[s.id] = String(
                  Math.round(max() * (0.55 + ((i * 7) % 40) / 100)),
                )),
            );
            dirty = true;
            mode = "manual";
            showTab();
            updateActions();
          },
        });
      } else {
        c.innerHTML = '<div id="t"></div>';
        tbl = createTable($("#t", c), {
          rows: list(),
          pageSize: 10,
          search: {
            placeholder: "ابحث بالاسم أو الرقم الجامعي...",
            test: (s, qq) => s.name.includes(qq) || s.id.includes(qq),
          },
          cols: [
            { title: "الرقم الجامعي", render: (s) => s.id },
            { title: "الاسم", render: (s) => `<b>${s.name}</b>` },
            {
              title: `الدرجة (من ${max()})`,
              render: (s) =>
                `<div style="width:110px"><input class="input g-in" data-id="${s.id}" aria-label="درجة ${s.name}" inputmode="decimal" value="${esc(vals[s.id] || "")}" style="padding:6px 10px"><div class="e g-e"></div></div>`,
            },
            {
              title: "الحالة",
              render: (s) => `<span class="g-st" data-id="${s.id}"></span>`,
            },
          ],
          onRender: (b) => {
            const paint = (id) => {
              const v = vals[id] || "",
                i = b.querySelector(`.g-in[data-id="${id}"]`);
              i.classList.toggle("err", bad(v));
              i.nextElementSibling.textContent = bad(v)
                ? `لا تتجاوز ${max()}`
                : "";
              b.querySelector(`.g-st[data-id="${id}"]`).innerHTML = bad(v)
                ? badge("خطأ", "red")
                : v
                  ? badge("مُدخلة", "green")
                  : badge("فارغة", "gray");
            };
            b.querySelectorAll(".g-in").forEach((i) => {
              paint(i.dataset.id);
              i.oninput = () => {
                vals[i.dataset.id] = i.value.trim();
                dirty = true;
                paint(i.dataset.id);
                updateActions();
              };
            });
          },
        });
      }
    };
    showTab();
    updateActions();
    $("#save", el).onclick = () => {
      dirty = false;
      updateActions();
    };
    $("#rev", el).onclick = () => {
      const s = stats();
      modal(
        `<h2>مراجعة الدرجات</h2><p>تم إدخال <b>${s.filled}</b> من ${s.total} · فارغة: ${s.total - s.filled} · بها أخطاء: ${s.errors}</p><div class="acts"><button class="btn primary ok">تمام</button></div>`,
        (m, close) => ($(".ok", m).onclick = close),
      );
    };
    $("#send", el).onclick = () =>
      confirmDlg({
        title: "هل أنت متأكد من إرسال الدرجات؟",
        body: `سيتم إرسال ${stats().filled} درجة (${GTYPES.find((t) => t.value === type).label}) وإشعار كل طالب بها.`,
        label: "إرسال الدرجات",
        onOk: () => {
          dirty = false;
          view.innerHTML = `<div class="card">${success("تم إرسال الدرجات بنجاح", `وصلت الدرجات لطلاب ${cname(course)} وستظهر لهم في تطبيق الموبايل.`, '<a class="btn primary" href="dashboard.html">العودة للوحة الدكتور</a>')}</div>`;
        },
      });
  }
  if (course) {
    ddT.disable(false);
    ddS.disable(false);
  }
  body();
  window.onbeforeunload = () => (dirty ? true : undefined);
}

// ---------- SCRUM-95: رفع محاضرة (بدون حقل تاريخ) ----------
const stamp = () =>
  new Date().toLocaleString("ar-EG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
function lecturesPage(view, _p, q) {
  if (!courses.length) {
    view.innerHTML = `<div class="card">${empty("لا توجد مقررات مسندة إليك حاليًا")}</div>`;
    return;
  }
  let course = q.course || "",
    busy = false,
    up;
  view.innerHTML =
    pageHead(
      "رفع محاضرة",
      "اختر المقرر ثم أضف العنوان والملف. وقت الرفع يُسجّل تلقائيًا.",
    ) +
    `<div class="grid g2" style="align-items:start"><div class="card">${field("المقرر", '<div id="d-c"></div>', "course")}${field("عنوان المحاضرة", '<input class="input" id="title" placeholder="مثال: اختبارات البرمجيات">', "title")}${field("وصف المحاضرة (اختياري)", '<textarea class="input" id="desc"></textarea>', "desc")}</div>
    <div class="card">${field("ملف المحاضرة", '<div id="up"></div>', "file")}<div id="prog"></div><div class="acts"><button class="btn primary" id="go">رفع المحاضرة</button><button class="btn ghost" id="cancel">إلغاء</button></div></div></div><div id="recent" style="margin-top:16px"></div>`;
  const title = $("#title", view),
    desc = $("#desc", view);
  const dirty = () => !!(title.value || desc.value || up.get());
  const sync = () => {
    [title, desc].forEach((i) => (i.disabled = !course || busy));
    up.disable(!course || busy);
    $("#go", view).disabled = !course || busy;
    $("#cancel", view).disabled = busy;
  };
  const recent = () => {
    const l = lectures.filter((x) => x.course === course).slice(0, 4);
    $("#recent", view).innerHTML = course
      ? `<div class="card"><h3>آخر محاضرات المقرر</h3>${l.length ? `<div class="list">${lecRows(l)}</div>` : empty("لا توجد محاضرات لهذا المقرر بعد")}</div>`
      : "";
  };
  createDropdown($("#d-c", view), {
    value: course,
    options: courseOptions(),
    searchable: true,
    placeholder: "اختر المقرر",
    onChange: (v) => {
      course = v;
      setErr("course");
      sync();
      recent();
    },
  });
  up = createUpload($("#up", view), {
    exts: typeof Settings !== "undefined" ? Settings.get("lectureExts") : ["pdf", "ppt", "pptx", "docx", "mp4"],
    maxMB: typeof Settings !== "undefined" ? Settings.get("maxLectureMB") : 100,
    disabled: !course,
    onPick: () => setErr("file"),
  });
  title.oninput = () => setErr("title");
  sync();
  recent();
  $("#cancel", view).onclick = () =>
    dirty()
      ? confirmDlg({
          title: "لديك بيانات غير محفوظة، هل تريد المتابعة؟",
          body: "سيتم فقد بيانات المحاضرة والملف المختار.",
          label: "مغادرة",
          danger: true,
          onOk: () => go("dashboard.html"),
        })
      : go("dashboard.html");
  $("#go", view).onclick = () => {
    const f = up.get(),
      errs = {
        course: !course && "اختر المقرر",
        title: !title.value.trim() && "عنوان المحاضرة مطلوب",
        file: !f && "ملف المحاضرة مطلوب",
      };
    Object.keys(errs).forEach((k) => setErr(k, errs[k]));
    if (Object.values(errs).some(Boolean)) return;
    busy = true;
    sync();
    const set = (n) =>
      ($("#prog", view).innerHTML =
        `<div style="font-size:12px;color:var(--blue);display:flex;justify-content:space-between"><span>جاري رفع المحاضرة...</span><span>${n}%</span></div><div class="bar"><i style="width:${n}%"></i></div>`);
    set(30);
    setTimeout(
      live(() => set(75)),
      350,
    );
    // وقت الرفع بيتسجل تلقائيًا هنا — مفيش حقل تاريخ في الفورم.
    setTimeout(
      live(() => {
        const l = {
          id: Date.now(),
          course,
          title: title.value.trim(),
          type: f.name.split(".").pop().toUpperCase(),
          at: stamp(),
        };
        lectures.unshift(l);
        view.innerHTML = `<div class="card">${success("تم رفع المحاضرة بنجاح", `${esc(l.title)} — ${cname(course)}. تم الرفع: ${l.at}. وصل إشعار لطلاب المقرر.`, `<div class="acts" style="justify-content:center"><a class="btn outline" href="lectures.html?course=${course}" id="again">رفع محاضرة أخرى</a><a class="btn primary" href="course-detail.html?code=${course}">عرض المحاضرات</a></div>`)}</div>`;
        $("#again", view).onclick = (e) => {
          e.preventDefault();
          lecturesPage(view, [], { course: "" });
        };
      }),
      900,
    );
  };
  window.onbeforeunload = () => (dirty() && !busy ? true : undefined);
}

// ---------- ملف الدكتور الشخصي ----------
let profileNotificationsEnabled = typeof Settings !== "undefined" ? Settings.get("notificationsEnabled") !== false : true;

function doctorProfilePage(view) {
  const studentCount = courses.reduce(
    (total, course) => total + course.students,
    0,
  );
  const currentUser = typeof Auth !== "undefined" ? Auth.current() : null;
  const profileName = esc(currentUser?.name || "د. سارة القحطاني");
  const profileDepartment = esc(currentUser?.department || "علوم الحاسب");
  const profileInitial = esc(currentUser?.short || "س");

  view.innerHTML = `
    <section class="profile-page" aria-label="الملف الشخصي للدكتور">
      <header class="profile-hero">
        <div class="profile-avatar" aria-hidden="true">${profileInitial}</div>
        <h1>${profileName}</h1>
        <p>قسم ${profileDepartment} · ${esc(currentUser?.roleLabel || "دكتور")}</p>
        <div class="profile-stats">
          <div><b>F-1023</b><span>الرقم الوظيفي</span></div>
          <div><b>${courses.length}</b><span>المقررات</span></div>
          <div><b>${studentCount}</b><span>الطلاب</span></div>
        </div>
      </header>

      <button class="profile-report" id="profile-report">
        <span class="profile-action-icon blue">${icon("alert")}</span>
        <span class="profile-action-copy">
          <b>أبلغ عن مشكلة إدارية</b>
          <small>لاحظت مشكلة؟ أخبرنا لنساعدك في تحسين الخدمة.</small>
        </span>
        <span class="profile-chevron">${icon("chevD")}</span>
      </button>

      <section class="profile-actions" aria-label="إعدادات ومساعدة">
        <button class="profile-action" id="profile-notifications">
          <span class="profile-action-icon amber">${icon("bell")}</span>
          <span class="profile-action-copy"><b>إعدادات الإشعارات</b><small>تخصيص التنبيهات</small></span>
          <span class="profile-chevron">${icon("chevD")}</span>
        </button>
        <a class="profile-action" href="chats.html">
          <span class="profile-action-icon green">${icon("chat")}</span>
          <span class="profile-action-copy"><b>التواصل مع الدعم</b><small>الإبلاغ عن مشكلة أو طلب مساعدة</small></span>
          <span class="profile-chevron">${icon("chevD")}</span>
        </a>
        <button class="profile-action" id="profile-rating">
          <span class="profile-action-icon purple">${icon("star")}</span>
          <span class="profile-action-copy"><b>تقييم التطبيق</b><small>شاركنا رأيك</small></span>
          <span class="profile-chevron">${icon("chevD")}</span>
        </button>
        <button class="profile-action" id="profile-settings">
          <span class="profile-action-icon gray">${icon("file")}</span>
          <span class="profile-action-copy"><b>إعدادات الحساب</b><small>البيانات الشخصية والخصوصية</small></span>
          <span class="profile-chevron">${icon("chevD")}</span>
        </button>
      </section>

      <button class="profile-logout" id="profile-logout">تسجيل الخروج</button>
    </section>`;

  $("#profile-report", view).onclick = () =>
    modal(
      `<h2>الإبلاغ عن مشكلة</h2>
       <p>اكتب تفاصيل المشكلة وسنأخذها في الاعتبار لتحسين الخدمة.</p>
       <div class="field"><label for="profile-issue">تفاصيل المشكلة</label><textarea class="input" id="profile-issue" required></textarea></div>
       <div class="acts"><button class="btn primary" id="profile-issue-send" disabled>إرسال البلاغ</button><button class="btn ghost" id="profile-issue-cancel">إلغاء</button></div>`,
      (dialog, close) => {
        const details = $("#profile-issue", dialog);
        const sendButton = $("#profile-issue-send", dialog);
        details.oninput = () => {
          sendButton.disabled = !details.value.trim();
        };
        $("#profile-issue-cancel", dialog).onclick = close;
        sendButton.onclick = () => {
          close();
          modal(
            `<h2>شكرًا لملاحظتك</h2><p>تم استلام البلاغ في هذه النسخة التجريبية.</p><div class="acts"><button class="btn primary ok">حسنًا</button></div>`,
            (confirmation, closeConfirmation) => {
              $(".ok", confirmation).onclick = closeConfirmation;
            },
          );
        };
      },
    );

  $("#profile-notifications", view).onclick = () =>
    modal(
      `<h2>إعدادات الإشعارات</h2>
       <label class="profile-toggle"><span>استقبال الإشعارات</span><input id="profile-notifications-toggle" type="checkbox" ${profileNotificationsEnabled ? "checked" : ""}></label>
       <div class="acts"><button class="btn primary" id="profile-notifications-save">حفظ</button></div>`,
      (dialog, close) => {
        $("#profile-notifications-save", dialog).onclick = () => {
          profileNotificationsEnabled = $(
            "#profile-notifications-toggle",
            dialog,
          ).checked;
          close();
        };
      },
    );

  $("#profile-rating", view).onclick = () =>
    modal(
      `<h2>تقييم التطبيق</h2>
       <p>كيف كانت تجربتك مع بوابة UNIWAY؟</p>
       <div class="profile-rating" role="group" aria-label="اختر تقييمًا من نجمة إلى خمس نجوم">
         ${[1, 2, 3, 4, 5].map((rating) => `<button type="button" data-rating="${rating}" aria-label="${rating} نجوم">${icon("star", 26)}</button>`).join("")}
       </div>
       <div class="acts"><button class="btn primary" id="profile-rating-save" disabled>إرسال التقييم</button></div>`,
      (dialog, close) => {
        let selectedRating = 0;
        const saveButton = $("#profile-rating-save", dialog);
        dialog.querySelectorAll("[data-rating]").forEach((button) => {
          button.onclick = () => {
            selectedRating = Number(button.dataset.rating);
            saveButton.disabled = false;
            dialog.querySelectorAll("[data-rating]").forEach((star) => {
              star.classList.toggle(
                "selected",
                Number(star.dataset.rating) <= selectedRating,
              );
            });
          };
        });
        saveButton.onclick = close;
      },
    );

  $("#profile-settings", view).onclick = () =>
    modal(
      `<h2>إعدادات الحساب</h2>
       <div class="list">
        <div class="li"><span class="grow"><b>الاسم</b><small>${profileName}</small></span></div>
        <div class="li"><span class="grow"><b>القسم</b><small>${profileDepartment}</small></span></div>
        <div class="li"><span class="grow"><b>المسمى الوظيفي</b><small>${esc(currentUser?.roleLabel || "دكتور")}</small></span></div>
       </div>
       <div class="acts"><button class="btn primary ok">إغلاق</button></div>`,
      (dialog, close) => {
        $(".ok", dialog).onclick = close;
      },
    );

  $("#profile-logout", view).onclick = () => Auth.logout();
}

// ---------- السجلات الأكاديمية: مسؤول السجلات الأكاديمية ----------
const ACADEMIC_RECORDS_KEY = "uniway_academic_records";

const loadAcademicRecords = () => {
  try {
    const records = JSON.parse(localStorage.getItem(ACADEMIC_RECORDS_KEY) || "[]");
    return Array.isArray(records) ? records : [];
  } catch (_) {
    return [];
  }
};

const saveAcademicRecords = (records) => {
  localStorage.setItem(ACADEMIC_RECORDS_KEY, JSON.stringify(records));
};

function academicRecordsPage(view) {
  let records = loadAcademicRecords();

  const render = () => {
    records = loadAcademicRecords();
    view.innerHTML =
      pageHead(
        "السجلات الأكاديمية",
        "رفع واستعراض السجلات الأكاديمية بصيغة PDF",
        '<button class="btn primary" id="add-academic-record">رفع سجلات PDF</button>',
      ) +
      `<div class="grid g2" style="margin-bottom:16px">
        <div class="card">
          <h3>رفع سجل أكاديمي PDF</h3>
          <p style="color:var(--sub);font-size:12px;line-height:1.8">اختر عدة ملفات PDF وحدد بيانات الطالب والسنة والفصل الدراسي للرفع دفعة واحدة.</p>
          <div id="academic-upload" style="margin-top:12px"></div>
        </div>
        <div class="card">
          <h3>ملخص السجلات</h3>
          <div class="grid g3" style="margin-top:12px">
            ${stat("إجمالي السجلات", records.length, "file", "blue")}
            ${stat("الطلاب", new Set(records.map((record) => record.studentCode)).size, "users", "green")}
            ${stat("ملفات PDF", records.filter((record) => (record.fileName || "").toLowerCase().endsWith(".pdf")).length, "file", "amber")}
          </div>
        </div>
      </div>
      <div style="height:16px"></div>
      <div class="card"><h3>السجلات المحفوظة</h3><div id="academic-table"></div></div>`;

    createUpload($("#academic-upload", view), {
      exts: ["pdf"],
      maxMB: 10,
      multiple: true,
      onPick: (files) => {
        if (files?.length) openAcademicRecordModal(null, () => render(), files);
      },
    });

    $("#add-academic-record", view).onclick = () => openAcademicRecordModal(null, () => render());
    renderAcademicTable();
  };

  const renderAcademicTable = () => {
    const host = $("#academic-table", view);
    if (!host) return;
    createTable(host, {
      rows: records,
      pageSize: 10,
      search: {
        placeholder: "ابحث بالكود أو اسم الطالب أو اسم الملف...",
        test: (record, query) =>
          `${record.studentCode} ${record.studentName} ${record.fileName}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      },
      cols: [
        { title: "الطالب", render: (record) => `<b>${esc(record.studentName)}</b><br><small dir="ltr">${esc(record.studentCode)}</small>` },
        { title: "ملف السجل", render: (record) => `<b>${esc(record.fileName || "سجل أكاديمي.pdf")}</b><br><small>${esc(record.fileSize || "")}</small>` },
        { title: "السنة والفصل", render: (record) => `${esc(record.academicYear)} · ${esc(record.semester)}` },
        { title: "الحالة", render: (record) => badge(record.status || "مسجل", record.status === "ناجح" ? "green" : "blue") },
        { title: "الإجراءات", render: (record) => `<button class="btn ghost" type="button" data-view-record="${esc(record.id)}">عرض PDF</button> <button class="btn ghost" type="button" data-edit-record="${esc(record.id)}">تعديل</button> <button class="btn ghost" type="button" data-delete-record="${esc(record.id)}" style="color:var(--bad)">حذف</button>` },
      ],
      empty: empty("لا توجد سجلات أكاديمية", "ارفع ملف PDF لإضافة سجل أكاديمي."),
      onRender: (body) => {
        body.querySelectorAll("[data-view-record]").forEach((button) => {
          button.onclick = () => {
            const record = records.find((item) => item.id === button.dataset.viewRecord);
            if (!record?.fileData) {
              toast("ملف PDF غير متاح في هذه النسخة التجريبية.", "red");
              return;
            }
            const win = window.open();
            if (win) {
              win.document.title = record.fileName || "السجل الأكاديمي";
              win.document.body.innerHTML = `<iframe title="${esc(record.fileName || "السجل الأكاديمي")}" src="${record.fileData}" style="position:fixed;inset:0;width:100%;height:100%;border:0"></iframe>`;
            }
          };
        });
        body.querySelectorAll("[data-edit-record]").forEach((button) => {
          button.onclick = () => {
            const record = records.find((item) => item.id === button.dataset.editRecord);
            openAcademicRecordModal(record, () => render());
          };
        });
        body.querySelectorAll("[data-delete-record]").forEach((button) => {
          button.onclick = () => confirmDlg({
            title: "حذف السجل الأكاديمي",
            body: "سيتم حذف هذا السجل نهائيًا من النظام.",
            label: "حذف",
            danger: true,
            onOk: () => {
              records = records.filter((item) => item.id !== button.dataset.deleteRecord);
              saveAcademicRecords(records);
              render();
              toast("تم حذف السجل.");
            },
          });
        });
      },
    });
  };

  function openAcademicRecordModal(existing, onSaved, pdfFiles = []) {
    if (!Array.isArray(pdfFiles)) pdfFiles = pdfFiles ? [pdfFiles] : [];
    const pdfFile = pdfFiles[0] || null;
    const current = existing || {
      studentCode: "", studentName: "",
      academicYear: "", semester: "", status: "مرفوع",
      fileName: pdfFile?.name || "",
      fileSize: pdfFile ? `${(pdfFile.size / 1048576).toFixed(2)} MB` : "",
    };
    modal(
      `<h2>${existing ? "تعديل سجل أكاديمي PDF" : "رفع سجل أكاديمي PDF"}</h2>
       <div class="grid g2">
        ${field("كود الطالب *", `<input class="input" id="ar-code" dir="ltr" value="${esc(current.studentCode)}">`, "ar-code")}
        ${field("اسم الطالب *", `<input class="input" id="ar-name" value="${esc(current.studentName)}">`, "ar-name")}
        ${field("السنة الدراسية *", `<input class="input" id="ar-year" value="${esc(current.academicYear)}">`, "ar-year")}
        ${field("الفصل الدراسي *", `<input class="input" id="ar-semester" value="${esc(current.semester)}">`, "ar-semester")}
        ${field("الحالة", `<input class="input" id="ar-status" value="${esc(current.status)}">`, "ar-status")}
       </div>
       ${pdfFiles.length || existing?.fileName ? `<div class="field"><label>ملفات PDF</label><div class="box" style="justify-content:flex-start;height:auto;min-height:50px;flex-wrap:wrap"><b>${esc(pdfFiles.length ? pdfFiles.map(file => file.name).join(" · ") : existing.fileName)}</b></div></div>` : ""}
       ${!existing && !pdfFiles.length ? '<div class="field"><label>ملفات PDF *</label><input class="input" id="ar-pdf" type="file" accept=".pdf,application/pdf" multiple></div>' : ""}
       <div class="acts"><button class="btn primary" id="ar-save">${existing ? "حفظ التعديل" : "رفع السجل"}</button><button class="btn ghost" id="ar-cancel">إلغاء</button></div>`,
      (dialog, close) => {
        $("#ar-cancel", dialog).onclick = close;
        $("#ar-save", dialog).onclick = () => {
          const values = {
            studentCode: $("#ar-code", dialog).value.trim().toUpperCase(),
            studentName: $("#ar-name", dialog).value.trim(),
            academicYear: $("#ar-year", dialog).value.trim(),
            semester: $("#ar-semester", dialog).value.trim(),
            status: $("#ar-status", dialog).value.trim() || "مرفوع",
          };
          if (!values.studentCode || !values.studentName || !values.academicYear || !values.semester) {
            toast("يرجى استكمال كود واسم الطالب والسنة والفصل.", "red");
            return;
          }
          const nativeFiles = $("#ar-pdf", dialog)?.files
            ? Array.from($("#ar-pdf", dialog).files)
            : [];
          const selectedFiles = existing
            ? []
            : pdfFiles.length
              ? pdfFiles
              : nativeFiles;
          if (!existing && !selectedFiles.length) {
            toast("يرجى اختيار ملف PDF للسجل الأكاديمي.", "red");
            return;
          }
          for (const file of selectedFiles) {
            if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
              toast("يجب أن تكون جميع الملفات بصيغة PDF فقط.", "red");
              return;
            }
            if (file.size > 10 * 1048576) {
              toast(`الملف ${file.name} حجمه أكبر من 10MB.`, "red");
              return;
            }
          }
          if (existing) {
            const recordValues = {
              ...values,
              updatedAt: new Date().toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }),
            };
            records = records.map((record) => record.id === existing.id ? { ...record, ...recordValues } : record);
            saveAcademicRecords(records);
            close();
            onSaved();
            toast("تم تعديل السجل بنجاح.");
            return;
          }

          let loaded = 0;
          const newRecords = [];
          const finishBatch = () => {
            if (!newRecords.length) {
              toast("لا توجد ملفات جديدة للرفع.", "red");
              return;
            }
            records = [...newRecords.reverse(), ...records];
            try {
              saveAcademicRecords(records);
            } catch (_) {
              toast("تعذر حفظ الملفات محليًا بسبب مساحة التخزين. جرّب ملفات أصغر.", "red");
              return;
            }
            close();
            onSaved();
            toast(`تم رفع ${newRecords.length} ملف PDF بنجاح.`);
          };
          selectedFiles.forEach((file, index) => {
            const duplicate = records.some((record) =>
              record.studentCode === values.studentCode &&
              record.academicYear === values.academicYear &&
              record.semester === values.semester &&
              record.fileName === file.name
            );
            if (duplicate) {
              loaded += 1;
              if (loaded === selectedFiles.length) finishBatch();
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              newRecords.push({
                id: `AR-${Date.now()}-${index + 1}`,
                ...values,
                fileName: file.name,
                fileSize: `${(file.size / 1048576).toFixed(2)} MB`,
                fileData: String(reader.result || ""),
                updatedAt: new Date().toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }),
              });
              loaded += 1;
              if (loaded === selectedFiles.length) finishBatch();
            };
            reader.onerror = () => {
              loaded += 1;
              toast(`تعذر قراءة الملف ${file.name}.`, "red");
              if (loaded === selectedFiles.length) finishBatch();
            };
            reader.readAsDataURL(file);
          });
        };
      },
    );
  }

  render();
}

// ---------- SCRUM-97: مركز محادثات الدكتور ----------
function chatsPage(view, [id]) {
  let filter = "";
  const stu = studentById(id);
  let cur = threads.find((t) => t.sid === id);
  if (!cur && stu) {
    cur = { sid: stu.id, unread: 0, msgs: [] };
    threads.push(cur);
  }
  if (cur) cur.unread = 0;
  view.innerHTML =
    pageHead("مركز المحادثات", `${unreadTotal()} رسائل غير مقروءة`) +
    `<div class="chat"><div class="card ${id ? "hide-m" : ""}"><div style="padding:12px;border-bottom:1px solid var(--line)"><select class="select" id="flt" aria-label="فلتر المقرر"><option value="">كل المقررات</option>${courses.map((c) => `<option value="${c.code}">${c.code} – ${c.name}</option>`).join("")}</select></div><div class="scroll" id="list" style="padding:0"></div></div><div class="card ${id ? "" : "hide-m"}" id="pane"></div></div>`;
  function list() {
    const l = threads.filter(
      (t) => !filter || studentById(t.sid).course === filter,
    );
    $("#list", view).innerHTML = l.length
      ? l
          .map((t) => {
            const s = studentById(t.sid),
              last = t.msgs[t.msgs.length - 1];
            return `<a href="chats.html?id=${t.sid}" class="th ${t.sid === id ? "on" : ""}"><span class="avatar">${s.name[0]}</span><div style="flex:1;min-width:0"><b style="font-size:13px">${s.name}</b><div style="font-size:12px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(last.text || last.file)}</div></div>${t.unread ? badge(t.unread, "red") : ""}</a>`;
          })
          .join("")
      : empty("لا توجد محادثات", "", "chat");
  }
  $("#flt", view).onchange = (e) => {
    filter = e.target.value;
    list();
  };
  list();
  const pane = $("#pane", view);
  if (!id) {
    pane.innerHTML = empty(
      "اختر محادثة للبدء",
      "رسائل طلابك تظهر هنا بنفس الشات الموجود في تطبيق الموبايل.",
      "chat",
    );
    return;
  }
  if (!cur) {
    pane.innerHTML = errorBox(
      "المحادثة غير متاحة",
      "",
      '<a class="btn primary" href="chats.html">العودة للمحادثات</a>',
    );
    return;
  }
  pane.innerHTML = `<div style="padding:12px 14px;border-bottom:1px solid var(--line);display:flex;gap:10px;align-items:center"><span class="avatar">${stu.name[0]}</span><div style="flex:1"><b>${stu.name}</b><div style="font-size:12px;color:var(--mut)">${stu.id} · سياق المقرر: ${cname(stu.course)}</div></div><a class="btn ghost menu" href="chats.html">القائمة</a></div>
    <div class="scroll" id="msgs"></div><div class="compose"><input type="file" hidden id="f"><button class="btn ghost" id="clip" aria-label="إرفاق ملف">${icon("clip")}</button><input class="input" id="txt" type="text" autocomplete="off" aria-label="اكتب ردك" placeholder="اكتب ردك..."><button class="btn primary" id="snd" aria-label="إرسال" disabled>${icon("send")}</button></div>`;
  const msgs = $("#msgs", pane),
    txt = $("#txt", pane);
  const draw = () => {
    msgs.innerHTML = cur.msgs
      .map(
        (m) =>
          `<div class="bub ${m.from === "d" ? "me" : ""}">${m.file ? `<div>${icon("clip", 13)} ${esc(m.file)}</div>` : ""}${esc(m.text)}<small>${m.at}</small></div>`,
      )
      .join("");
    msgs.scrollTop = msgs.scrollHeight;
    list();
  };
  const send = (file) => {
    if (!txt.value.trim() && !file) return;
    cur.msgs.push({ from: "d", text: txt.value.trim(), at: "الآن", file });
    txt.value = "";
    $("#snd", pane).disabled = true;
    draw();
  };
  txt.oninput = () => ($("#snd", pane).disabled = !txt.value.trim());
  txt.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  };
  $("#snd", pane).onclick = () => send();
  $("#clip", pane).onclick = () => $("#f", pane).click();
  $("#f", pane).onchange = (e) => {
    if (e.target.files[0]) send(e.target.files[0].name);
    e.target.value = "";
  };
  draw();
}

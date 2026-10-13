// ===== الشيل + الراوتر + حماية المسارات (SCRUM-77) =====
const ROLE_NAME = { doctor: "دكتور", affairs: "شؤون الطلاب", admin: "أدمن" };
const HOME = { doctor: "#/doctor", affairs: "#/affairs", admin: "#/admin" };
const NAV = {
  doctor: [
    ["#/doctor", "لوحة الدكتور", "home"],
    ["#/doctor/courses", "مقرراتي", "book"],
    ["#/doctor/grades", "رفع الدرجات", "star"],
    ["#/doctor/lectures", "رفع محاضرة", "upload"],
    ["#/doctor/chats", "المحادثات", "chat"],
  ],
  affairs: [
    ["#/affairs", "لوحة شؤون الطلاب", "home"],
    ["#/affairs/requests", "الطلبات", "clipboard"],
    ["#/affairs/admissions", "طلبات الالتحاق", "users"],
    ["#/affairs/grade-appeals", "تظلمات", "star"],
    ["#/affairs/students", "البحث عن طالب", "search"],
    ["#/affairs/conversations", "محادثات الطلاب", "chat"],
    ["#/affairs/military-education", "التربية العسكرية", "file"],
  ],
  admin: [
    ["#/admin", "لوحة الأدمن", "home"],
    ["#/admin/users", "المستخدمون", "users"],
  ],
};
let role = "doctor";
const go = (h) => {
  location.hash = h;
};
const ROUTES = [
  ["doctor", /^\/doctor$/, dashboard],
  ["doctor", /^\/doctor\/profile$/, doctorProfilePage],
  ["doctor", /^\/doctor\/courses$/, coursesPage],
  ["doctor", /^\/doctor\/courses\/([^/]+)$/, courseDetail],
  ["doctor", /^\/doctor\/grades$/, gradesPage],
  ["doctor", /^\/doctor\/lectures$/, lecturesPage],
  ["doctor", /^\/doctor\/chats(?:\/([^/]+))?$/, chatsPage],
  ["affairs", /^\/affairs$/, affairsDashboard],
  ["affairs", /^\/affairs\/requests\/([^/]+)$/, affairsRequestDetailPage],
  ["affairs", /^\/affairs\/requests$/, affairsRequestsPage],
  ["affairs", /^\/affairs\/admissions\/([^/]+)$/, affairsAdmissionDetailPage],
  ["affairs", /^\/affairs\/admissions$/, affairsAdmissionsPage],
  ["affairs", /^\/affairs\/grade-appeals\/([^/]+)$/, affairsGradeAppealDetailPage],
  ["affairs", /^\/affairs\/grade-appeals$/, affairsGradeAppealsPage],
  ["affairs", /^\/affairs\/students\/([^/]+)$/, affairsStudentDetailPage],
  ["affairs", /^\/affairs\/students$/, affairsStudentSearchPage],
  ["affairs", /^\/affairs\/documents$/, affairsStudentDocumentsPage],
  ["affairs", /^\/affairs\/conversations(?:\/([^/]+))?$/, affairsStudentConversationsPage],
  ["affairs", /^\/affairs\/military-education$/, affairsMilitaryEducationPage],
  ["admin", /^\/admin$/, adminDashboard],
  ["admin", /^\/admin\/users$/, adminUsersPage],
];

function buildShell() {
  $("#app").innerHTML =
    `<div class="app"><aside class="side" id="side"><div class="brand"><i>${icon("grad", 19)}</i>UNIWAY</div><nav class="nav" id="nav" aria-label="القائمة الرئيسية"></nav><div style="margin-top:auto;font-size:11px;color:rgba(255,255,255,.6);padding:8px">جامعتك... في طريق واحد</div></aside>
  <div style="min-width:0"><header class="top"><button class="iconbtn menu" id="menu" aria-label="القائمة">${icon("menu")}</button><div class="search">${icon("search", 16)}<input placeholder="ابحث عن طالب أو مقرر..." aria-label="بحث"></div><div style="flex:1"></div>
  <select class="select" id="role" style="width:150px" aria-label="تجربة الصلاحية" title="تجربة الصلاحية (للتجربة فقط)">${Object.keys(
    ROLE_NAME,
  )
    .map((r) => `<option value="${r}">${ROLE_NAME[r]}</option>`)
    .join("")}</select>
  <button class="iconbtn" aria-label="الإشعارات">${icon("bell")}<span class="dot" id="dot"></span></button><a class="avatar profile-trigger" id="profile-link" href="#/doctor/profile" aria-label="الملف الشخصي" title="الملف الشخصي">س</a></header><main class="page" id="view"></main></div></div>`;
  $("#menu").onclick = (e) => {
    e.stopPropagation();
    $("#side").classList.add("open");
  };
  $("#side").onclick = () => $("#side").classList.remove("open");
  $("#role").onchange = (e) => {
    role = e.target.value;
    go(HOME[role]);
    route();
  };
}

function route() {
  const [path, qs] = (location.hash.slice(1) || "/").split("?");
  const query = Object.fromEntries(new URLSearchParams(qs || ""));
  window.onbeforeunload = null;
  routeToken++;
  const hit = ROUTES.find((r) => r[1].test(path));
  // Route guard: لو المسار مش بتاع دور المستخدم أو مش موجود → صفحته الرئيسية
  if (!hit || hit[0] !== role) {
    if (location.hash !== HOME[role]) return go(HOME[role]);
  }
  $("#role").value = role;
  $("#nav").innerHTML = NAV[role]
    .map(
      ([h, l, i]) =>
        `<a href="${h}" class="${path === h.slice(1) || (h !== HOME[role] && path.startsWith(h.slice(1))) ? "on" : ""}">${icon(i)}${l}</a>`,
    )
    .join("");
  $("#dot").style.display = role === "doctor" && unreadTotal() ? "" : "none";
  $("#profile-link").style.display = role === "doctor" ? "grid" : "none";
  const view = $("#view");
  view.innerHTML = "";
  (hit || ROUTES[0]).slice(2)[0](
    view,
    hit ? path.match(hit[1]).slice(1) : [],
    query,
  );
  window.scrollTo(0, 0);
}
buildShell();
window.addEventListener("hashchange", route);
route();

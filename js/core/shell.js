// ===== سلوك الشيل المشترك لصفحات الأدوار (القائمة الجانبية، المستخدم، الخروج) =====
(() => {
  const user = Auth.current();
  if (!user) return;

  const menu = document.getElementById("menu");
  const side = document.getElementById("side");
  if (menu) {
    menu.onclick = (e) => {
      e.stopPropagation();
      side.classList.add("open");
    };
  }
  side.onclick = () => side.classList.remove("open");

  // دخول الأدمن إلى شاشة دور آخر (من نتائج البحث الشامل مثلًا) — استبدل القائمة الجانبية بقائمة الأدمن
  if (user.role === "admin" && !location.pathname.includes("/admin/")) {
    const nav = side.querySelector(".nav");
    if (nav) {
      const ADMIN_LINKS = [
        ["dashboard.html", "لوحة التحكم", "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10"],
        ["users.html", "إدارة المستخدمين", "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"],
        ["roles.html", "الصلاحيات والأدوار", "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"],
        ["settings.html", "إعدادات النظام", "M3 11v2a1 1 0 001 1h3l5 4V6L7 10H4a1 1 0 00-1 1zM16 8a5 5 0 010 8"],
        ["search.html", "البحث الشامل", "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35"],
        ["courses.html", "المقررات", "M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"],
        ["departments.html", "الأقسام", "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"],
        ["announcements.html", "الإعلانات الجامعية", "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"],
        ["faqs.html", "الأسئلة الشائعة", "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"],
      ];
      nav.innerHTML = ADMIN_LINKS.map(([href, label, d]) =>
        `<a href="../admin/${href}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>${label}</a>`
      ).join("");
      const brandLink = side.querySelector(".brand");
      if (brandLink) brandLink.setAttribute("href", "../admin/dashboard.html");
    }
  }

  // إخفاء روابط القائمة التي يفتقر إليها دور المستخدم الحالي صلاحيتها
  if (typeof Auth.pagePermission === "function") {
    side.querySelectorAll('.nav a[href]').forEach(a => {
      const file = a.getAttribute("href").split("?")[0].split("/").pop();
      const perm = Auth.pagePermission(file, document.body.dataset.role);
      if (perm && !Auth.can(perm)) a.style.display = "none";
    });
  }

  // اسم التطبيق والشعار من إعدادات النظام (لو الملف محمّل في الصفحة)
  if (typeof Settings !== "undefined") {
    const brand = side.querySelector(".brand");
    if (brand && Settings.get("appName")) {
      const text = brand.childNodes[brand.childNodes.length - 1];
      if (text && text.nodeType === Node.TEXT_NODE) text.textContent = Settings.get("appName");
    }
    const tagline = side.querySelector("div[style*='margin-top:auto']");
    if (tagline && Settings.get("appTagline")) tagline.textContent = Settings.get("appTagline");
  }

  const avatar = document.getElementById("profile-link");
  if (avatar) {
    avatar.textContent = user.short || user.name[0] || "؟";
    avatar.title = user.name;
  }
  const nameEl = document.getElementById("user-name");
  if (nameEl) nameEl.textContent = user.name;

  const dot = document.getElementById("dot");
  if (dot) dot.style.display = user.role === "doctor" && unreadTotal() ? "" : "none";

  const logout = document.getElementById("logout");
  if (logout) {
    // تحديث نص زر الخروج
    const span = logout.querySelector("span");
    if (span) span.textContent = "تسجيل خروج";

    logout.onclick = () => {
      // إنشاء نافذة تأكيد الخروج
      const overlay = document.createElement("div");
      overlay.id = "logout-confirm-overlay";
      overlay.style.cssText = [
        "position:fixed", "inset:0", "z-index:9999",
        "display:grid", "place-items:center", "padding:20px",
        "background:rgba(13,27,42,0.6)",
        "animation:fadeIn .18s ease"
      ].join(";");

      overlay.innerHTML = `
        <style>
          @keyframes fadeIn{from{opacity:0}to{opacity:1}}
          @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
          #logout-confirm-box{animation:slideUp .2s ease}
        </style>
        <div id="logout-confirm-box" style="
          width:100%;max-width:400px;padding:28px 24px 22px;
          border-radius:20px;background:#fff;text-align:center;
          box-shadow:0 24px 64px rgba(0,0,0,.28);
        ">
          <div style="
            display:grid;place-items:center;
            width:60px;height:60px;margin:0 auto 16px;
            border-radius:50%;background:#fee2e2;
          ">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </div>
          <h2 style="margin:0 0 8px;font-size:18px;font-weight:900;font-family:Cairo,sans-serif;color:#0d1b2a;">
            تسجيل الخروج
          </h2>
          <p style="margin:0 0 22px;font-size:13.5px;color:#4a6278;font-family:Cairo,sans-serif;line-height:1.8;">
            هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟
          </p>
          <div style="display:flex;gap:10px;justify-content:center;flex-direction:row-reverse;">
            <button id="logout-confirm-yes" style="
              flex:1;padding:11px;border:none;border-radius:12px;
              background:#dc2626;color:#fff;font-size:14px;font-weight:800;
              font-family:Cairo,sans-serif;cursor:pointer;
              transition:background .15s;
            ">نعم، تسجيل خروج</button>
            <button id="logout-confirm-no" style="
              flex:1;padding:11px;border:1px solid #dde3ec;border-radius:12px;
              background:#fff;color:#4a6278;font-size:14px;font-weight:700;
              font-family:Cairo,sans-serif;cursor:pointer;
              transition:background .15s;
            ">إلغاء</button>
          </div>
        </div>`;

      document.body.appendChild(overlay);

      const close = () => overlay.remove();
      document.getElementById("logout-confirm-no").onclick = close;
      overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
      document.getElementById("logout-confirm-yes").onclick = () => { close(); Auth.logout(); };

      // hover effects
      const yes = document.getElementById("logout-confirm-yes");
      const no  = document.getElementById("logout-confirm-no");
      yes.onmouseenter = () => yes.style.background = "#b91c1c";
      yes.onmouseleave = () => yes.style.background = "#dc2626";
      no.onmouseenter  = () => no.style.background  = "#f4f7fa";
      no.onmouseleave  = () => no.style.background  = "#fff";
    };
  }

  // صندوق البحث في الشريط العلوي للأدمن → البحث الشامل (يعمل أيضًا من شاشات الأدوار الأخرى)
  if (user.role === "admin") {
    document.querySelectorAll(".top .search input").forEach(inp => {
      inp.addEventListener("keydown", e => {
        const q = inp.value.trim();
        if (e.key === "Enter" && q) go("../admin/search.html?q=" + encodeURIComponent(q));
      });
    });
  }
})();

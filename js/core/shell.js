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
  if (logout) logout.onclick = () => Auth.logout();

  // صندوق البحث في الشريط العلوي لصفحات الأدمن → البحث الشامل
  if (document.body.dataset.role === "admin") {
    document.querySelectorAll(".top .search input").forEach(inp => {
      inp.addEventListener("keydown", e => {
        const q = inp.value.trim();
        if (e.key === "Enter" && q) go("search.html?q=" + encodeURIComponent(q));
      });
    });
  }
})();

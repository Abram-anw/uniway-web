const ACCOUNT_NOTIFICATION_PREFIX = "uniway_notifications_";

function notificationsPage(view) {
  const user = Auth.current();
  const key = `${ACCOUNT_NOTIFICATION_PREFIX}${user.code}`;
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  const saved = new Map(existing.map(item => [item.id, item]));
  const notifications = accountNotificationSeeds(user).map(item => ({
    ...item,
    read: saved.has(item.id) ? !!saved.get(item.id).read : false,
  }));

  const persist = () => localStorage.setItem(key, JSON.stringify(notifications));
  const render = () => {
    const unreadCount = notifications.filter(item => !item.read).length;
    view.innerHTML = `
      ${pageHead("الإشعارات", unreadCount ? `لديك ${unreadCount} إشعارات غير مقروءة` : "أنت مطّلع على كل جديد", unreadCount ? '<button class="btn ghost" type="button" id="mark-all-read">تحديد الكل كمقروء</button>' : "")}
      ${notifications.length ? `<div class="notification-list">${notifications.map((item, index) => `
        <article class="card notification-card ${item.read ? "" : "unread"}">
          <span class="notification-mark" aria-hidden="true"></span>
          <div class="notification-content">
            <b>${esc(item.title)}</b>
            <p>${esc(item.body)}</p>
            <small>${esc(item.at)}</small>
          </div>
          <a class="btn outline" href="${esc(item.href)}" data-notification="${index}">عرض</a>
        </article>`).join("")}</div>` : `<div class="card">${empty("لا توجد إشعارات حاليًا", "ستظهر هنا التنبيهات الخاصة بحسابك.", "bell")}</div>`}`;

    const markAll = $("#mark-all-read", view);
    if (markAll) {
      markAll.onclick = () => {
        notifications.forEach(item => { item.read = true; });
        persist();
        render();
      };
    }
    view.querySelectorAll("[data-notification]").forEach(link => {
      link.onclick = () => {
        notifications[Number(link.dataset.notification)].read = true;
        persist();
      };
    });
    const dot = $("#dot");
    if (dot) dot.style.display = unreadCount ? "" : "none";
  };

  persist();
  render();
}

function accountProfilePage(view) {
  const user = Auth.current();
  const role = Auth.getRoleMeta()[user.role]?.label || user.role;
  const dashboardHref = `dashboard.html`;
  const messagesHref = user.role === "affairs" ? "conversations.html" : "dashboard.html";

  view.innerHTML = `
    <section class="account-profile">
      <header class="account-profile-hero">
        <div class="profile-avatar" aria-hidden="true">${esc(user.short || user.name[0] || "؟")}</div>
        <h1>${esc(user.name)}</h1>
        <p>${esc(role)}${user.department ? ` · ${esc(user.department)}` : ""}</p>
      </header>
      <div class="grid g2 account-details">
        <div class="card"><small>الاسم</small><b>${esc(user.name)}</b></div>
        <div class="card"><small>الدور</small><b>${esc(role)}</b></div>
        <div class="card"><small>الكود الوظيفي</small><b dir="ltr">${esc(user.code)}</b></div>
        <div class="card"><small>البريد الإلكتروني</small><b dir="ltr">${esc(user.email || "غير مسجل")}</b></div>
        <div class="card"><small>الإدارة / القسم</small><b>${esc(user.department || (user.role === "admin" ? "إدارة النظام" : "غير محدد"))}</b></div>
        <div class="card"><small>حالة الحساب</small><b>${user.status === "active" ? "نشط" : "غير نشط"}</b></div>
      </div>
      <div class="account-profile-actions">
        <a class="btn primary" href="${dashboardHref}">العودة للوحة التحكم</a>
        <a class="btn outline" href="notifications.html">الإشعارات</a>
        <a class="btn ghost" href="${messagesHref}">${user.role === "affairs" ? "محادثات الطلاب" : "إعدادات النظام"}</a>
        <button class="btn danger" id="account-logout" type="button">تسجيل الخروج</button>
      </div>
    </section>`;
  $("#account-logout", view).onclick = () => Auth.logout();
}

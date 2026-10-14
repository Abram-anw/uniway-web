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

  const avatar = document.getElementById("profile-link");
  if (avatar) {
    avatar.textContent = user.short;
    avatar.title = user.name;
  }
  const name = document.getElementById("user-name");
  if (name) name.textContent = user.name;

  const dot = document.getElementById("dot");
  if (dot) dot.style.display = user.role === "doctor" && unreadTotal() ? "" : "none";

  const logout = document.getElementById("logout");
  if (logout) logout.onclick = () => Auth.logout();
})();

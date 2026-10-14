// ===== تسجيل الدخول والصلاحيات (نسخة تجريبية) =====
// تنبيه: الحسابات هنا للعرض فقط. في النسخة الفعلية يجب التحقق من الكود وكلمة المرور
// والصلاحيات على الخادم، لأن أي كود JavaScript في المتصفح يمكن قراءته أو تعديله.
const Auth = (() => {
  const KEY = "uniway_session";
  const ACCOUNTS = [
    { code: "DR1001", password: "123456", role: "doctor", roleLabel: "دكتور", name: "د. سارة القحطاني", short: "س", home: "doctor/dashboard.html" },
    { code: "SA2001", password: "123456", role: "affairs", roleLabel: "شؤون الطلاب", name: "سارة", short: "سارة", home: "affairs/dashboard.html" },
    { code: "AD3001", password: "123456", role: "admin", roleLabel: "أدمن", name: "مدير النظام", short: "أ", home: "admin/dashboard.html" },
  ];
  const find = (code) => ACCOUNTS.find((a) => a.code === code);
  const read = (store) => {
    try {
      return find(JSON.parse(store.getItem(KEY) || "null")?.code) || null;
    } catch (e) {
      return null;
    }
  };
  return {
    accounts: ACCOUNTS,
    // يرجع الحساب لو الكود والباسورد صح، وإلا null
    login(code, password, remember) {
      const account = ACCOUNTS.find((a) => a.code === String(code).trim().toUpperCase() && a.password === password);
      if (!account) return null;
      try {
        sessionStorage.removeItem(KEY);
        localStorage.removeItem(KEY);
        (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify({ code: account.code }));
      } catch (e) {}
      return account;
    },
    current() {
      try {
        return read(sessionStorage) || read(localStorage);
      } catch (e) {
        return null;
      }
    },
    logout() {
      try {
        sessionStorage.removeItem(KEY);
        localStorage.removeItem(KEY);
      } catch (e) {}
      location.href = "../index.html";
    },
    // حماية الصفحة: لو مفيش جلسة أو الدور مش دور الصفحة → رجوع لصفحة الدخول
    requireRole(role) {
      const user = this.current();
      if (user && user.role === role) return user;
      document.documentElement.style.visibility = "hidden";
      location.replace(user ? "../" + user.home : "../index.html");
      return null;
    },
  };
})();

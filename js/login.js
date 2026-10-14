// ===== منطق صفحة تسجيل الدخول: التحقق ثم التحويل لصفحة الدور =====
(() => {
  // لو في جلسة شغالة، وديه لصفحته على طول
  const existing = Auth.current();
  if (existing) {
    location.replace(existing.home);
    return;
  }

  const $ = (s) => document.querySelector(s);
  const code = $("#code");
  const password = $("#password");
  const alertBox = $("#form-alert");

  const setError = (field, message) => {
    $(`#err-${field}`).textContent = message || "";
    $(`#box-${field}`).classList.toggle("bad", !!message);
  };
  const clearAll = () => {
    setError("code");
    setError("password");
    alertBox.hidden = true;
  };
  const showAlert = (message, tone = "bad") => {
    alertBox.textContent = message;
    alertBox.className = `alert ${tone}`;
    alertBox.hidden = false;
  };

  code.addEventListener("input", clearAll);
  password.addEventListener("input", clearAll);

  $("#toggle-pw").onclick = (e) => {
    const show = password.type === "password";
    password.type = show ? "text" : "password";
    e.currentTarget.setAttribute("aria-pressed", String(show));
    e.currentTarget.setAttribute("aria-label", show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور");
  };

  $("#forgot").onclick = () => {
    clearAll();
    showAlert("لإعادة تعيين كلمة المرور تواصل مع إدارة النظام (نسخة تجريبية).", "info");
  };

  document.querySelectorAll(".fill").forEach((button) => {
    button.onclick = () => {
      clearAll();
      code.value = button.dataset.code;
      password.value = button.dataset.password;
      password.focus();
    };
  });

  $("#login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    clearAll();
    const codeValue = code.value.trim();
    const passwordValue = password.value;
    let invalid = false;
    if (!codeValue) {
      setError("code", "الكود الجامعي مطلوب");
      invalid = true;
    }
    if (!passwordValue) {
      setError("password", "كلمة المرور مطلوبة");
      invalid = true;
    }
    if (invalid) return;

    const account = Auth.login(codeValue, passwordValue, $("#remember").checked);
    if (!account) {
      showAlert("الكود الجامعي أو كلمة المرور غير صحيحة.");
      password.select();
      return;
    }
    $("#submit").disabled = true;
    $("#submit").textContent = "جاري الدخول...";
    location.href = account.home; // دكتور / شؤون / أدمن حسب الحساب
  });
})();

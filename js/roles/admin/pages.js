// صفحات الأدمن: الهيكل في admin/*.html، وهنا فقط ملء الأرقام
const adminDashboard = (view) => {
  const statValues = {
    accounts: Auth.accounts.length,
    students: students.length,
    courses: courseCatalog.length,
    requests: studentRequests.length,
  };
  Object.entries(statValues).forEach(([key, value]) => {
    $(`[data-stat="${key}"]`, view).textContent = value;
  });
};

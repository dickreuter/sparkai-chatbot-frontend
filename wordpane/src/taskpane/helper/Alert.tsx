export const displayAlert = (message, type) => {
  const alertDiv = document.createElement("div");
  // Add higher z-index so the alert shows on top of other elements like modals
  alertDiv.style.zIndex = "1050"; // Bootstrap's modal z-index is usually 1040
  alertDiv.className = `alert alert-${type} fixed-bottom text-center mb-0 rounded-0`;
  alertDiv.innerHTML = message;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
};

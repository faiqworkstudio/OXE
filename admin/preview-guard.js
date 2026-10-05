// Loaded inside the admin's live preview: links ask the admin to open that page's editor
// instead of navigating, and forms never submit.
document.addEventListener("click", function (e) {
  var a = e.target.closest("a");
  if (!a) return;
  var h = a.getAttribute("href") || "";
  if (h.charAt(0) === "#") return;
  e.preventDefault();
  parent.postMessage({ oxePreviewNav: a.href }, "*");
}, true);
document.addEventListener("submit", function (e) { e.preventDefault(); }, true);

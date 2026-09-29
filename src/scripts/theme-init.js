(function () {
  var d = document.documentElement.classList, t = null, dark = true;
  d.add("js");
  try { t = localStorage.getItem("color-theme"); } catch {}
  if (t === "light") dark = false;
  else if (t === "system") {
    try { dark = matchMedia("(prefers-color-scheme: dark)").matches; } catch {}
  }
  d.toggle("dark", dark);
})();

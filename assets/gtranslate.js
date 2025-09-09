// === Google Translate: site-wide initializer + custom API ===

// Persist language across pages using both cookie + localStorage
function setGoogTransCookie(from, to){
  var pair = "/" + (from || "en") + "/" + to;
  var d = new Date(); d.setTime(d.getTime() + 365*24*60*60*1000);
  var expires = "expires=" + d.toUTCString();
  // set for current host
  document.cookie = "googtrans=" + pair + "; " + expires + "; path=/";
  // also try with dot-domain (helps on apex/subdomains; ignore failures)
  try {
    var host = location.hostname;
    var dot = host.indexOf(".") === 0 ? host : "." + host;
    document.cookie = "googtrans=" + pair + "; " + expires + "; domain=" + dot + "; path=/";
  } catch(_) {}
  try { localStorage.setItem("g_lang", to); } catch(_) {}
}

// Programmatic change using the injected select
function applyLanguage(lang){
  var combo = document.querySelector("select.goog-te-combo");
  if (!combo) return false;
  if (combo.value === lang) return true;
  combo.value = lang;
  // Fire native change
  combo.dispatchEvent(new Event("change"));
  return true;
}

// Public API: call this from your buttons/menus
window.GTranslate = {
  set: function(lang){           // e.g. 'de', 'fr', 'es'
    setGoogTransCookie("en", lang);
    if (!applyLanguage(lang)) {  // if widget not ready yet, retry shortly
      var tries = 0;
      var t = setInterval(function(){
        tries++;
        if (applyLanguage(lang) || tries > 40) clearInterval(t);
      }, 250);
    }
  },
  get: function(){
    try {
      var v = localStorage.getItem("g_lang");
      if (v) return v;
      var m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
      if (m && m[1]) return m[1].split("/").pop() || "en";
    } catch(_) {}
    return "en";
  }
};

// Callback for Google’s script
window.initGTranslate = function(){
  // Build the widget (hidden/minimal—use your own UI)
  new google.translate.TranslateElement({
    pageLanguage: "en",
    includedLanguages: [
      "de","fr","es","it","pt","nl",
      "pl","sv","da","fi","no","tr","cs","ro","hu","el",
      "ar","ru","uk","hi","id","ms","th","vi","ja","ko","zh-CN","zh-TW"
    ].join(","),
    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
    autoDisplay: false
  }, "gtranslate_container");

  // If a language was picked earlier, apply it now
  var saved = window.GTranslate.get();
  if (saved && saved !== "en") {
    // Wait a tick so the <select> is in DOM
    setTimeout(function(){ window.GTranslate.set(saved); }, 300);
  }
};

// Small helper to keep React/SPAs translated after big DOM swaps:
// call this after major route changes if needed.
window.reapplyGTranslate = function(){
  var saved = window.GTranslate.get();
  if (saved && saved !== "en") setTimeout(function(){ window.GTranslate.set(saved); }, 150);
};

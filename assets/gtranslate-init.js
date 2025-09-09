/* /assets/gtranslate-init.js */
(function(){
  if (window.__GT_LOADED__) return; window.__GT_LOADED__ = true;

  // --- settings ---
  var LANGS = "de,fr,es,it,pt,nl,pl,sv,da,fi,no,tr,cs,ro,hu,el,ar,ru,uk,hi,id,ms,th,vi,ja,ko,zh-CN,zh-TW";
  var PAGE_LANG = "en"; // your default authoring language

  // --- utils ---
  function setCookie(name, value) {
    var d = new Date(); d.setTime(d.getTime() + 365*24*60*60*1000);
    var expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + "; " + expires + "; path=/";
    try {
      var dot = "." + location.hostname.replace(/^www\./,'');
      document.cookie = name + "=" + value + "; " + expires + "; domain=" + dot + "; path=/";
    } catch(e){}
  }
  function getSaved(){
    try {
      var v = localStorage.getItem("g_lang"); if (v) return v;
      var m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
      if (m && m[1]) return (m[1].split("/").pop()||"").trim();
    } catch(e){}
    return "";
  }
  function apply(lang){
    var sel = document.querySelector("select.goog-te-combo");
    if (!sel) return false;
    if (sel.value !== lang) {
      sel.value = lang;
      sel.dispatchEvent(new Event("change"));
    }
    return true;
  }

  // --- public API so your own buttons can call it: GTranslate.set('de') ---
  window.GTranslate = {
    set: function(lang){
      if (!lang) return;
      setCookie("googtrans", "/" + PAGE_LANG + "/" + lang);
      try { localStorage.setItem("g_lang", lang); } catch(e){}
      if (!apply(lang)) {
        var tries = 0, t = setInterval(function(){
          if (apply(lang) || ++tries > 40) clearInterval(t);
        }, 250);
      }
      try { window.dispatchEvent(new CustomEvent("gtranslate:change", { detail:{lang} })); } catch(e){}
      try { document.documentElement.setAttribute("lang", lang); } catch(e){}
    },
    get: function(){ return getSaved() || PAGE_LANG; }
  };

  // --- add container (bottom-right bubble) ---
  var wrap = document.getElementById("gtranslate_container");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "gtranslate_container";
    wrap.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:999999;background:#12161f;"+
                         "border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:8px 10px;color:#fff;"+
                         "box-shadow:0 10px 24px rgba(0,0,0,.35);font:13px system-ui,-apple-system,Segoe UI,Roboto,sans-serif";
    wrap.innerHTML = '<div id="gtranslate_widget" style="display:flex;align-items:center;gap:8px">'+
                     '  <span style="opacity:.8">🌐</span>'+
                     '  <div id="gtranslate_mount"></div>'+
                     '</div>';
    document.documentElement.appendChild(wrap);
  }

  // --- init callback required by Google ---
  window.googleTranslateElementInit = function(){
    new google.translate.TranslateElement({
      pageLanguage: PAGE_LANG,
      includedLanguages: LANGS,
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: false // no auto-banner on first load unless user picks a language
    }, "gtranslate_mount");

    // Re-apply saved language after widget renders (persisted by us)
    var saved = getSaved();
    if (saved && saved !== PAGE_LANG) {
      setTimeout(function(){ window.GTranslate.set(saved); }, 400);
    }

    // Keep branding minimal but DO NOT hide the top banner so users can close it.
    // (Remove only small gadget text; leave banner visible and functional.)
    var css = document.createElement("style");
    css.textContent =
      /* DO NOT hide .goog-te-banner-frame; let users click ✕ themselves */
      ".goog-te-gadget span{display:none!important}" +
      ".goog-logo-link{display:none!important}";
      // Note: we also don't force body{top:0} so the banner can push content down until closed.
    document.head.appendChild(css);
  };

  // --- load Google script once ---
  var s = document.createElement("script");
  s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  s.async = true;
  document.head.appendChild(s);

  // --- if your pages dynamically change content (SPAs), re-apply on mutations ---
  try {
    var mo = new MutationObserver(function(){
      var saved = getSaved();
      if (saved && saved !== PAGE_LANG) apply(saved);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  } catch(e){}
})();

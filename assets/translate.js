// ====== Credibe I18N (button-trigger full page translate) ======
(() => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.CREDIBE_I18N?.__ready) return;

  /* -------------------- Supported languages -------------------- */
  const SUPPORTED = ["en","de","fr","es","it","pt","nl"];
  const LANG_NAMES = {
    en:"English", de:"Deutsch", fr:"Français", es:"Español",
    it:"Italiano", pt:"Português", nl:"Nederlands"
  };

  /* -------------------- Dictionary -------------------- */
  // IMPORTANT: Every EN string that appears as literal text on your site
  // should exist here so the global scanner can replace it when no data-i18n is present.
  const T = {
    en: {
      /* Meta / ARIA */
      "meta.title":"🏦 Credibe — Home",
      "meta.description":"Credibe — modern money: smarter accounts, instant transfers, clear fees, powerful controls.",
      "aria.translate":"Translate",
      "aria.search":"Open command palette",
      "aria.logo":"Credibe – banking, beautifully simple",
      "aria.menu":"Open menu",
      "aria.prev":"Previous",
      "aria.next":"Next",
      "aria.closeMenu":"Close menu",

      /* Header / Drawer / Footer */
      "header.tagline":"Smart. Secure. Seamless",
      "header.search":"Search actions",
      "header.login":"Login",
      "drawer.menu":"Menu",
      "drawer.apply":"Apply for an Account",
      "footer.company":"Company",
      "footer.about":"About",
      "footer.careers":"Careers",
      "footer.contact":"Contact",
      "footer.follow":"Follow Us",
      "footer.privacy":"Privacy Policy",
      "footer.terms":"Terms",
      "footer.rights":"All rights reserved.",
      "footer.emailLabel":"Email:",
      "footer.phoneLabel":"Phone:",
      "footer.disclaimer":"Credibe is a financial technology company. Some services may be provided by partner institutions. Eligible deposits may be protected to applicable limits.",

      /* Nav */
      "nav.personal":"Personal",
      "nav.personal.open":"Open an Account",
      "nav.personal.savings":"Savings Accounts",
      "nav.personal.checking":"Checking Accounts",
      "nav.personal.loans":"Personal Loans",
      "nav.personal.transfers":"Money Transfers",

      "nav.business":"Business",
      "nav.business.accounts":"Corporate Accounts",
      "nav.business.loans":"Business Loans",
      "nav.business.merchant":"Merchant Services",
      "nav.business.intl":"International Transfers",

      "nav.loans":"Loans",
      "nav.loans.personal":"Personal Loans",
      "nav.loans.auto":"Auto Loans",
      "nav.loans.mortgage":"Mortgage Loans",
      "nav.loans.business":"Business Loans",
      "nav.loans.student":"Student Loans",

      "nav.invest":"Investments",
      "nav.invest.mutual":"Mutual Funds",
      "nav.invest.retire":"Retirement Plans",

      "nav.overview":"Overview",
      "nav.overview.story":"Our Story",
      "nav.overview.careers":"Careers",

      "nav.support":"Support",
      "nav.support.fraud":"Report Fraud",
      "nav.support.faq":"FAQs",
      "nav.support.chat":"Live Chat",

      /* Sections */
      "sec.quick":"Quick Actions",
      "sec.cards":"Cards & Plans",
      "sec.features":"Built here — and beyond",
      "sec.fees":"Transparent Fees",
      "sec.promos":"Special Promotions",
      "sec.security":"Your Security, Our Priority",
      "sec.faqs":"FAQs",
      "sec.testimonials":"What Our Customers Say",

      /* UI */
      "ui.explore":"Explore",
      "ui.go":"Go",

      /* Hero */
      "hero.0.title":"Money that moves like you do",
      "hero.0.body":"Open in minutes. Tap, send, split, save — all from one clean app.",
      "hero.0.cta":"Open an account",

      "hero.1.title":"Borrow with no guesswork",
      "hero.1.body":"Clear rates, fast decisions, flexible repayments. No jargon. No surprises.",
      "hero.1.cta":"Check eligibility",

      "hero.2.title":"Your finances — finally in one place",
      "hero.2.body":"Real-time insights, automated pots, spend controls and powerful search.",
      "hero.2.cta":"Explore dashboard",

      "hero.3.title":"Borderless when it matters",
      "hero.3.body":"Send abroad at transparent fees and real rates — before you hit ‘send’.",
      "hero.3.cta":"Send money",

      // Card inside hero
      "hero.account":"Current Account",
      "hero.today":"+2.1% today",
      "hero.transfers":"Transfers",
      "hero.savings":"Savings",
      "hero.loans":"Loans",
      "hero.transfer":"Transfer",
      "hero.open":"Open",

      /* Quick */
      "quick.0.title":"View Balance",
      "quick.0.body":"Everything you own, one tap away.",
      "quick.0.chip":"Live",

      "quick.1.title":"Transfer Funds",
      "quick.1.body":"Domestic payments in seconds.",
      "quick.1.chip":"Instant",

      "quick.2.title":"Apply for Loan",
      "quick.2.body":"Run a soft check in under a minute.",
      "quick.2.chip":"Eligibility",

      "quick.3.title":"Open Account",
      "quick.3.body":"Join in minutes. No paperwork drama.",
      "quick.3.chip":"Ready",

      "quick.today":"today",
      "quick.thisweek":"this week",

      /* Services */
      "svc.savings.title":"Savings Account",
      "svc.savings.sub":"Goals, pots & round-ups",
      "svc.home.title":"Home Loan",
      "svc.home.sub":"Mortgage, Auto & Personal",
      "svc.merchant.title":"Merchant Services",
      "svc.merchant.sub":"Smart payments for your business",
      "svc.invest.title":"Investments",
      "svc.invest.sub":"Simple portfolios & advisory (coming soon)",

      /* Features */
      "feat.fps.title":"Faster payments",
      "feat.fps.body":"Send & receive instantly — even on weekends.",
      "feat.dd.title":"Direct debits",
      "feat.dd.body":"Set up, tweak, or cancel in a tap.",
      "feat.wallets.title":"Mobile wallets",
      "feat.wallets.body":"Pay with your phone or watch anywhere it’s accepted.",
      "feat.cards.title":"Virtual & disposable cards",
      "feat.cards.body":"Extra-secure online purchases.",
      "feat.insights.title":"Insights",
      "feat.insights.body":"Live categories and weekly spend stories.",
      "feat.pots.title":"Pots",
      "feat.pots.body":"Automate savings with round-ups and rules.",
      "feat.fx.title":"Global transfers",
      "feat.fx.body":"Transparent fees and real rates.",
      "feat.teams.title":"Team accounts",
      "feat.teams.body":"Permissions, approvals and clean exports.",

      /* Fees */
      "fees.col.service":"Service",
      "fees.col.price":"Price",
      "fees.col.notes":"Notes",
      "fees.domestic":"Domestic transfers",
      "fees.free":"Free",
      "fees.domestic.note":"Instant via faster rails",
      "fees.atm":"Cash withdrawals (domestic)",
      "fees.atm.free":"Free up to £200/month",
      "fees.atm.note":"Then small fee",
      "fees.card":"Card payments",
      "fees.card.free":"Free",
      "fees.card.note":"Contactless & mobile wallets",
      "fees.intl":"International transfer",
      "fees.intl.price":"Low fixed fee",
      "fees.intl.note":"No hidden markups",
      "fees.disclaimer":"Full fee details in Terms. No hidden markups — ever.",

      /* Promotions */
      "promo.0.title":"Zero-fee domestic transfers",
      "promo.0.body":"Move money in seconds. No monthly cap.",
      "promo.1.title":"Lower-rate borrowing",
      "promo.1.body":"Personal and business — with clear totals up-front.",
      "promo.2.title":"Invest easily",
      "promo.2.body":"Recurring buys and simple bundles. Keep it tidy.",

      /* Trust */
      "trust.ssl":"SSL Secured",
      "trust.deposit":"Deposit Protection",
      "trust.iso":"ISO 27001 Certified",
      "trust.award":"Award-Winning 2025",

      /* FAQ */
      "faq.q0":"Is there a free plan?",
      "faq.a0":"Yes — open an account in minutes and upgrade anytime.",
      "faq.q1":"How fast are transfers?",
      "faq.a1":"Most domestic transfers land in seconds on supported rails.",
      "faq.q2":"What about international?",
      "faq.a2":"We show fees up-front and use real rates — no hidden markups.",
      "faq.q3":"How do I verify my identity?",
      "faq.a3":"Simple in-app checks with photo ID. Most verifications complete within minutes."
    },

    /* -------------------- Example: German -------------------- */
    de: {
      "meta.title":"🏦 Credibe — Startseite",
      "meta.description":"Credibe — modernes Geld: intelligentere Konten, sofortige Überweisungen, klare Gebühren, leistungsstarke Kontrollen.",
      "aria.translate":"Übersetzen",
      "aria.search":"Befehlspalette öffnen",
      "aria.logo":"Credibe – Banking, schön einfach",
      "aria.menu":"Menü öffnen",
      "aria.prev":"Zurück",
      "aria.next":"Weiter",
      "aria.closeMenu":"Menü schließen",

      "header.tagline":"Smart. Sicher. Nahtlos",
      "header.search":"Aktionen suchen",
      "header.login":"Anmelden",
      "drawer.menu":"Menü",
      "drawer.apply":"Konto eröffnen",
      "footer.company":"Unternehmen",
      "footer.about":"Über uns",
      "footer.careers":"Karriere",
      "footer.contact":"Kontakt",
      "footer.follow":"Folgen Sie uns",
      "footer.privacy":"Datenschutz",
      "footer.terms":"Bedingungen",
      "footer.rights":"Alle Rechte vorbehalten.",
      "footer.emailLabel":"E-Mail:",
      "footer.phoneLabel":"Telefon:",
      "footer.disclaimer":"Credibe ist ein FinTech-Unternehmen. Einige Services werden von Partnerinstituten bereitgestellt. Einlagen können bis zu den geltenden Grenzen geschützt sein.",

      "nav.personal":"Privat",
      "nav.personal.open":"Konto eröffnen",
      "nav.personal.savings":"Sparkonten",
      "nav.personal.checking":"Girokonten",
      "nav.personal.loans":"Privatkredite",
      "nav.personal.transfers":"Überweisungen",

      "nav.business":"Geschäftlich",
      "nav.business.accounts":"Firmenkonten",
      "nav.business.loans":"Geschäftskredite",
      "nav.business.merchant":"Händlerlösungen",
      "nav.business.intl":"Internationale Überweisungen",

      "nav.loans":"Kredite",
      "nav.loans.personal":"Privatkredite",
      "nav.loans.auto":"Autokredite",
      "nav.loans.mortgage":"Hypotheken",
      "nav.loans.business":"Geschäftskredite",
      "nav.loans.student":"Studienkredite",

      "nav.invest":"Investments",
      "nav.invest.mutual":"Investmentfonds",
      "nav.invest.retire":"Altersvorsorge",

      "nav.overview":"Überblick",
      "nav.overview.story":"Unsere Geschichte",
      "nav.overview.careers":"Karriere",

      "nav.support":"Support",
      "nav.support.fraud":"Betrug melden",
      "nav.support.faq":"FAQs",
      "nav.support.chat":"Live-Chat",

      "sec.quick":"Schnellaktionen",
      "sec.cards":"Karten & Tarife",
      "sec.features":"Hier gebaut — und darüber hinaus",
      "sec.fees":"Transparente Gebühren",
      "sec.promos":"Sonderaktionen",
      "sec.security":"Ihre Sicherheit, unsere Priorität",
      "sec.faqs":"Häufige Fragen",
      "sec.testimonials":"Was unsere Kund:innen sagen",

      "ui.explore":"Entdecken",
      "ui.go":"Los",

      "hero.0.title":"Geld, das sich bewegt wie du",
      "hero.0.body":"In Minuten eröffnen. Tippen, senden, teilen, sparen — in einer App.",
      "hero.0.cta":"Konto eröffnen",

      "hero.1.title":"Leihen ohne Ratespiel",
      "hero.1.body":"Klare Zinsen, schnelle Entscheidungen, flexible Rückzahlung.",
      "hero.1.cta":"Eignung prüfen",

      "hero.2.title":"Deine Finanzen — endlich an einem Ort",
      "hero.2.body":"Echtzeit-Insights, automatische Töpfe, Ausgabenkontrollen, Suche.",
      "hero.2.cta":"Dashboard erkunden",

      "hero.3.title":"Grenzenlos, wenn es zählt",
      "hero.3.body":"Auslandsüberweisungen mit realen Kursen und klaren Gebühren.",
      "hero.3.cta":"Geld senden",

      "hero.account":"Girokonto",
      "hero.today":"+2,1 % heute",
      "hero.transfers":"Überweisungen",
      "hero.savings":"Ersparnisse",
      "hero.loans":"Kredite",
      "hero.transfer":"Überweisen",
      "hero.open":"Öffnen",

      "quick.0.title":"Kontostand ansehen",
      "quick.0.body":"Alles, was du besitzt — nur einen Tipp entfernt.",
      "quick.0.chip":"Live",
      "quick.1.title":"Geld überweisen",
      "quick.1.body":"In Sekunden innerhalb des Landes.",
      "quick.1.chip":"Sofort",
      "quick.2.title":"Für Kredit bewerben",
      "quick.2.body":"Weiche Prüfung in unter einer Minute.",
      "quick.2.chip":"Eignung",
      "quick.3.title":"Konto eröffnen",
      "quick.3.body":"In Minuten beitreten. Kein Papierkram.",
      "quick.3.chip":"Bereit",

      "quick.today":"heute",
      "quick.thisweek":"diese Woche",

      "svc.savings.title":"Sparkonto",
      "svc.savings.sub":"Ziele, Töpfe & Aufrundungen",
      "svc.home.title":"Immobilienkredit",
      "svc.home.sub":"Hypothek, Auto & Privat",
      "svc.merchant.title":"Händlerlösungen",
      "svc.merchant.sub":"Smarte Zahlungen fürs Business",
      "svc.invest.title":"Investments",
      "svc.invest.sub":"Einfache Portfolios & Beratung (bald)",

      "feat.fps.title":"Schnellere Zahlungen",
      "feat.fps.body":"Senden & empfangen in Sekunden — auch am Wochenende.",
      "feat.dd.title":"Lastschriften",
      "feat.dd.body":"In einem Tipp einrichten, anpassen oder beenden.",
      "feat.wallets.title":"Mobile Wallets",
      "feat.wallets.body":"Mit Handy oder Uhr überall zahlen.",
      "feat.cards.title":"Virtuelle & Einwegkarten",
      "feat.cards.body":"Extra-sichere Onlinekäufe.",
      "feat.insights.title":"Insights",
      "feat.insights.body":"Live-Kategorien und wöchentliche Ausgabenberichte.",
      "feat.pots.title":"Töpfe",
      "feat.pots.body":"Sparen mit Aufrundungen & Regeln automatisieren.",
      "feat.fx.title":"Globale Überweisungen",
      "feat.fx.body":"Transparente Gebühren und echte Kurse.",
      "feat.teams.title":"Teamkonten",
      "feat.teams.body":"Rechte, Freigaben und saubere Exporte.",

      "fees.col.service":"Leistung",
      "fees.col.price":"Preis",
      "fees.col.notes":"Hinweise",
      "fees.domestic":"Inländische Überweisungen",
      "fees.free":"Kostenlos",
      "fees.domestic.note":"Sofort über Schnell-Zahlwege",
      "fees.atm":"Bargeldabhebungen (inländisch)",
      "fees.atm.free":"Bis 200 £/Monat kostenlos",
      "fees.atm.note":"Danach kleine Gebühr",
      "fees.card":"Kartenzahlungen",
      "fees.card.free":"Kostenlos",
      "fees.card.note":"Kontaktlos & Mobile Wallets",
      "fees.intl":"Internationale Überweisung",
      "fees.intl.price":"Geringe Festgebühr",
      "fees.intl.note":"Keine versteckten Aufschläge",
      "fees.disclaimer":"Alle Details in den Bedingungen. Keine versteckten Aufschläge — niemals.",

      "promo.0.title":"Inlandsüberweisungen ohne Gebühren",
      "promo.0.body":"Geld in Sekunden bewegen. Keine Monatsgrenze.",
      "promo.1.title":"Günstigere Kredite",
      "promo.1.body":"Privat & Geschäft — mit klaren Gesamtbeträgen im Voraus.",
      "promo.2.title":"Einfach investieren",
      "promo.2.body":"Wiederkehrende Käufe und einfache Bundles. Übersichtlich bleiben.",

      "trust.ssl":"SSL-gesichert",
      "trust.deposit":"Einlagenschutz",
      "trust.iso":"ISO 27001 zertifiziert",
      "trust.award":"Ausgezeichnet 2025",

      "faq.q0":"Gibt es einen kostenlosen Plan?",
      "faq.a0":"Ja — Konto in Minuten eröffnen und jederzeit upgraden.",
      "faq.q1":"Wie schnell sind Überweisungen?",
      "faq.a1":"Die meisten Inlandsüberweisungen sind in Sekunden da.",
      "faq.q2":"Und international?",
      "faq.a2":"Gebühren vorab, echte Kurse — keine versteckten Aufschläge.",
      "faq.q3":"Wie verifiziere ich meine Identität?",
      "faq.a3":"Einfache In-App-Prüfung mit Ausweis. Meist in Minuten erledigt."
    },

    /* Stubs for others (you can fill later; EN will fallback) */
    fr: { "header.tagline":"Intelligent. Sécurisé. Fluide" },
    es: {}, it: {}, pt: {}, nl: {}
  };

  /* -------------------- State helpers -------------------- */
  const getLang = () => {
    try {
      const raw = (localStorage.getItem("credibe_lang") || navigator.language || "en");
      return String(raw).slice(0,2).toLowerCase();
    } catch { return "en"; }
  };
  const setLang = (lng) => { try { localStorage.setItem("credibe_lang", lng); } catch {} };

  function t(key, fallback = "") {
    const lng  = getLang();
    const dict = T[lng] || T.en;
    return (key in dict) ? dict[key] : (T.en[key] ?? fallback);
  }

  /* -------------------- Reverse index (EN text -> key) -------------------- */
  let __revIndex = null;
  function buildReverseIndex() {
    if (__revIndex) return __revIndex;
    const map = new Map();
    const base = T.en || {};
    for (const [k, v] of Object.entries(base)) {
      if (typeof v !== "string" || !v.trim()) continue;
      const txt = v.trim();
      if (!map.has(txt)) map.set(txt, []);
      map.get(txt).push(k);
    }
    __revIndex = map;
    return __revIndex;
  }

  /* -------------------- DOM application -------------------- */
  function translateTextNode(node, dict, rev) {
    const raw = node.nodeValue;
    if (!raw) return;
    const trimmed = raw.trim();
    if (!trimmed) return;
    const parent = node.parentElement;
    if (parent?.hasAttribute?.("data-i18n-skip")) return;

    const keys = rev.get(trimmed);
    if (!keys || !keys.length) return;
    const key = keys[0];
    const replacement = dict[key];
    if (!replacement || replacement === trimmed) return;

    const leading = raw.match(/^\s*/)?.[0] ?? "";
    const trailing = raw.match(/\s*$/)?.[0] ?? "";
    node.nodeValue = leading + replacement + trailing;
  }

  function scanAndTranslateTextNodes(root, dict) {
    const rev = buildReverseIndex();
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (n) => {
          const p = n.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          const tag = p.tagName;
          if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || tag === "NOSCRIPT") {
            return NodeFilter.FILTER_REJECT;
          }
          if (p.hasAttribute("data-i18n")) return NodeFilter.FILTER_REJECT;
          if (p.hasAttribute("data-i18n-skip")) return NodeFilter.FILTER_REJECT;
          const txt = (n.nodeValue || "").trim();
          if (!txt) return NodeFilter.FILTER_REJECT;
          if (txt.length > 200) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      },
      false
    );
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => translateTextNode(node, dict, rev));
  }

  function applyTranslations(root = document) {
    try {
      const lng  = getLang();
      const dict = T[lng] || T.en;
      document.documentElement.setAttribute("lang", lng);

      // data-i18n text
      root.querySelectorAll("[data-i18n]").forEach(el=>{
        const k = el.getAttribute("data-i18n");
        if (k && dict[k] != null) el.textContent = dict[k];
      });

      // attributes: data-i18n-attrs="attr:key|attr2:key2"
      root.querySelectorAll("[data-i18n-attrs]").forEach(el=>{
        const spec = el.getAttribute("data-i18n-attrs");
        if (!spec) return;
        spec.split("|").forEach(pair=>{
          const [attr,key] = pair.split(":").map(s=>(s||"").trim());
          const val = dict[key];
          if (attr && key && val != null) el.setAttribute(attr, val);
        });
      });

      // page <title> support
      const titleEl = document.querySelector("title[data-i18n='meta.title']");
      if (titleEl) titleEl.textContent = dict["meta.title"] || T.en["meta.title"];

      // optional global scan of untagged text if body[data-i18n-scan]
      const shouldScan = document.body?.hasAttribute("data-i18n-scan");
      if (shouldScan) scanAndTranslateTextNodes(root, dict);
    } catch (e) {
      console.error("[CREDIBE_I18N] applyTranslations error:", e);
    }
  }

  function setLanguageAndTranslate(lng) {
    setLang(lng);
    applyTranslations(document);
    try {
      window.dispatchEvent(new CustomEvent("credibe:lang-change", { detail: { lang: lng } }));
    } catch {}
  }

  // Observe dynamically added nodes after a language switch (when scanning is on)
  let __observer = null;
  function enableAutoObserve() {
    if (__observer || !document.body?.hasAttribute("data-i18n-scan")) return;
    __observer = new MutationObserver((muts) => {
      const lng  = getLang();
      const dict = T[lng] || T.en;
      for (const m of muts) {
        m.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches?.("[data-i18n],[data-i18n-attrs]") || node.querySelector?.("[data-i18n],[data-i18n-attrs]")) {
              applyTranslations(node);
            }
            scanAndTranslateTextNodes(node, dict);
          } else if (node.nodeType === Node.TEXT_NODE) {
            scanAndTranslateTextNodes(node.parentElement || document, dict);
          }
        });
      }
    });
    __observer.observe(document.body, { childList: true, subtree: true });
  }

  // INIT
  window.CREDIBE_I18N = {
    getLang, setLang, applyTranslations,
    setLanguageAndTranslate, // <-- call this on click
    t,
    LANGS: SUPPORTED,
    NAMES: LANG_NAMES,
    __ready: true
  };

  document.addEventListener("DOMContentLoaded", () => {
    applyTranslations(document);
    enableAutoObserve();
  });
})();


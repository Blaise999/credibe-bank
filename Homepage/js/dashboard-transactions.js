// js/dashboard-transactions.js
// ======================================================================
//  CREDIBE – DASHBOARD TRANSACTIONS / FREEZE / FAKE + CUSTOM PINS
//  This file is responsible ONLY for transaction-related logic:
//  - Safe API reads
//  - Per-user freeze rules & hard caps
//  - Fake + custom “pinned” transactions
//  - Loading + rendering SENT / RECEIVED lists
// ======================================================================

// =============================
// CONFIG (safe storage reads)
// =============================
const API_BASE = "https://credibe-backends.onrender.com";

let _userToken = "";
let _userId = "";
try {
  _userToken = localStorage.getItem("userToken") || "";
  _userId = localStorage.getItem("userId") || "";
} catch (e) {
  console.warn("localStorage unavailable:", e?.message);
}

const userToken = _userToken;
const userId = _userId;
const AUTH_HDR = userToken ? { Authorization: `Bearer ${userToken}` } : {};
const FREEZE_CAP = new Date("2025-03-26T23:59:59"); // legacy (unchanged)

// 🔒 Hard cap user: last synthetic tx must be exactly on 21 Nov 2024, nothing after.
const HARD_CAP_USER = "68c1c45057a7c7822e2d8a9e";
const HARD_CAP_DATE = new Date("2024-11-21T23:59:59Z"); // inclusive cap (UTC)
const HARD_CAP_DAY = "2024-11-21"; // yyyy-mm-dd (UTC day string)
const HARD_CAP_NOONZ = "2024-11-21T12:00:00Z"; // default time to inject cap-day tx

// =============================
// UTILS
// =============================
async function safeFetchJSON(url) {
  try {
    const res = await fetch(url, { headers: { ...AUTH_HDR } });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    return JSON.parse(text);
  } catch (err) {
    console.error("❌ safeFetchJSON:", err.message);
    return [];
  }
}

function fmtDate(d) {
  const dt = new Date(d);
  return isNaN(dt)
    ? "Unknown"
    : dt.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function fmtAmount(n, sign) {
  const num = Number(n);
  if (!isFinite(num)) return "€0";
  const f = new Intl.NumberFormat("en-GB").format(num);
  if (sign === "-") return `-€${f}`;
  if (sign === "+") return `+€${f}`;
  return `€${f}`;
}

// Puts custom (pinned) first, then by date desc
function customFirstDesc(a, b) {
  const aC = !!a.isCustom;
  const bC = !!b.isCustom;
  if (aC !== bC) return bC - aC;
  const ad = new Date(a.date || a.createdAt);
  const bd = new Date(b.date || b.createdAt);
  return bd - ad;
}

function txnStatusBadge(status) {
  const base = "px-2 py-1 rounded-full text-xs font-semibold";
  const map = {
    approved: "bg-green-500/15 text-green-400 border border-green-500/20",
    pending: "bg-yellow-500/15 text-yellow-300 border border-yellow-500/20",
    rejected: "bg-red-500/15 text-red-400 border border-red-500/20",
  };
  return `<span class="${base} ${
    map[status] || "text-gray-400"
  }">${status}</span>`;
}

// helpers for date/day comparisons in UTC
function dayKeyUTC(dateLike) {
  const d = new Date(dateLike);
  if (isNaN(d)) return "";
  return d.toISOString().slice(0, 10); // yyyy-mm-dd
}

// =============================
// RENDER HELPERS
// =============================
function renderTxnRow(tx, view) {
  return `
    <tr class="text-[#e5e7eb]">
      <td class="p-3 text-sm">${fmtDate(tx.date)}</td>
      <td class="p-3 text-sm">${tx.party}</td>
      <td class="p-3 text-sm font-semibold">${fmtAmount(
        tx.amount,
        view === "sent" ? "-" : "+"
      )}</td>
      <td class="p-3 text-sm">${txnStatusBadge(tx.status)}</td>
    </tr>`;
}

function renderTxnCard(tx, view) {
  return `
    <article class="rounded-xl border border-white/5 bg-[#0e1526] p-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-lg bg-[#0b1220] grid place-items-center text-sm">
          ${view === "sent" ? "↗" : "↙"}
        </div>
        <div>
          <div class="text-white text-sm font-semibold">${tx.party}</div>
          <div class="text-xs text-[#9ca3af]">${fmtDate(tx.date)}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="text-sm font-bold ${
          view === "sent" ? "text-red-400" : "text-green-400"
        }">
          ${fmtAmount(tx.amount, view === "sent" ? "-" : "+")}
        </div>
        <div class="mt-1">${txnStatusBadge(tx.status)}</div>
      </div>
    </article>`;
}

/* ======================================================================
   🎯 FREEZE RULES (per-user per-stream caps + per-user anchors)
   ====================================================================== */
/**
 * For these users, hide any transactions after the cutoff date UNTIL the local anchor
 * (the first time this script ran on that browser). Anything newer than the anchor is allowed,
 * so brand-new real transfers still show up top.
 *
 * Backdated to "late last year, 2024" as requested.
 */
const FREEZE_RULES = {
  // Backdated to late 2024
  "68bd382f2d14412466be2387": {
    sent: new Date("2024-11-30T23:59:59Z"), // no SENT after Nov 30, 2024 (until anchor)
    received: new Date("2024-12-20T23:59:59Z"), // no RECEIVED after Dec 20, 2024 (until anchor)
  },
  // Also backdated to late 2024
  "68be26592fdca996014886a1": {
    sent: new Date("2024-11-30T23:59:59Z"),
    received: new Date("2024-12-20T23:59:59Z"),
  },
  // New: for 68c873044b9fc118eae4918b, last sent Aug 2 2025, last received July 31 2025
  "68c873044b9fc118eae4918b": {
    sent: new Date("2025-08-02T23:59:59Z"),
    received: new Date("2025-07-31T23:59:59Z"),
  },
  // New: for 69297b4bf57a8962d1a82739, freeze both streams at Oct 31, 2025
  "69297b4bf57a8962d1a82739": {
    sent: new Date("2025-10-24T23:59:59Z"),
    received: new Date("2025-10-22T23:59:59Z"),
  },

  "692adb4a0e800ae335ba6d64": {
    sent: new Date("2025-10-23T23:59:59Z"),
    received: new Date("2025-10-23T23:59:59Z"),
  },
};

// Per-user anchor: only defined if current user is in FREEZE_RULES
const ANCHOR_VERSION = "v1";
function getUserAnchor(uid) {
  if (!FREEZE_RULES[uid]) return null;
  const key = `txnFreezeAnchor_${uid}_${ANCHOR_VERSION}`;
  try {
    const ex = localStorage.getItem(key);
    if (ex) return new Date(ex);
  } catch {}
  const now = new Date();
  try {
    localStorage.setItem(key, now.toISOString());
  } catch {}
  return now;
}
const FREEZE_ANCHOR = getUserAnchor(userId);

// Hide if date is between stream freeze and anchor (these target users only)
// Also: enforce HARD_CAP for HARD_CAP_USER (absolute, inclusive).
function hiddenByUserFreeze(dateLike, txnType) {
  const d = new Date(dateLike);
  if (isNaN(d)) return false;

  // 🔒 Absolute inclusive cap for the special hard-cap user
  if (userId === HARD_CAP_USER) {
    return d > HARD_CAP_DATE; // allow anything <= cap date (incl. Nov 21)
  }

  // Per-stream freeze for configured users
  const rule = FREEZE_RULES[userId];
  if (!rule || !FREEZE_ANCHOR) return false;

  const freezeDate = txnType === "debit" ? rule.sent : rule.received;
  return d > freezeDate && d < FREEZE_ANCHOR;
}

/* ======================================================================
   🔹 STATIC FAKE TXNS
   ====================================================================== */
// Per-user cache so fakes respect user-specific rules (esp. HARD_CAP_USER)
const FAKE_KEY = `fakePairedTxns_v8_${userId || "anon"}_${
  userId === HARD_CAP_USER ? "cap1121" : "std"
}`;
const RECEIVED_CUTOFF = new Date("2025-08-15T23:59:59Z"); // for non-target users

function randomDateISOWithin(days) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * days));
  return d.toISOString();
}
function randomDateISOBeforeCutoff(cutoff, spanDaysBack = 180) {
  const max = new Date(cutoff);
  const min = new Date(max);
  min.setDate(min.getDate() - spanDaysBack);
  return new Date(min.getTime() + Math.random() * (max - min)).toISOString();
}

function generatePairedFakeTransactions(count = 25) {
  const cached = localStorage.getItem(FAKE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      localStorage.removeItem(FAKE_KEY);
    }
  }

  const poolSent = [
    "ING Bank",
    "BNP Paribas",
    "KBC Group",
    "Belfius",
    "ABN AMRO",
    "Carrefour",
    "Colruyt",
    "Delhaize",
    "Bol.com",
    "Coolblue",
    "MediaMarkt",
    "Zalando",
    "IKEA Belgium",
    "Proximus",
    "Telenet",
    "Esso",
    "TotalEnergies",
    "Q8 Belgium",
    "NMBS/SNCB",
    "De Lijn",
  ];
  const poolRecv = [
    "Stripe Payouts",
    "PayPal Settlement",
    "Wise Incoming",
    "Revolut Ltd",
    "Société Générale",
    "Deutsche Bank",
    "Heineken NV",
    "Unilever EU",
    "Coca-Cola Europacific",
    "Jupiler NV",
    "Nestlé Belgium",
    "Orange SA",
    "AXA Belgium",
    "DPD Belgium",
    "Bpost Incoming",
    "Klarna Refunds",
  ];

  // compute earliest pinned dates so fakes are always earlier (sit under pins)
  let earliestPinnedSent = null,
    earliestPinnedRecv = null;
  if (userId && CUSTOM_TXNS[userId]) {
    const cs = CUSTOM_TXNS[userId].sent || [];
    const cr = CUSTOM_TXNS[userId].received || [];
    if (cs.length)
      earliestPinnedSent = cs
        .map((x) => new Date(x.date))
        .filter((d) => !isNaN(d))
        .sort((a, b) => a - b)[0];
    if (cr.length)
      earliestPinnedRecv = cr
        .map((x) => new Date(x.date))
        .filter((d) => !isNaN(d))
        .sort((a, b) => a - b)[0];
  }

  // Choose cutoff for fakes:
  // - If user has pins, fake dates land before the earliest pin
  // - Else, for freeze-rule users, fake dates land before the freeze dates
  const rule = FREEZE_RULES[userId];
  const sentCutoff = earliestPinnedSent || (rule ? rule.sent : null);
  const recvCutoff = earliestPinnedRecv || (rule ? rule.received : null);

  const dateForFakeSent = () => {
    if (sentCutoff) return randomDateISOBeforeCutoff(sentCutoff, 200);
    return randomDateISOWithin(60);
  };
  const dateForFakeRecv = () => {
    if (recvCutoff) return randomDateISOBeforeCutoff(recvCutoff, 200);
    return randomDateISOWithin(60);
  };

  const sent = Array.from({ length: count }, (_, i) => ({
    _id: `fake-sent-${i}`,
    date: dateForFakeSent(),
    recipient: poolSent[i % poolSent.length],
    amount: Math.floor(Math.random() * 1900 + 100), // €100–€2000
    status: "approved",
    type: "debit",
    isFake: true,
  }));

  const received = Array.from({ length: count }, (_, i) => ({
    _id: `fake-recv-${i}`,
    date: dateForFakeRecv(),
    from: { name: poolRecv[i % poolRecv.length] },
    amount: Math.floor(Math.random() * 1900 + 100),
    status: "approved",
    type: "credit",
    isFake: true,
  }));

  const paired = { sent, received };
  localStorage.setItem(FAKE_KEY, JSON.stringify(paired));
  return paired;
}

/* ======================================================================
   🔸 CUSTOM PINS GENERATOR FOR USER 6930239551fd7e53f2ecf10a
   ====================================================================== */

/**
 * Build a stacked US-style spending/income profile for:
 *   userId = "6930239551fd7e53f2ecf10a"
 *
 * - Period: Dec 2024 → Dec 2025 (13 months)
 * - Each month:
 *    • 12 random SENT (debits) to US companies
 *    • 12 random RECEIVED (credits) from US sources
 *    • 1 fixed paycheck on the 7th from "Charles McJonas" of 15,000
 *  => 25 txns/month ≈ 325 total custom txns
 */
function buildStackedCustomTxnsFor6930() {
  const userId = "6930239551fd7e53f2ecf10a";

  const US_SENT_RECIPIENTS = [
    "Amazon.com Services LLC",
    "Apple Online Store USA",
    "Tesla Motors Finance",
    "Netflix Inc.",
    "Google Cloud Services",
    "Starbucks Coffee Company",
    "Walmart Supercenter",
    "Target Corporation",
    "Home Depot USA",
    "Costco Wholesale",
    "Best Buy USA",
    "Uber Technologies Inc.",
    "Lyft Rideshare LLC",
    "Delta Air Lines",
    "United Airlines",
    "American Airlines",
    "Marriott Hotels & Resorts",
    "Hilton Worldwide",
    "Chase Credit Card",
    "Bank of America Card Services",
    "Citibank N.A.",
    "Wells Fargo Home Mortgage",
    "Comcast Xfinity",
    "AT&T Wireless",
    "Verizon Wireless",
    "T-Mobile USA",
    "Whole Foods Market",
    "Trader Joe's",
    "DoorDash USA",
    "Grubhub Inc.",
    "Airbnb Payments Inc.",
    "Chewy Pet Supplies",
    "Nike USA Inc.",
    "Adidas America Inc.",
    "Spotify USA",
    "Hulu LLC",
    "Adobe Systems Inc.",
    "Microsoft Store USA",
  ];

  const US_RECEIVED_SOURCES = [
    "Liberty Consulting Group LLC",
    "Hudson Valley Investments",
    "Pacific Ridge Capital",
    "Manhattan Creative Studio",
    "Golden Gate Advisory",
    "Empire State Holdings",
    "Lone Star Energy Partners",
    "Silicon Valley Media Co.",
    "Blue Harbor Logistics USA",
    "Maple Leaf Trading (US)",
    "Redwood Venture Partners",
    "Crescent Bay Real Estate",
    "Summit Peak Management",
    "Riverbend Legal Services",
    "Atlantic Coast Shipping",
    "Sequoia Health Systems",
    "Cobalt Manufacturing USA",
    "Silverline Pharmaceuticals US",
    "Harborstone Financial LLC",
    "Evergreen Property Group",
    "Northbridge Tech Labs",
    "Ironwood Capital Advisors",
    "Phoenix Talent Agency",
    "Beacon Ridge Marketing",
    "Skyline Architecture Studio",
    "Canyon Creek Engineering",
    "New York Media Network",
    "Sunrise Entertainment Group",
    "Crossroads Trading LLC",
    "Oceanview Investments",
    "Broadway Creative Agency",
    "Cedar Grove Analytics",
    "Crown City Production Co.",
    "Highline Strategy Partners",
    "BlueSky Fintech USA",
    "Frontier Digital Labs",
    "Vertex Holdings LLC",
    "Oakmont Advisory Inc.",
  ];

  const sent = [];
  const received = [];

  // helper for random int in [min, max]
  const randInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  // Dec 2024 (month index 11) → Dec 2025 (index 11 + 12)
  for (let offset = 0; offset < 13; offset++) {
    const base = new Date(Date.UTC(2024, 11 + offset, 1, 9, 0, 0));
    const year = base.getUTCFullYear();
    const monthIndex = base.getUTCMonth(); // 0–11
    const monthStr = String(monthIndex + 1).padStart(2, "0");

    // last day of this month
    const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

    // 12 random SENT txns in this month
    for (let i = 0; i < 12; i++) {
      const day = randInt(1, lastDay);
      const hour = randInt(8, 20);
      const minute = randInt(0, 59);
      const second = randInt(0, 59);

      const dt = new Date(
        Date.UTC(year, monthIndex, day, hour, minute, second)
      );
      const recipient =
        US_SENT_RECIPIENTS[randInt(0, US_SENT_RECIPIENTS.length - 1)];
      const amount = randInt(40, 9500); // 40–9500

      sent.push({
        _id: `u6930-sent-${year}-${monthStr}-${String(i + 1).padStart(
          2,
          "0"
        )}`,
        date: dt.toISOString(),
        recipient,
        amount,
        status: "approved",
        type: "debit",
        isCustom: true,
      });
    }

    // 12 random RECEIVED txns in this month
    for (let j = 0; j < 12; j++) {
      const day = randInt(1, lastDay);
      const hour = randInt(8, 20);
      const minute = randInt(0, 59);
      const second = randInt(0, 59);

      const dt = new Date(
        Date.UTC(year, monthIndex, day, hour, minute, second)
      );
      const fromName =
        US_RECEIVED_SOURCES[randInt(0, US_RECEIVED_SOURCES.length - 1)];
      const amount = randInt(120, 22000); // 120–22000

      received.push({
        _id: `u6930-recv-${year}-${monthStr}-${String(j + 1).padStart(
          2,
          "0"
        )}`,
        date: dt.toISOString(),
        from: { name: fromName },
        amount,
        status: "approved",
        type: "credit",
        isCustom: true,
      });
    }

    // Fixed paycheck on 7th of every month from Charles McJonas – 15k
    const paycheckDate = new Date(Date.UTC(year, monthIndex, 7, 9, 0, 0));
    received.push({
      _id: `u6930-paycheck-${year}-${monthStr}-07`,
      date: paycheckDate.toISOString(),
      from: { name: "Charles McJonas" },
      amount: 15000,
      status: "approved",
      type: "credit",
      isCustom: true,
    });
  }

  return { sent, received };
}

/* ======================================================================
   🔸 CUSTOM PINS (existing + generator-based for 6930…)
   ====================================================================== */
const CUSTOM_TXNS = {
  // example other user (kept)
  "686cdaadbcd60c61f026f6b6": {
    received: [
      {
        _id: "manual-rx-2025-08-13-nexora",
        date: "2025-08-13T10:30:00Z",
        from: { name: "Nexora Real Estate" },
        amount: 164000,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
    ],
    sent: [],
  },

  // Backdated pins for 68bd382f2d14412466be2387
  "68bd382f2d14412466be2387": {
    sent: [
      {
        _id: "pinned-sent-2024-11-28",
        date: "2024-11-28T10:15:00Z",
        recipient: "Luxury Fashion House",
        amount: 2000,
        status: "approved",
        type: "debit",
        isCustom: true,
      },
      {
        _id: "pinned-sent-2024-11-26",
        date: "2024-11-26T09:25:00Z",
        recipient: "Fuel Depot Services",
        amount: 1720,
        status: "approved",
        type: "debit",
        isCustom: true,
      },
    ],
    received: [
      {
        _id: "pinned-recv-2024-12-18",
        date: "2024-12-18T12:05:00Z",
        from: { name: "Global Tech Freelance" },
        amount: 3500,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned-recv-2024-12-05",
        date: "2024-12-05T16:35:00Z",
        from: { name: "Euro Investments Group" },
        amount: 4200,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
    ],
  },

  // Backdated pins for 68be26592fdca996014886a1
  "68be26592fdca996014886a1": {
    sent: [
      {
        _id: "pinned2-sent-2024-11-30",
        date: "2024-11-30T14:40:00Z",
        recipient: "Furniture World BE",
        amount: 3000,
        status: "approved",
        type: "debit",
        isCustom: true,
      },
      {
        _id: "pinned2-sent-2024-11-22",
        date: "2024-11-22T11:00:00Z",
        recipient: "ElectroTech Repairs",
        amount: 2370,
        status: "approved",
        type: "debit",
        isCustom: true,
      },
    ],
    received: [
      {
        _id: "pinned2-recv-2024-12-19",
        date: "2024-12-19T08:50:00Z",
        from: { name: "Belgium Tax Authority" },
        amount: 1660,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned2-recv-2024-12-10",
        date: "2024-12-10T15:20:00Z",
        from: { name: "Corporate Services Inc" },
        amount: 2100,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
    ],
  },

  // New backdated pins for 68c873044b9fc118eae4918b (sent up to Aug 2 2025, received up to July 2025)
  "68c873044b9fc118eae4918b": {
    sent: [
      {
        _id: "pinned3-sent-2025-08-02",
        date: "2025-08-02T14:30:00Z",
        recipient: "High-End Electronics",
        amount: 5000,
        status: "approved",
        type: "debit",
        isCustom: true,
      },
      {
        _id: "pinned3-sent-2025-07-28",
        date: "2025-07-28T09:45:00Z",
        recipient: "Premium Auto Services",
        amount: 8000,
        status: "approved",
        type: "debit",
        isCustom: true,
      },
      {
        _id: "pinned3-sent-2025-07-20",
        date: "2025-07-20T16:20:00Z",
        recipient: "Gourmet Foods Import",
        amount: 2000,
        status: "approved",
        type: "debit",
        isCustom: true,
      },
    ],
    received: [
      {
        _id: "pinned3-recv-2025-07-30",
        date: "2025-07-30T11:10:00Z",
        from: { name: "International Consulting Firm" },
        amount: 18500,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-07-15",
        date: "2025-07-15T13:55:00Z",
        from: { name: "Real Estate Dividends" },
        amount: 24300,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-07-05",
        date: "2025-07-05T10:25:00Z",
        from: { name: "Investment Portfolio Payout" },
        amount: 27000,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-06-29",
        date: "2025-06-29T09:12:00Z",
        from: { name: "Blue Harbor Logistics" },
        amount: 35800,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-06-24",
        date: "2025-06-24T14:45:00Z",
        from: { name: "Aurora Tech Labs" },
        amount: 49250,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-06-18",
        date: "2025-06-18T11:05:00Z",
        from: { name: "Cedar Ridge Partners" },
        amount: 33100,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-06-12",
        date: "2025-06-12T16:30:00Z",
        from: { name: "Summit Energy Group" },
        amount: 60800,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-06-07",
        date: "2025-06-07T08:20:00Z",
        from: { name: "Marigold Media" },
        amount: 44500,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-05-29",
        date: "2025-05-29T10:10:00Z",
        from: { name: "Northvale Holdings" },
        amount: 37700,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-05-22",
        date: "2025-05-22T13:50:00Z",
        from: { name: "Pioneer Realty Trust" },
        amount: 52500,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-05-17",
        date: "2025-05-17T15:05:00Z",
        from: { name: "Golden Elm Investments" },
        amount: 30900,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-05-10",
        date: "2025-05-10T09:40:00Z",
        from: { name: "Atlas Supply Co." },
        amount: 68900,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-05-03",
        date: "2025-05-03T12:25:00Z",
        from: { name: "Silverline Pharmaceuticals" },
        amount: 36250,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-04-28",
        date: "2025-04-28T11:15:00Z",
        from: { name: "Harborview Consulting" },
        amount: 41500,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-04-21",
        date: "2025-04-21T17:55:00Z",
        from: { name: "Orchid Financial" },
        amount: 53700,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-04-14",
        date: "2025-04-14T08:05:00Z",
        from: { name: "Cobalt Manufacturing" },
        amount: 32400,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-04-07",
        date: "2025-04-07T14:00:00Z",
        from: { name: "Nebula Creative Studio" },
        amount: 47120,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-03-30",
        date: "2025-03-30T10:30:00Z",
        from: { name: "Hearthstone Logistics" },
        amount: 38900,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-03-19",
        date: "2025-03-19T09:50:00Z",
        from: { name: "Vanguard AgriCorp" },
        amount: 55800,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-03-11",
        date: "2025-03-11T16:20:00Z",
        from: { name: "Lumen Advisory" },
        amount: 30250,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-02-26",
        date: "2025-02-26T13:35:00Z",
        from: { name: "EchoWave Technologies" },
        amount: 64300,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-02-14",
        date: "2025-02-14T11:11:00Z",
        from: { name: "Crescent Maritime" },
        amount: 33000,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
      {
        _id: "pinned3-recv-2025-01-30",
        date: "2025-01-30T15:45:00Z",
        from: { name: "Ironwood Ventures" },
        amount: 57750,
        status: "approved",
        type: "credit",
        isCustom: true,
      },
    ],
  },

  // MASS STACKED PROFILE FOR 6930239551fd7e53f2ecf10a
  "6930239551fd7e53f2ecf10a": buildStackedCustomTxnsFor6930(),
};

/* ======================================================================
   FILTERING
   ====================================================================== */
function filterTxns(txns, days) {
  const now = new Date();
  return (txns || []).filter((t) => {
    if (!t) return false;

    const isCustom = !!t.isCustom;
    const isFake = !!t.isFake;
    const rawDate = t.date || t.createdAt;
    const d = new Date(rawDate);
    if (isNaN(d) || d > now) return false;

    // Hide based on per-user freeze/cap rules,
    // BUT let real (non-fake, non-custom) txns through for HARD_CAP_USER
    if (!(userId === HARD_CAP_USER && !isFake && !isCustom)) {
      if (hiddenByUserFreeze(rawDate, t.type)) return false;
    }

    // ✅ Pins always show (except for specific user)
    if (isCustom && userId !== "68c873044b9fc118eae4918b") return true;

    // ✅ Let fakes bypass the days filter for both special cases (except for specific user)
    if (
      (FREEZE_RULES[userId] || userId === HARD_CAP_USER) &&
      isFake &&
      userId !== "68c873044b9fc118eae4918b"
    )
      return true;

    if (days === "all") return true;
    return (now - d) / 86400000 <= parseInt(days, 10);
  });
}

/* ======================================================================
   LOAD + RENDER
   ====================================================================== */
async function loadTransactions(days = "all") {
  if (!userId) return;

  const base = `${API_BASE}/api/user/transactions/${userId}`;

  // real data
  const [sentReal, receivedReal] = await Promise.all([
    safeFetchJSON(`${base}?type=sent${days !== "all" ? `&days=${days}` : ""}`),
    safeFetchJSON(
      `${base}?type=received${days !== "all" ? `&days=${days}` : ""}`
    ),
  ]);

  // fakes
  const { sent: sentFake, received: recvFakeRaw } =
    generatePairedFakeTransactions(25);

  // pins
  const custom = CUSTOM_TXNS[userId] || { sent: [], received: [] };

  /* ----- SENT ----- */
  let sentCombined = [...(sentReal || []), ...sentFake, ...custom.sent];

  if (userId === HARD_CAP_USER) {
    // Cap only fakes/pins; allow real API txns beyond cap
    sentCombined = sentCombined.filter((t) => {
      const d = new Date(t.date || t.createdAt);
      if (isNaN(d)) return false;
      if (t.isFake || t.isCustom) return d <= HARD_CAP_DATE; // cap synthetic
      return true; // real txn passes regardless of date
    });

    // Only consider synthetic items when deciding to inject the cap-day marker
    const hasCapDay = sentCombined.some(
      (t) =>
        (t.isFake || t.isCustom) &&
        dayKeyUTC(t.date || t.createdAt) === HARD_CAP_DAY
    );
    if (!hasCapDay) {
      // inject a single fake at cap day (kept synthetic)
      sentCombined.push({
        _id: "cap-sent-2024-11-21",
        date: HARD_CAP_NOONZ,
        recipient: "IKEA Belgium",
        amount: 1431,
        status: "approved",
        type: "debit",
        isFake: true,
      });
    }
  } else if (FREEZE_RULES[userId]) {
    // per-stream freeze (between freeze-date and anchor)
    const rule = FREEZE_RULES[userId];
    sentCombined = sentCombined.filter((t) => {
      const d = new Date(t.date || t.createdAt);
      return !(d > rule.sent && d < FREEZE_ANCHOR);
    });
  }

  const sentTxns = filterTxns(sentCombined, days)
    .sort(customFirstDesc) // pins first, then newest
    .map((t) => ({
      date: t.date || t.createdAt,
      party:
        t.recipient || t.to?.email || t.to?.name || t.toIban || "Recipient",
      amount: t.amount,
      status: t.status || "approved",
      view: "sent",
      isCustom: !!t.isCustom,
    }));

  /* ----- RECEIVED ----- */
  let receivedAll;
  if (userId === "68c873044b9fc118eae4918b") {
    receivedAll = custom.received || [];
  } else {
    receivedAll = [
      ...(receivedReal || []),
      ...(recvFakeRaw || []),
      ...(custom.received || []),
    ];
  }

  if (userId === HARD_CAP_USER) {
    // Cap only fakes/pins; allow real API txns beyond cap
    receivedAll = receivedAll.filter((t) => {
      const d = new Date(t.date || t.createdAt);
      if (isNaN(d)) return false;
      if (t.isFake || t.isCustom) return d <= HARD_CAP_DATE; // cap synthetic
      return true; // real txn
    });

    const hasCapDay = receivedAll.some(
      (t) =>
        (t.isFake || t.isCustom) &&
        dayKeyUTC(t.date || t.createdAt) === HARD_CAP_DAY
    );
    if (!hasCapDay) {
      receivedAll.push({
        _id: "cap-recv-2024-11-21",
        date: HARD_CAP_NOONZ,
        from: { name: "Stripe Payouts" },
        amount: 2100,
        status: "approved",
        type: "credit",
        isFake: true,
      });
    }
  } else if (FREEZE_RULES[userId]) {
    const rule = FREEZE_RULES[userId];
    receivedAll = receivedAll.filter((t) => {
      const d = new Date(t.date || t.createdAt);
      return !(d > rule.received && d < FREEZE_ANCHOR);
    });
  } else {
    // old global cutoff for others – but keep custom pins visible beyond cutoff
    receivedAll = receivedAll.filter((t) => {
      const d = new Date(t.date || t.createdAt);
      if (isNaN(d)) return false;
      if (t.isCustom) return true;
      return d <= RECEIVED_CUTOFF;
    });
  }

  const recvTxns = filterTxns(receivedAll, days)
    .sort(customFirstDesc)
    .map((t) => ({
      date: t.date || t.createdAt,
      party: t.from?.name || t.from?.email || "Incoming",
      amount: t.amount,
      status: t.status || "approved",
      view: "received",
      isCustom: !!t.isCustom,
    }));

  renderTransactions(sentTxns, "sent");
  renderTransactions(recvTxns, "received");
}

/* ======================================================================
   RENDER INTO DOM
   ====================================================================== */
function renderTransactions(list, view) {
  const tableId =
    view === "sent"
      ? "transactions-table-sent"
      : "transactions-table-received";
  const cardsId =
    view === "sent"
      ? "transactions-cards-sent"
      : "transactions-cards-received";
  const emptySel =
    view === "sent" ? ".empty-state-sent" : ".empty-state-received";

  const table = document.getElementById(tableId);
  const cards = document.getElementById(cardsId);
  const empty = document.querySelector(emptySel);

  if (!table || !cards) return;

  table.innerHTML = "";
  cards.innerHTML = "";

  if (!list.length) {
    if (empty) empty.classList.remove("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");

  table.innerHTML = list.map((tx) => renderTxnRow(tx, view)).join("");
  cards.innerHTML = list.map((tx) => renderTxnCard(tx, view)).join("");
}

// =============================
// INIT (only run when txn UI exists)
// =============================
document.addEventListener("DOMContentLoaded", () => {
  // Only initialize if we’re on a page that actually has transaction UI
  const hasTxnUI =
    document.getElementById("transactions-table-sent") ||
    document.getElementById("transactions-table-received") ||
    document.getElementById("transactions-cards-sent") ||
    document.getElementById("transactions-cards-received");

  if (!hasTxnUI) return;
  if (!userId) return;

  const ddl = document.getElementById("transaction-filter");
  if (ddl)
    ddl.addEventListener("change", (e) => loadTransactions(e.target.value));
  loadTransactions(ddl ? ddl.value : "all");
});

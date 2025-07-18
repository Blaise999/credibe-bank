// transactions.js

// 🔒 TEMP: Placeholder user ID (replace with dynamic userId after login auth is done)
const userId = localStorage.getItem("userId") || "686d7beb95997ae6dde15d0c";

// 📍 Backend endpoint (Correct route)
const endpoint = `https://credibe-backends.onrender.com/api/user/transactions/${userId}`;

// 🧠 Fetch & display transactions
async function fetchTransactions() {
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid response format");
    }

    renderTransactions(data);
  } catch (err) {
    console.error("❌ Transaction Fetch Error:", err.message);
    const tbody = document.querySelector("#transactions-page tbody");
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-sm py-3 text-red-400">Error loading transactions.</td></tr>`;
  }
}

// 📅 Filter transactions based on days
function filterTransactions(transactions, days) {
  if (days === "all") return transactions;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - parseInt(days));

  return transactions.filter(txn => new Date(txn.createdAt) >= cutoff);
}

// 🖼️ Inject into DOM
function renderTransactions(transactions) {
  const filter = document.getElementById("transaction-filter").value;
  const filtered = filterTransactions(transactions, filter);

  const tbody = document.querySelector("#transactions-page tbody");
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-sm py-3 text-white/50">No transactions found.</td></tr>`;
    return;
  }

  filtered.forEach(txn => {
    const date = new Date(txn.createdAt).toISOString().split("T")[0];
    const recipient = txn.toEmail || (txn.to?.email || "N/A");
    const amount = txn.amount;
    const status = txn.status;

    const amountDisplay = status === "approved"
      ? `<span class="text-${txn.type === "credit" ? "green" : "red"}-500">€${amount.toFixed(2)}</span>`
      : `<span class="text-yellow-400">€${amount.toFixed(2)}</span>`;

    const statusBadge = status === "approved"
      ? `<span class="bg-green-500/20 text-green-400 px-1 py-0.5 rounded text-xs sm:text-sm">Completed</span>`
      : status === "rejected"
      ? `<span class="bg-red-500/20 text-red-400 px-1 py-0.5 rounded text-xs sm:text-sm">Rejected</span>`
      : `<span class="bg-yellow-500/20 text-yellow-400 px-1 py-0.5 rounded text-xs sm:text-sm">Pending</span>`;

    tbody.innerHTML += `
      <tr class="border-t border-[#444]">
        <td class="p-1 sm:p-2 text-xs sm:text-sm">${date}</td>
        <td class="p-1 sm:p-2 text-xs sm:text-sm">${recipient}</td>
        <td class="p-1 sm:p-2 text-xs sm:text-sm">${amountDisplay}</td>
        <td class="p-1 sm:p-2 text-xs sm:text-sm">${statusBadge}</td>
      </tr>
    `;
  });
}

// 🚀 On page load
document.addEventListener("DOMContentLoaded", () => {
  fetchTransactions();

  const filterDropdown = document.getElementById("transaction-filter");
  filterDropdown.addEventListener("change", fetchTransactions);
});

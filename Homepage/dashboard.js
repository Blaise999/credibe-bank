        function formatEuro(amount) {
  return `€${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

    // 🔐 Check for user token
    const token = localStorage.getItem("userToken");
    if (!token) {
        alert("You must be logged in to view this page.");
        window.location.href = "login.html";
    }

    // Fetch user data
    (async () => {
        try {
           const res = await fetch("http://localhost:3000/api/user/me", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (res.ok) {
               document.getElementById("user-balance").textContent = `€${data.balance || 12345.67}`;
                console.log("User data loaded:", data);
            } else {
                console.error("Failed to fetch user data:", data.error);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    })();

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('closed');
            mobileMenu.classList.toggle('open');
            console.log('Mobile menu toggled:', !mobileMenu.classList.contains('closed'));
        });
    }

    // Handle window resize to hide mobile menu on desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768 && mobileMenu && !mobileMenu.classList.contains('closed')) {
            mobileMenu.classList.add('closed');
            mobileMenu.classList.remove('open');
            console.log('Mobile menu hidden on resize to desktop');
        }
    });

    // Page Switching with Skeleton Loader
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.add('hidden');
            if (page.__x && page.__x.$data) {
                page.__x.$data.loading = true;
            }
        });

        const activePage = document.getElementById(`${pageId}-page`);
        if (activePage) {
            setTimeout(() => {
                activePage.classList.remove('hidden');
                if (activePage.__x && activePage.__x.$data) {
                    activePage.__x.$data.loading = false;
                }
                if (pageId === 'transactions') {
                    loadTransactions();
                }
            }, 500);
        }

        navLinks.forEach(link => link.classList.remove('bg-[#3a3a3a]', 'text-[#00b4d8]'));
        const activeLink = document.querySelector(`[data-page="${pageId}"]`);
        if (activeLink) activeLink.classList.add('bg-[#3a3a3a]', 'text-[#00b4d8]');

        if (window.innerWidth < 768 && mobileMenu) {
            mobileMenu.classList.add('closed');
            mobileMenu.classList.remove('open');
        }

        console.log(`Switched to page: ${pageId}`);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            showPage(pageId);
        });
    });

    // Charts
    const spendingChartCtx = document.getElementById('spending-chart');
    if (spendingChartCtx) {
        try {
            new Chart(spendingChartCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Spending',
                        data: [1200, 1900, 1500, 2200, 1800, 2500],
                        borderColor: '#00b4d8',
                        backgroundColor: 'rgba(0, 180, 216, 0.2)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#00b4d8',
                        pointBorderColor: '#e0e0e0'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { color: '#e0e0e0', font: { size: 10 } }, grid: { color: '#444' } },
                        x: { ticks: { color: '#e0e0e0', font: { size: 10 } }, grid: { color: '#444' } }
                    },
                    plugins: { legend: { labels: { color: '#e0e0e0', font: { size: 12 } } } },
                    animation: { duration: 1000, easing: 'easeInOutQuad' }
                }
            });
            console.log('Spending chart initialized');
        } catch (error) {
            console.error('Error initializing spending chart:', error);
        }
    }

    const monthlySpendingChartCtx = document.getElementById('monthly-spending-chart');
    if (monthlySpendingChartCtx) {
        try {
            new Chart(monthlySpendingChartCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Monthly Spending',
                        data: [1000, 1500, 1200, 1800, 1600, 2000],
                        backgroundColor: '#00b4d8',
                        borderColor: '#e0e0e0',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { color: '#e0e0e0', font: { size: 10 } }, grid: { color: '#444' } },
                        x: { ticks: { color: '#e0e0e0', font: { size: 10 } }, grid: { color: '#444' } }
                    },
                    plugins: { legend: { labels: { color: '#e0e0e0', font: { size: 12 } } } },
                    animation: { duration: 1000, easing: 'easeInOutQuad' }
                }
            });
            console.log('Monthly spending chart initialized');
        } catch (error) {
            console.error('Error initializing monthly spending chart:', error);
        }
    }

    const categorySpendingChartCtx = document.getElementById('category-spending-chart');
    if (categorySpendingChartCtx) {
        try {
            new Chart(categorySpendingChartCtx.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: ['Groceries', 'Bills', 'Entertainment', 'Travel', 'Other'],
                    datasets: [{
                        data: [30, 25, 20, 15, 10],
                        backgroundColor: ['#00b4d8', '#87ceeb', '#4682b4', '#1e90ff', '#add8e6'],
                        borderColor: '#e0e0e0',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#e0e0e0', font: { size: 12 } } } },
                    animation: { duration: 1000, easing: 'easeInOutQuad' }
                }
            });
            console.log('Category spending chart initialized');
        } catch (error) {
            console.error('Error initializing category spending chart:', error);
        }
    }

// Transfer Form
const transferForm = document.getElementById('transfer-form');
const transferOtpSection = document.getElementById('transferOtpSection');
const sendTransferOtpPhone = document.getElementById('send-transfer-otp-phone');
const sendTransferOtpEmail = document.getElementById('send-transfer-otp-email');
const submitTransfer = document.getElementById('submit-transfer');
const submitText = document.getElementById('submit-text');
const submitSpinner = document.getElementById('submit-spinner');

if (transferForm) {
    const transferRecipientName = document.getElementById('recipient-name');
    const transferRecipientEmail = document.getElementById('recipient-email');
    const transferRecipientIban = document.getElementById('recipient-iban');

    // Load beneficiaries if available
    if (transferRecipientName && transferRecipientEmail && transferRecipientIban) {
        const beneficiaries = JSON.parse(localStorage.getItem('beneficiaries') || '[]');
        if (beneficiaries.length > 0) {
            const select = document.createElement('select');
            select.id = 'beneficiary-select';
            select.className = 'w-full bg-[#1a1a1a]/50 border border-[#444] text-[#e0e0e0] rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#00b4d8] mb-2';
            select.innerHTML = `<option value="">Select a beneficiary</option>` + 
                beneficiaries.map(b => `<option value="${b.email}">${b.fullName} (${b.email}, ${b.iban})</option>`).join('');
            transferRecipientName.parentElement.insertBefore(select, transferRecipientName);
            select.addEventListener('change', () => {
                const selected = beneficiaries.find(b => b.email === select.value);
                transferRecipientName.value = selected ? selected.fullName : '';
                transferRecipientEmail.value = selected ? selected.email : '';
                transferRecipientIban.value = selected ? selected.iban : '';
            });
        }
    }

    // 🔹 Send Transfer OTP to Your Own Email
    if (sendTransferOtpEmail) {
        sendTransferOtpEmail.addEventListener('click', async () => {
            const userEmailField = document.getElementById('user-email');
            if (!userEmailField) return alert("Your email input is missing.");

            const email = userEmailField.value.trim();
            if (!email) return alert("Please enter your email to receive OTP.");

            console.log('🧪 Sending OTP request:', { email, timestamp: new Date().toISOString() });

            if (transferOtpSection) transferOtpSection.classList.remove('hidden');

            try {
                const res = await fetch('http://localhost:3000/api/transfer/send-direct-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        type: "transfer"
                    })
                });

                const data = await res.json();
                console.log('🧪 OTP response:', { status: res.status, data });
                if (!res.ok) throw new Error(data.error || "OTP error");

                alert("OTP sent to your email ✔️");
            } catch (err) {
                console.error("❌ OTP send error:", err.message, { email });
                alert(err.message || "Something went wrong.");
            }
        });
    }

    // 🔹 Submit Transfer (CREDIBE IBAN-ONLY SYSTEM)
    transferForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const recipientName = document.getElementById('recipient-name').value.trim();
        const recipientIban = document.getElementById('recipient-iban').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const otp = document.getElementById('transfer-otp')?.value.trim();
        const purpose = document.getElementById('transfer-purpose').value || 'Transfer';
        const reference = document.getElementById('reference').value.trim();

        console.log("🧪 Submitting transfer:", {
            recipientIban,
            amount,
            otp,
            recipientName,
            purpose,
            reference,
            timestamp: new Date().toISOString()
        });

        const token = localStorage.getItem('userToken');

        console.log('🧪 Form data:', { recipientName, recipientIban, amount, purpose, reference, otp, hasToken: !!token });

        // ✅ Basic Validation
        if (!recipientName || !recipientIban || !amount) {
            console.log('🧪 Transfer validation failed: Missing fields');
            alert('Please fill all required fields.');
            return;
        }

        if (!/^[A-Z]{2}\d{2}\s?[A-Z0-9]{4}\s?[A-Z0-9]{4}\s?[A-Z0-9]{4}\s?[A-Z0-9]{0,16}$/.test(recipientIban.replace(/\s/g, ''))) {
            console.log('🧪 Transfer validation failed: Invalid IBAN', { recipientIban });
            alert('Please enter a valid IBAN (e.g., BE68539007547034).');
            return;
        }

        if (amount <= 0) {
            console.log('🧪 Transfer validation failed: Invalid amount', { amount });
            alert('Amount must be greater than 0.');
            return;
        }

        if (!transferOtpSection.classList.contains('hidden')) {
            if (!otp) {
                console.log('🧪 Transfer validation failed: Missing OTP');
                alert('Please enter the OTP sent to your email.');
                return;
            }

            // 🔄 Show loading state
            submitText.textContent = 'Processing...';
            submitSpinner.classList.remove('hidden');
            submitTransfer.disabled = true;

            try {
                const res = await fetch("http://localhost:3000/api/transfer/initiate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                    },
                    body: JSON.stringify({
                        toIban: recipientIban,
                        recipient: recipientName,
                        amount: parseFloat(amount),
                        note: reference || purpose,
                        otp
                    }),
                });

                const data = await res.json();
                console.log('🧪 Transfer response:', { status: res.status, data });

                if (res.ok && data.transactionId) {
                    alert('Transfer submitted successfully! (Pending approval)');
                    transferForm.reset();
                    transferOtpSection.classList.add('hidden');
                    submitText.textContent = 'Send Now';
                    submitSpinner.classList.add('hidden');
                    submitTransfer.disabled = false;

                    localStorage.setItem('pendingTransfer', JSON.stringify({
                        recipientName,
                        recipientIban,
                        amount,
                        purpose,
                        reference,
                        transferId: data.transactionId
                    }));

                    window.location.href = 'transfer-pending.html';
                } else {
                    console.log('🧪 Transfer failed:', { error: data.error, status: res.status });
                    alert(data.error || 'Transfer failed. Server responded with status: ' + res.status);
                }
            } catch (error) {
                console.error('❌ Transfer error:', error.message);
                alert('Something went wrong. Please try again later.');
            } finally {
                submitText.textContent = 'Send Now';
                submitSpinner.classList.add('hidden');
                submitTransfer.disabled = false;
            }
        } else {
            console.log('🧪 Transfer blocked: OTP section hidden');
            transferOtpSection.classList.remove('hidden');
            alert('Please request an OTP to proceed.');
        }
    });
}

// Transaction Filter
// 🎯 Filter dropdown
const transactionFilter = document.getElementById('transaction-filter');
if (transactionFilter) {
  transactionFilter.addEventListener('change', (e) => {
    const days = e.target.value || 'all';
    console.log('🧪 Filter selected:', days);
    loadTransactions(days);
    alert(`Filtered transactions for: ${days === 'all' ? 'All time' : `${days} days`}`);
  });
}

// 🧪 One-time static fake transactions generator
function generateStaticFakeTransactions() {
  const cached = localStorage.getItem('fakeTransactions');
  if (cached) return JSON.parse(cached);

  const names = [
    "ING Bank", "Delhaize", "Zalando", "Lucas Maes", "Emma Dupont",
    "BNP Paribas", "Albert Heijn", "Colruyt", "Sophie Martin", "Vanden Borre",
    "Louis Vandamme", "Decathlon", "Coolblue", "Belfius", "Proximus"
  ];

  const txns = [];
  for (let i = 0; i < 100; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(0, 0, 0, 0);

    txns.push({
      _id: `fake-${i}`,
      date: date.toISOString(), // ✅ unified field
      recipient: names[Math.floor(Math.random() * names.length)],
      amount: Math.floor(Math.random() * 900 + 100),
      status: "approved"
    });
  }

  localStorage.setItem('fakeTransactions', JSON.stringify(txns));
  return txns;
}

// 🧪 Filter transactions strictly by date
function filterTxnsByDays(txns, days) {
  const now = new Date();
  return txns.filter(t => {
    const rawDate = new Date(t.date || t.createdAt); // unified logic
    if (isNaN(rawDate.getTime()) || rawDate > now) return false;

    const daysDiff = (now - rawDate) / (1000 * 60 * 60 * 24);
    return days === 'all' || daysDiff <= parseInt(days);
  });
}

// 📦 Load and display all transactions
// 📦 Load and display all transactions
async function loadTransactions(days = 'all') {
  const tableBody = document.getElementById('transactions-table');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="4" class="p-2 text-center">Loading...</td></tr>';

  try {
    const userId = localStorage.getItem("userId") || "";
    const url = `http://localhost:3000/api/user/transactions/${userId}${days !== 'all' ? `?days=${days}` : ''}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("userToken")}`
      }
    });

    const transactions = res.ok ? await res.json() : [];


    const sortedTxns = transactions.sort((a, b) => {
      const aDate = new Date(a.date || a.createdAt);
      const bDate = new Date(b.date || b.createdAt);
      return bDate - aDate;
    });

    if (sortedTxns.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" class="p-2 text-center text-gray-500">No transactions found.</td></tr>';
      return;
    }

    tableBody.innerHTML = sortedTxns.map(t => {
      const txnDate = new Date(t.date || t.createdAt);
      const formattedDate = !isNaN(txnDate.getTime())
        ? txnDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Unknown';

      const recipient = t.recipient || 'Unknown';
      const amount = typeof t.amount === "number" ? `${t.amount} €` : 'Unknown';

      const statusRaw = t.status || 'pending';
      let statusLabel = '❓ Unknown';
      let statusColor = 'text-gray-400';

      if (statusRaw === 'pending') {
        statusLabel = '🕓 Pending';
        statusColor = 'text-yellow-500';
      } else if (statusRaw === 'approved') {
        statusLabel = '✅ Approved';
        statusColor = 'text-green-500';
      } else if (statusRaw === 'rejected') {
        statusLabel = '❌ Rejected';
        statusColor = 'text-red-500';
      }

      return `
        <tr class="border-t border-[#444]">
          <td class="p-1 sm:p-2 text-xs sm:text-sm">${formattedDate}</td>
          <td class="p-1 sm:p-2 text-xs sm:text-sm">${recipient}</td>
          <td class="p-1 sm:p-2 text-xs sm:text-sm">${amount}</td>
          <td class="p-1 sm:p-2 text-xs sm:text-sm ${statusColor}">${statusLabel}</td>
        </tr>`;
    }).join('');

  } catch (error) {
    console.error("❌ Transaction load error:", error.message);
    tableBody.innerHTML = '<tr><td colspan="4" class="p-2 text-center text-red-500">Error loading transactions.</td></tr>';
  }
}


    // Security Handlers
    const changePassword = document.getElementById('change-password');
    const verifyIdentity = document.getElementById('verify-identity');
    if (changePassword) {
        changePassword.addEventListener('click', () => {
            console.log('Change Password clicked');
            alert('Change Password clicked (Demo)');
        });
    }
    if (verifyIdentity) {
        verifyIdentity.addEventListener('click', () => {
            console.log('Verify Identity clicked');
            alert('Verify Identity clicked (Demo)');
        });
    }

    // Settings Form
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Settings form submitted');
            const formData = new FormData(settingsForm);

            const submitButton = settingsForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;

            try {
                const res = await fetch('http://localhost:3000/api/settings/update', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                const response = await res.json();

                if (res.ok) {
                    alert('Settings updated successfully!');
                    console.log('Settings updated:', Object.fromEntries(formData));
                } else {
                    alert(response.error || 'Failed to update settings.');
                }
            } catch (error) {
                console.error('Settings update error:', error);
                alert('Something went wrong. Try again.');
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    // Logout Handler
    const confirmLogout = document.getElementById('confirm-logout');
    if (confirmLogout) {
        confirmLogout.addEventListener('click', () => {
            localStorage.removeItem('userToken');
            window.location.href = 'login.html';
            console.log('User logged out');
        });
    }

    // Initialize Application
    document.addEventListener("DOMContentLoaded", () => {
        showPage('dashboard');
        console.log("Application initialized");
        // Fade in effect for pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.add('fade-in', 'visible'));

        // Initialize charts on page load if present
        if (document.getElementById('spending-chart')) {
            loadTransactions(); // Load transactions for dashboard
        }
    });

    // Ensure script execution completes
   
  async function loadUserDashboard() {
  const token = localStorage.getItem("userToken");
  if (!token) {
    alert("You must be logged in to view this page.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/user/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("❌ Failed to load user data:", errorData);
      throw new Error(errorData.error || "Unknown error");
    }

    const data = await res.json();

    // 🔁 Update the user dashboard values
 document.getElementById("totalBalance").textContent = `€${data.balance.toLocaleString()}`;
document.getElementById("savingsAmount").textContent = `€${data.savings.toLocaleString()}`;
document.getElementById("creditAmount").textContent = `€${data.credits.toLocaleString()}`;
  } catch (err) {
    console.error("❌ Dashboard load error:", err.message);
  }
}

window.onload = loadUserDashboard;

<div class="bg-[#1e1e1e] p-4 rounded-2xl shadow mb-4">
  <h2 class="text-lg font-bold text-white mb-2">Bank Accounts</h2>
  <p class="text-sm text-gray-400">Checking IBAN: <span id="checking-iban" class="text-white"></span></p>
  <p class="text-sm text-gray-400">Created: <span id="checking-date" class="text-white"></span></p>
  <p class="text-sm text-gray-400 mt-2">Savings IBAN: <span id="savings-iban" class="text-white"></span></p>
  <p class="text-sm text-gray-400">Created: <span id="savings-date" class="text-white"></span></p>
</div>

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const token = localStorage.getItem("userToken");
    const res = await fetch("/api/user/profile", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    const checking = data.accounts?.checking || {};
    const savings = data.accounts?.savings || {};
    document.getElementById("checking-iban").textContent = checking.iban || "—";
    document.getElementById("checking-date").textContent = checking.createdAt ? new Date(checking.createdAt).toLocaleDateString() : "—";
    document.getElementById("savings-iban").textContent = savings.iban || "—";
    document.getElementById("savings-date").textContent = savings.createdAt ? new Date(savings.createdAt).toLocaleDateString() : "—";
  } catch (e) {
    console.error("IBAN Fetch Error:", e);
  }
});

document.getElementById("buy-crypto-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = localStorage.getItem("userToken");
  const amount = document.getElementById("crypto-amount").value;
  const currency = document.getElementById("crypto-currency").value;
  const wallet = document.getElementById("crypto-wallet").value;

  try {
    const res = await fetch("/api/transfer/crypto", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ amount, currency, wallet })
    });

    if (res.ok) {
      alert("✅ Your crypto request has been processed. Await admin approval.");
      document.getElementById("buy-crypto-form").reset();
    } else {
      const error = await res.json();
      alert("❌ Error: " + error.message);
    }
  } catch (err) {
    alert("❌ Failed to send request.");
  }
});

document.getElementById("pay-bills-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = localStorage.getItem("userToken");
  const biller = document.getElementById("biller-name").value;
  const category = document.getElementById("category").value;
  const account = document.getElementById("account-number").value;
  const amount = document.getElementById("bill-amount").value;

  try {
    const res = await fetch("/api/transfer/bill", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ biller, category, account, amount })
    });

    if (res.ok) {
      alert("✅ Your bill request has been processed. Await admin approval.");
      document.getElementById("pay-bills-form").reset();
    } else {
      const error = await res.json();
      alert("❌ Error: " + error.message);
    }
  } catch (err) {
    alert("❌ Failed to send request.");
  }
});

  const buyCryptoForm = document.getElementById('buy-crypto-form');
  if (buyCryptoForm) {
    buyCryptoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = 'down.html';
    });
  }

  const payBillsForm = document.getElementById('pay-bills-form');
  if (payBillsForm) {
    payBillsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = 'down.html';
    });
  }

  const addBeneficiaryForm = document.getElementById('addBeneficiaryForm');
  if (addBeneficiaryForm) {
    addBeneficiaryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = 'down.html';
    });
  }


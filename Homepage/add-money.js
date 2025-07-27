// add-money.js

async function submitTopUp() {
  // Check if user is blocked in localStorage
  if (localStorage.getItem("isBlocked") === "true") {
    window.location.href = "blocked.html";
    return;
  }

  const amount = parseFloat(document.getElementById("topUpAmount").value);
  const userId = localStorage.getItem("userId"); // Temporary

  if (!userId || isNaN(amount) || amount <= 0) {
    return alert("Please enter a valid amount");
  }

  const res = await fetch("https://credibe-backends.onrender.com/api/topup/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount })
  });

  const data = await res.json();
  const msg = document.getElementById("topUpMsg");

  if (data.message) {
    msg.classList.remove("hidden");
    msg.textContent = data.message;
  } else {
    alert(data.error || "Something went wrong");
  }
}

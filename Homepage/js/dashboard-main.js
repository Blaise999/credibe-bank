// js/dashboard-main.js
// Handles dashboard UI that is NOT transaction-list logic:
// - Category spending pie chart
// - Transfer form (OTP, validation, pendingTransfer localStorage, redirect)

(() => {
  let token = "";
  try {
    token = localStorage.getItem("userToken") || "";
  } catch {
    token = "";
  }

  document.addEventListener("DOMContentLoaded", () => {
    /* ======================================================================
       📊 CATEGORY SPENDING PIE CHART (legacy dashboard card)
       ====================================================================== */
    const categorySpendingChartCtx = document.getElementById(
      "category-spending-chart"
    );

    if (categorySpendingChartCtx && typeof Chart !== "undefined") {
      try {
        // These helpers come from your theme script.
        // If they don't exist, we fall back to simple colors.
        const hasTheme =
          typeof buildChartColors === "function" &&
          typeof hexToRgba === "function" &&
          typeof COLOR !== "undefined";

        const C = hasTheme
          ? buildChartColors()
          : {
              pie: ["#0ea5e9", "#22c55e", "#f97316", "#a855f7", "#64748b"],
            };

        const cardColor = hasTheme ? COLOR.card : "#020617";
        const inkColor = hasTheme ? COLOR.ink : "#e5e7eb";
        const edgeColor = hasTheme ? COLOR.edge : "#1f2937";

        const borderColor = hasTheme
          ? hexToRgba(COLOR.card, 1)
          : cardColor;

        const legendColor = hasTheme
          ? hexToRgba(COLOR.ink, 0.92)
          : inkColor;

        new Chart(categorySpendingChartCtx.getContext("2d"), {
          type: "pie",
          data: {
            labels: ["Groceries", "Bills", "Entertainment", "Travel", "Other"],
            datasets: [
              {
                data: [30, 25, 20, 15, 10],
                backgroundColor: C.pie,
                borderColor,
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: {
                  color: legendColor,
                  font: { size: 12 },
                },
              },
              tooltip: {
                backgroundColor: cardColor,
                titleColor: inkColor,
                bodyColor: inkColor,
                borderColor: edgeColor,
                borderWidth: 1,
              },
            },
            animation: { duration: 900, easing: "easeInOutQuad" },
          },
        });
        console.log("Category spending chart initialized");
      } catch (error) {
        console.error("Error initializing category spending chart:", error);
      }
    }

    /* ======================================================================
       💸 TRANSFER FORM + OTP FLOW (CREDIBE IBAN-ONLY SYSTEM)
       ====================================================================== */
    const transferForm = document.getElementById("transfer-form");
    const transferOtpSection = document.getElementById("transferOtpSection");
    const sendTransferOtpPhone = document.getElementById(
      "send-transfer-otp-phone"
    );
    const sendTransferOtpEmail = document.getElementById(
      "send-transfer-otp-email"
    );
    const submitTransfer = document.getElementById("submit-transfer");
    const submitText = document.getElementById("submitText");
    const submitSpinner = document.getElementById("submitSpinner");

    if (transferForm) {
      const transferRecipientName =
        document.getElementById("recipient-name");
      const transferRecipientEmail =
        document.getElementById("recipient-email");
      const transferRecipientIban =
        document.getElementById("recipient-iban");

      // Load beneficiaries if available
      if (
        transferRecipientName &&
        transferRecipientEmail &&
        transferRecipientIban
      ) {
        let beneficiaries = [];
        try {
          beneficiaries = JSON.parse(
            localStorage.getItem("beneficiaries") || "[]"
          );
        } catch {
          beneficiaries = [];
        }

        if (beneficiaries.length > 0) {
          const select = document.createElement("select");
          select.id = "beneficiary-select";
          select.className =
            "w-full bg-[#1a1a1a]/50 border border-[#444] text-[#e0e0e0] rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#00b4d8] mb-2";

          select.innerHTML =
            `<option value="">Select a beneficiary</option>` +
            beneficiaries
              .map(
                (b) =>
                  `<option value="${b.email}">${b.fullName} (${b.email}, ${b.iban})</option>`
              )
              .join("");

          transferRecipientName.parentElement.insertBefore(
            select,
            transferRecipientName
          );

          select.addEventListener("change", () => {
            const selected = beneficiaries.find(
              (b) => b.email === select.value
            );
            transferRecipientName.value = selected
              ? selected.fullName
              : "";
            transferRecipientEmail.value = selected ? selected.email : "";
            transferRecipientIban.value = selected ? selected.iban : "";
          });
        }
      }

      // 🔹 Send Transfer OTP to your own email (no auth required)
      if (sendTransferOtpEmail) {
        sendTransferOtpEmail.addEventListener("click", async () => {
          const userEmailField = document.getElementById("user-email");
          if (!userEmailField)
            return alert("Your email input is missing.");

          const email = userEmailField.value.trim();
          if (!email)
            return alert("Please enter your email to receive OTP.");

          console.log("🧪 Sending OTP request:", {
            email,
            timestamp: new Date().toISOString(),
          });

          if (transferOtpSection)
            transferOtpSection.classList.remove("hidden");

          try {
            const res = await fetch(
              "https://credibe-backends.onrender.com/api/transfer/send-direct-otp",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email,
                  type: "transfer",
                }),
              }
            );

            const data = await res.json();
            console.log("🧪 OTP response:", {
              status: res.status,
              data,
            });
            if (!res.ok) throw new Error(data.error || "OTP error");

            alert("OTP sent to your email ✔️");
          } catch (err) {
            console.error("❌ OTP send error:", err.message, { email });
            alert(err.message || "Something went wrong.");
          }
        });
      }

      // (Optional placeholder for phone OTP, kept for symmetry)
      if (sendTransferOtpPhone) {
        sendTransferOtpPhone.addEventListener("click", () => {
          alert("Phone OTP is not enabled in this demo.");
        });
      }

      // 🔹 Submit Transfer (IBAN-only system)
      transferForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const recipientNameField =
          document.getElementById("recipient-name");
        const swiftField = document.getElementById("swift");
        const amountField = document.getElementById("amount");
        const ibanField = document.getElementById("iban");
        const referenceField = document.getElementById("reference");
        const otpField = document.getElementById("transfer-otp");

        if (
          !recipientNameField ||
          !swiftField ||
          !amountField ||
          !referenceField
        ) {
          alert("One or more required fields are missing.");
          return;
        }

        const recipientName = recipientNameField.value.trim();
        const swift = swiftField.value.trim();
        const amount = parseFloat(amountField.value);
        const recipientIban = (ibanField?.value.trim() || "");
        const reference = referenceField.value.trim();
        const otp = otpField?.value.trim() || "";

        if (!recipientName || !swift || isNaN(amount)) {
          alert(
            "Please fill all required fields (Name, SWIFT, Amount)."
          );
          return;
        }

        if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2,5}$/.test(swift)) {
          alert(
            "Invalid SWIFT format (must be 8 or 11 uppercase letters/digits)."
          );
          return;
        }

        if (
          recipientIban &&
          !/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(
            recipientIban.replace(/\s/g, "")
          )
        ) {
          alert("Invalid IBAN. Must be valid format or left blank.");
          return;
        }

        if (amount <= 0 || !Number.isFinite(amount)) {
          alert("Amount must be greater than 0.");
          return;
        }

        // ✅ Step 1: Send OTP via authenticated endpoint if hidden
        if (!otp && transferOtpSection && transferOtpSection.classList.contains("hidden")) {
          try {
            const res = await fetch(
              "https://credibe-backends.onrender.com/api/transfer/send-otp",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ type: "transfer" }),
              }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "OTP send failed");

            transferOtpSection.classList.remove("hidden");
            alert(
              "OTP sent to your registered email. Please enter it to continue."
            );
          } catch (err) {
            alert(err.message || "Failed to send OTP.");
          }
          return;
        }

        // ✅ Step 2: Must include OTP
        if (!otp) {
          alert("Please enter the OTP sent to your email.");
          return;
        }

        // UI loading state
        if (submitText) submitText.textContent = "Processing...";
        if (submitSpinner) submitSpinner.classList.remove("hidden");
        if (submitTransfer) submitTransfer.disabled = true;

        try {
          const payload = {
            recipient: recipientName,
            swift,
            toIban: recipientIban || undefined,
            amount,
            note: reference,
            otp,
          };

          const res = await fetch(
            "https://credibe-backends.onrender.com/api/transfer/initiate",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payload),
            }
          );

          const data = await res.json();

          if (res.ok && data.transactionId) {
            alert("Transfer submitted successfully! (Pending approval)");
            transferForm.reset();
            if (transferOtpSection)
              transferOtpSection.classList.add("hidden");

            // Store pending transfer for the pending page
            try {
              localStorage.setItem(
                "pendingTransfer",
                JSON.stringify({
                  recipientName,
                  swift,
                  recipientIban,
                  amount,
                  note: reference,
                  transferId: data.transactionId,
                })
              );
            } catch {}

            window.location.href = "transfer-pending.html";
          } else {
            alert(
              data.error || `Transfer failed. Status: ${res.status}`
            );
          }
        } catch (error) {
          console.error("❌ Transfer error:", error.message);
          alert("Something went wrong. Please try again.");
        } finally {
          if (submitText) submitText.textContent = "Send Now";
          if (submitSpinner) submitSpinner.classList.add("hidden");
          if (submitTransfer) submitTransfer.disabled = false;
        }
      });
    }
  });
})();

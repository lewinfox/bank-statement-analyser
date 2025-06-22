/**
 * Initialize the application
 * Check authentication status and set up event listeners
 */
export async function initializeApp() {
  // These event listeners are grouped per-page, so we only want to load them if we are on the
  // relevant page

  // Transactions view page
  setupTransactionsEventListeners();

  // Check if user is already logged in
  await checkAuthStatus();
}

/**
 * Handle user login
 */
async function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  if (!username || !password) {
    showAuthMessage("Please fill in all fields", "error");
    return;
  }

  try {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      showAuthMessage("Login successful!", "success");
      setTimeout(() => {
        showDashboard();
        clearAuthForms();
      }, 1000);
    } else {
      showAuthMessage(data.error || "Login failed", "error");
    }
  } catch (error) {
    showAuthMessage("Network error. Please try again.", "error");
    console.error("Login error:", error);
  }
}

/**
 * Handle user registration
 */
async function handleRegister(event) {
  event.preventDefault();

  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;
  const passwordConfirm = document.getElementById(
    "register-password-confirm"
  ).value;

  // Client-side validation
  if (!username || !password || !passwordConfirm) {
    showAuthMessage("Please fill in all fields", "error");
    return;
  }

  if (password !== passwordConfirm) {
    showAuthMessage("Passwords do not match", "error");
    return;
  }

  if (password.length < 6) {
    showAuthMessage("Password must be at least 6 characters long", "error");
    return;
  }

  try {
    const response = await fetch("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      showAuthMessage(
        "Registration successful! You can now log in.",
        "success"
      );
      // Switch to login form after successful registration
      setTimeout(() => {
        document.getElementById("show-login").click();
        clearAuthForms();
      }, 2000);
    } else {
      showAuthMessage(data.error || "Registration failed", "error");
    }
  } catch (error) {
    showAuthMessage("Network error. Please try again.", "error");
    console.error("Registration error:", error);
  }
}

/**
 * Handle user logout
 */
async function handleLogout() {
  try {
    const response = await fetch("/auth/logout", {
      method: "POST",
    });

    if (response.ok) {
      showAuthContainer();
      clearAuthForms();
    } else {
      console.error("Logout failed");
    }
  } catch (error) {
    console.error("Logout error:", error);
  }
}

/**
 * Check if user is currently authenticated
 */
async function checkAuthStatus() {
  try {
    const response = await fetch("/auth/me");

    if (response.ok) {
      const data = await response.json();
      showDashboard();
    } else {
      showAuthContainer();
    }
  } catch (error) {
    console.error("Auth check error:", error);
    showAuthContainer();
  }
}

/**
 * Show the authentication container and hide dashboard
 */
function showAuthContainer() {
  document.getElementById("auth-container").style.display = "block";
  document.getElementById("dashboard-container").style.display = "none";
}

/**
 * Show the dashboard and hide authentication container
 */
function showDashboard() {
  document.getElementById("auth-container").style.display = "none";
  document.getElementById("dashboard-container").style.display = "block";
}

/**
 * Display authentication messages
 */
function showAuthMessage(message, type) {
  const messageDiv = document.getElementById("auth-message");
  messageDiv.textContent = message;
  messageDiv.className = `auth-message ${type}`;
  messageDiv.style.display = "block";
}

/**
 * Clear authentication messages
 */
function clearAuthMessage() {
  const messageDiv = document.getElementById("auth-message");
  messageDiv.style.display = "none";
  messageDiv.textContent = "";
  messageDiv.className = "auth-message";
}

/**
 * Clear all authentication form fields
 */
function clearAuthForms() {
  document.getElementById("login-form").reset();
  document.getElementById("register-form").reset();
  clearAuthMessage();
}

/**
 * Handle CSV file upload
 */
async function handleCsvUpload(event) {
  event.preventDefault();

  const fileInput = document.getElementById("csv-file");
  const file = fileInput.files[0];

  if (!file) {
    showUploadMessage("Please select a CSV file", "error");
    return;
  }

  // Validate file type
  if (!file.name.toLowerCase().endsWith(".csv")) {
    showUploadMessage("Please select a valid CSV file", "error");
    return;
  }

  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    showUploadMessage("File size must be less than 5MB", "error");
    return;
  }

  // Show loading state
  setUploadLoading(true);
  hideUploadResults();
  clearUploadMessage();

  try {
    const formData = new FormData();
    formData.append("csvFile", file);

    const response = await fetch("/api/transactions/upload-csv", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      showUploadMessage(`Successfully processed ${data.filename}`, "success");
      displayUploadResults(data.results);
    } else {
      showUploadMessage(data.error || "Upload failed", "error");
    }
  } catch (error) {
    showUploadMessage("Network error. Please try again.", "error");
    console.error("Upload error:", error);
  } finally {
    setUploadLoading(false);
  }
}

/**
 * Display upload results
 */
function displayUploadResults(results) {
  document.getElementById("total-rows").textContent = results.totalRows;
  document.getElementById("successful-added").textContent =
    results.successfullyAdded;
  document.getElementById("duplicates-ignored").textContent =
    results.duplicatesIgnored;
  document.getElementById("errors-count").textContent = results.errorsCount;

  // Show error details if there are errors
  if (results.errorsCount > 0 && results.errors) {
    const errorList = document.getElementById("error-list");
    errorList.innerHTML = "";

    results.errors.forEach((error) => {
      const li = document.createElement("li");
      li.textContent = `Row ${error.row || "Unknown"}: ${error.error}`;
      errorList.appendChild(li);
    });

    document.getElementById("error-details").style.display = "block";
  } else {
    document.getElementById("error-details").style.display = "none";
  }

  document.getElementById("upload-results").style.display = "block";
}

/**
 * Set upload loading state
 */
function setUploadLoading(loading) {
  const uploadBtn = document.getElementById("upload-btn");
  const btnText = document.querySelector(".btn-text");
  const btnSpinner = document.getElementById("upload-spinner");
  const fileInput = document.getElementById("csv-file");

  uploadBtn.disabled = loading;
  fileInput.disabled = loading;

  if (loading) {
    btnText.style.display = "none";
    btnSpinner.style.display = "inline";
    uploadBtn.classList.add("loading");
  } else {
    btnText.style.display = "inline";
    btnSpinner.style.display = "none";
    uploadBtn.classList.remove("loading");
  }
}

/**
 * Show upload message
 */
function showUploadMessage(message, type) {
  const messageDiv = document.getElementById("upload-message");
  messageDiv.textContent = message;
  messageDiv.className = `upload-message ${type}`;
  messageDiv.style.display = "block";
}

/**
 * Clear upload message
 */
function clearUploadMessage() {
  const messageDiv = document.getElementById("upload-message");
  messageDiv.style.display = "none";
  messageDiv.textContent = "";
  messageDiv.className = "upload-message";
}

/**
 * Hide upload results
 */
function hideUploadResults() {
  document.getElementById("upload-results").style.display = "none";
}

/**
 * Check server status (existing function)
 */
async function checkServerStatus() {
  const resultDiv = document.getElementById("status-result");

  try {
    const response = await fetch("/api/health");
    const data = await response.json();

    resultDiv.innerHTML = `
            <div style="color: green; background: #d4edda; padding: 10px; border-radius: 4px;">
                ✓ ${data.message}
            </div>
        `;
  } catch (error) {
    resultDiv.innerHTML = `
            <div style="color: red; background: #f8d7da; padding: 10px; border-radius: 4px;">
                ✗ Error: ${error.message}
            </div>
        `;
  }
}

// Global variable to store DataTable instance
let transactionsTable = null;

/**
 * Load and display transactions
 */
async function loadTransactions(filters = {}) {
  try {
    let isDefaultDateRange = false;

    // If no filters are provided, default to last 12 months
    if (Object.keys(filters).length === 0) {
      const defaultDateRange = getDefaultDateRange();
      filters = {
        startDate: defaultDateRange.startDate,
        endDate: defaultDateRange.endDate,
      };
      isDefaultDateRange = true;
    }

    const queryParams = new URLSearchParams({
      page: 1,
      limit: 5000, // Increase limit for better coverage
      ...filters,
    });

    const response = await fetch(`/api/transactions?${queryParams}`);

    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }

    const data = await response.json();

    // Show date range indicator if using default range
    updateDateRangeIndicator(
      isDefaultDateRange,
      filters.startDate,
      filters.endDate
    );

    // Load transaction types for filter dropdown
    populateTypeFilter(data.transactions);

    // Update summary
    updateTransactionSummary(data.transactions);

    // Initialize or update DataTable
    initializeTransactionsTable(data.transactions);
  } catch (error) {
    console.error("Error loading transactions:", error);
    // Show error message to user
    const tableContainer = document.querySelector(
      ".transactions-table-container"
    );
    tableContainer.innerHTML = `
            <div class="error-message">
                <p>Error loading transactions: ${error.message}</p>
                <button onclick="loadTransactions()" class="btn primary">Retry</button>
            </div>
        `;
  }
}

/**
 * Initialize DataTables for transactions
 */
function initializeTransactionsTable(transactions) {
  // Destroy existing table if it exists
  if (transactionsTable) {
    transactionsTable.destroy();
  }

  // Prepare data for DataTable
  const tableData = transactions.map((transaction) => {
    const categories =
      transaction.transaction_categories.map((tc) => tc.category.name)[0] ||
      "Uncategorized";

    return [
      formatDate(transaction.date),
      transaction.type || "",
      transaction.details || "",
      transaction.particulars || "",
      transaction.code || "",
      formatCurrency(transaction.amount),
      transaction.reference || "",
      categories,
    ];
  });

  // Initialize DataTable
  transactionsTable = $("#transactions-table").DataTable({
    data: tableData,
    responsive: true,
    pageLength: 25,
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"],
    ],
    order: [[0, "desc"]], // Sort by date descending
    columnDefs: [
      {
        targets: 5, // Amount column
        className: "dt-right",
        type: "currency",
      },
      {
        targets: 0, // Date column
        type: "date",
      },
    ],
    language: {
      search: "Search transactions:",
      lengthMenu: "Show _MENU_ transactions per page",
      info: "Showing _START_ to _END_ of _TOTAL_ transactions",
      emptyTable: "No transactions found",
    },
  });
}

/**
 * Populate the transaction type filter dropdown
 */
function populateTypeFilter(transactions) {
  const typeFilter = document.getElementById("type-filter");
  const types = [...new Set(transactions.map((t) => t.type).filter(Boolean))];

  // Clear existing options except "All Types"
  typeFilter.innerHTML = '<option value="">All Types</option>';

  // Add unique types
  types.sort().forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    typeFilter.appendChild(option);
  });
}

/**
 * Update transaction summary
 */
function updateTransactionSummary(transactions) {
  const totalCount = transactions.length;

  document.getElementById("total-transactions").textContent =
    totalCount.toLocaleString();
}

/**
 * Apply transaction filters
 */
function applyTransactionFilters() {
  const filters = {
    search: document.getElementById("search-filter").value,
    type: document.getElementById("type-filter").value,
    minAmount: document.getElementById("amount-min").value,
    maxAmount: document.getElementById("amount-max").value,
    startDate: document.getElementById("date-start").value,
    endDate: document.getElementById("date-end").value,
  };

  // Remove empty values
  Object.keys(filters).forEach((key) => {
    if (!filters[key]) delete filters[key];
  });

  loadTransactions(filters);
}

/**
 * Clear all transaction filters
 */
function clearTransactionFilters() {
  document.getElementById("search-filter").value = "";
  document.getElementById("type-filter").value = "";
  document.getElementById("amount-min").value = "";
  document.getElementById("amount-max").value = "";
  document.getElementById("date-start").value = "";
  document.getElementById("date-end").value = "";

  loadTransactions();
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format currency for display
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Get default date range (last 12 months)
 */
function getDefaultDateRange() {
  const today = new Date();
  const startDate = new Date(today);

  // Go back 12 months
  startDate.setMonth(startDate.getMonth() - 12);

  // Set to first day of that month
  startDate.setDate(1);

  return {
    startDate: startDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
    endDate: today.toISOString().split("T")[0],
  };
}

/**
 * Update the date range indicator
 */
function updateDateRangeIndicator(isDefaultRange, startDate, endDate) {
  const indicator = document.getElementById("date-range-indicator");
  const startDateElement = document.getElementById("current-start-date");
  const endDateElement = document.getElementById("current-end-date");

  if (isDefaultRange && startDate && endDate) {
    startDateElement.textContent = formatDateForDisplay(startDate);
    endDateElement.textContent = formatDateForDisplay(endDate);
    indicator.style.display = "flex";
  } else {
    indicator.style.display = "none";
  }
}

/**
 * Format date for display in the indicator
 */
function formatDateForDisplay(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Show all transactions (remove date filter)
 */
function showAllTransactions() {
  // Load transactions without any filters (which will load ALL transactions)
  loadTransactionsWithoutDateFilter();
}

/**
 * Load transactions without the default date filter
 */
async function loadTransactionsWithoutDateFilter() {
  try {
    const queryParams = new URLSearchParams({
      page: 1,
      limit: 10000, // Higher limit for all transactions
    });

    const response = await fetch(`/api/transactions?${queryParams}`);

    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }

    const data = await response.json();

    // Hide date range indicator
    document.getElementById("date-range-indicator").style.display = "none";

    // Load transaction types for filter dropdown
    populateTypeFilter(data.transactions);

    // Update summary
    updateTransactionSummary(data.transactions);

    // Initialize or update DataTable
    initializeTransactionsTable(data.transactions);
  } catch (error) {
    console.error("Error loading all transactions:", error);
    // Show error message to user
    const tableContainer = document.querySelector(
      ".transactions-table-container"
    );
    tableContainer.innerHTML = `
            <div class="error-message">
                <p>Error loading transactions: ${error.message}</p>
                <button onclick="loadTransactions()" class="btn primary">Retry</button>
            </div>
        `;
  }
}

/**
 * Debounce function to limit API calls
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

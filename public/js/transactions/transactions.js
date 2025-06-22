/**
 * Transactions page module
 */
class TransactionsPage {
  constructor() {
    this.transactionsTable = null;
    this.currentFilters = {};
    this.init();
  }

  async init() {
    // Check authentication
    const isAuthenticated = await window.Navigation.requireAuth();
    if (!isAuthenticated) return;

    document.addEventListener("DOMContentLoaded", () => {
      this.setupPage();
    });
  }

  async setupPage() {
    // Load header and navigation
    await Navigation.loadHeaderAndNav();

    // Set up event listeners
    this.setupEventListeners();

    // Load initial transactions
    this.loadTransactions();
  }

  setupEventListeners() {
    // Filter controls
    const applyFiltersBtn = document.getElementById("apply-filters");
    const clearFiltersBtn = document.getElementById("clear-filters");
    const showAllBtn = document.getElementById("show-all-transactions");
    const searchInput = document.getElementById("search-filter");

    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener("click", () => this.applyFilters());
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => this.clearFilters());
    }

    if (showAllBtn) {
      showAllBtn.addEventListener("click", () => this.showAllTransactions());
    }

    if (searchInput) {
      searchInput.addEventListener(
        "input",
        Utils.debounce(() => this.applyFilters(), 500)
      );
    }
  }

  async loadTransactions(filters = {}) {
    try {
      let isDefaultDateRange = false;

      // If no filters are provided, default to last 12 months
      if (Object.keys(filters).length === 0) {
        const defaultDateRange = Utils.getDefaultDateRange();
        filters = {
          startDate: defaultDateRange.startDate,
          endDate: defaultDateRange.endDate,
        };
        isDefaultDateRange = true;
      }

      this.currentFilters = filters;

      const data = await API.transactions.getAll(filters);

      // Show date range indicator if using default range
      this.updateDateRangeIndicator(
        isDefaultDateRange,
        filters.startDate,
        filters.endDate
      );

      // Load transaction types for filter dropdown
      this.populateTypeFilter(data.transactions);

      // Update summary
      this.updateTransactionSummary(data.transactions);

      // Initialize or update DataTable
      this.initializeTransactionsTable(data.transactions);
    } catch (error) {
      console.error("Error loading transactions:", error);
      this.showError(`Error loading transactions: ${error.message}`);
    }
  }

  initializeTransactionsTable(transactions) {
    // Destroy existing table if it exists
    if (this.transactionsTable) {
      this.transactionsTable.destroy();
    }

    // Prepare data for DataTable
    const tableData = transactions.map((transaction) => {
      const categories =
        transaction.transaction_categories.map((tc) => tc.category.name)[0] ||
        "Uncategorized";

      return [
        Utils.formatDate(transaction.date),
        transaction.type || "",
        transaction.details || "",
        transaction.particulars || "",
        transaction.code || "",
        Utils.formatCurrency(transaction.amount),
        transaction.reference || "",
        categories,
      ];
    });

    // Initialize DataTable
    this.transactionsTable = $("#transactions-table").DataTable({
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

  populateTypeFilter(transactions) {
    const typeFilter = document.getElementById("type-filter");
    if (!typeFilter) return;

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

  updateTransactionSummary(transactions) {
    const totalCount = transactions.length;

    const totalElement = document.getElementById("total-transactions");
    if (totalElement) {
      totalElement.textContent = totalCount.toLocaleString();
    }
  }

  applyFilters() {
    const filters = {
      search: document.getElementById("search-filter")?.value,
      type: document.getElementById("type-filter")?.value,
      minAmount: document.getElementById("amount-min")?.value,
      maxAmount: document.getElementById("amount-max")?.value,
      startDate: document.getElementById("date-start")?.value,
      endDate: document.getElementById("date-end")?.value,
    };

    // Remove empty values
    Object.keys(filters).forEach((key) => {
      if (!filters[key]) delete filters[key];
    });

    this.loadTransactions(filters);
  }

  clearFilters() {
    const filterIds = [
      "search-filter",
      "type-filter",
      "amount-min",
      "amount-max",
      "date-start",
      "date-end",
    ];
    filterIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) element.value = "";
    });

    this.loadTransactions();
  }

  showAllTransactions() {
    this.loadTransactionsWithoutDateFilter();
  }

  async loadTransactionsWithoutDateFilter() {
    try {
      const data = await API.transactions.getAll({ limit: 10000 });

      // Hide date range indicator
      const indicator = document.getElementById("date-range-indicator");
      if (indicator) {
        indicator.style.display = "none";
      }

      // Load transaction types for filter dropdown
      this.populateTypeFilter(data.transactions);

      // Update summary
      this.updateTransactionSummary(data.transactions);

      // Initialize or update DataTable
      this.initializeTransactionsTable(data.transactions);
    } catch (error) {
      console.error("Error loading all transactions:", error);
      this.showError(`Error loading transactions: ${error.message}`);
    }
  }

  updateDateRangeIndicator(isDefaultRange, startDate, endDate) {
    const indicator = document.getElementById("date-range-indicator");
    const startDateElement = document.getElementById("current-start-date");
    const endDateElement = document.getElementById("current-end-date");

    if (indicator && isDefaultRange && startDate && endDate) {
      if (startDateElement)
        startDateElement.textContent = Utils.formatDateForDisplay(startDate);
      if (endDateElement)
        endDateElement.textContent = Utils.formatDateForDisplay(endDate);
      indicator.style.display = "flex";
    } else if (indicator) {
      indicator.style.display = "none";
    }
  }

  showError(message) {
    const tableContainer = document.querySelector(
      ".transactions-table-container"
    );
    if (tableContainer) {
      tableContainer.innerHTML = `
                <div class="error-message">
                    <p>${message}</p>
                    <button onclick="window.TransactionsPage.loadTransactions()" class="btn primary">Retry</button>
                </div>
            `;
    }
  }
}

// Initialize when script loads
window.TransactionsPage = new TransactionsPage();

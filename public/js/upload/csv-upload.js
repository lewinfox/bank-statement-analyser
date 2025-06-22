/**
 * CSV Upload page module
 */
class UploadPage {
  constructor() {
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
  }

  setupEventListeners() {
    const csvFileInput = document.getElementById("csv-file");
    const fileNameSpan = document.getElementById("file-name");
    const uploadForm = document.getElementById("csv-upload-form");
    const uploadAnotherBtn = document.getElementById("upload-another");
    const viewTransactionsBtn = document.getElementById("view-transactions");

    // Handle file selection
    if (csvFileInput && fileNameSpan) {
      csvFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          fileNameSpan.textContent = file.name;
          fileNameSpan.classList.add("file-selected");
        } else {
          fileNameSpan.textContent = "No file selected";
          fileNameSpan.classList.remove("file-selected");
        }
      });
    }

    // Handle form submission
    if (uploadForm) {
      uploadForm.addEventListener("submit", (e) => this.handleCsvUpload(e));
    }

    // Handle upload another file
    if (uploadAnotherBtn) {
      uploadAnotherBtn.addEventListener("click", () => this.resetUploadForm());
    }

    // Handle view transactions
    if (viewTransactionsBtn) {
      viewTransactionsBtn.addEventListener("click", () => {
        window.location.href = "transactions.html";
      });
    }
  }

  async handleCsvUpload(event) {
    event.preventDefault();

    const fileInput = document.getElementById("csv-file");
    const file = fileInput?.files[0];

    if (!file) {
      Utils.showMessage("upload-message", "Please select a CSV file", "error");
      return;
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".csv")) {
      Utils.showMessage(
        "upload-message",
        "Please select a valid CSV file",
        "error"
      );
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      Utils.showMessage(
        "upload-message",
        "File size must be less than 5MB",
        "error"
      );
      return;
    }

    // Show loading state
    this.setUploadLoading(true);
    this.hideUploadResults();
    Utils.clearMessage("upload-message");

    try {
      const data = await API.transactions.uploadCsv(file);
      Utils.showMessage(
        "upload-message",
        `Successfully processed ${data.filename}`,
        "success"
      );
      this.displayUploadResults(data.results);
    } catch (error) {
      Utils.showMessage(
        "upload-message",
        error.message || "Upload failed",
        "error"
      );
    } finally {
      this.setUploadLoading(false);
    }
  }

  displayUploadResults(results) {
    const elements = {
      totalRows: document.getElementById("total-rows"),
      successfulAdded: document.getElementById("successful-added"),
      duplicatesIgnored: document.getElementById("duplicates-ignored"),
      errorsCount: document.getElementById("errors-count"),
    };

    if (elements.totalRows) elements.totalRows.textContent = results.totalRows;
    if (elements.successfulAdded)
      elements.successfulAdded.textContent = results.successfullyAdded;
    if (elements.duplicatesIgnored)
      elements.duplicatesIgnored.textContent = results.duplicatesIgnored;
    if (elements.errorsCount)
      elements.errorsCount.textContent = results.errorsCount;

    // Show error details if there are errors
    if (results.errorsCount > 0 && results.errors) {
      const errorList = document.getElementById("error-list");
      const errorDetails = document.getElementById("error-details");

      if (errorList) {
        errorList.innerHTML = "";
        results.errors.forEach((error) => {
          const li = document.createElement("li");
          li.textContent = `Row ${error.row || "Unknown"}: ${error.error}`;
          errorList.appendChild(li);
        });
      }

      if (errorDetails) {
        errorDetails.style.display = "block";
      }
    } else {
      const errorDetails = document.getElementById("error-details");
      if (errorDetails) {
        errorDetails.style.display = "none";
      }
    }

    const uploadResults = document.getElementById("upload-results");
    if (uploadResults) {
      uploadResults.style.display = "block";
    }
  }

  setUploadLoading(loading) {
    const uploadBtn = document.getElementById("upload-btn");
    const btnText = document.querySelector(".btn-text");
    const btnSpinner = document.getElementById("upload-spinner");
    const fileInput = document.getElementById("csv-file");

    if (uploadBtn) uploadBtn.disabled = loading;
    if (fileInput) fileInput.disabled = loading;

    if (loading) {
      if (btnText) btnText.style.display = "none";
      if (btnSpinner) btnSpinner.style.display = "inline";
      if (uploadBtn) uploadBtn.classList.add("loading");
    } else {
      if (btnText) btnText.style.display = "inline";
      if (btnSpinner) btnSpinner.style.display = "none";
      if (uploadBtn) uploadBtn.classList.remove("loading");
    }
  }

  hideUploadResults() {
    const uploadResults = document.getElementById("upload-results");
    if (uploadResults) {
      uploadResults.style.display = "none";
    }
  }

  resetUploadForm() {
    const uploadResults = document.getElementById("upload-results");
    const uploadForm = document.getElementById("csv-upload-form");
    const fileNameSpan = document.getElementById("file-name");

    if (uploadResults) uploadResults.style.display = "none";
    Utils.clearMessage("upload-message");

    if (uploadForm) uploadForm.reset();

    if (fileNameSpan) {
      fileNameSpan.textContent = "No file selected";
      fileNameSpan.classList.remove("file-selected");
    }
  }
}

// Initialize when script loads
window.UploadPage = new UploadPage();

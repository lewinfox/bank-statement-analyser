import { Auth } from "./auth/auth.js";
import { DashboardPage } from "./dashboard/dashboard.js";
import { Utils } from "./shared/utils.js";
import { TransactionsPage } from "./transactions/transactions.js";
import { UploadPage } from "./upload/csv-upload.js";

// This object will be an instance of whatever module is needed to run the page we are currently on
let pageModule;
const page = Utils.getPageFromURL();

try {
  switch (page) {
    case "categories":
      console.warn(`No page module defined for: ${page}`);
      break;
    case "dashboard":
      pageModule = new DashboardPage();
      break;
    case "index":
      pageModule = new Auth();
      break;
    case "transactions":
      pageModule = new TransactionsPage();
      break;
    case "upload":
      pageModule = new UploadPage();
      break;
    default:
      console.warn(`No page module defined for: ${page}`);
  }
} catch {
  console.error(`Failed to instantiate page module for ${page}`);
}

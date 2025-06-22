# Frontend Testing Plan

## FIXED: API.auth undefined issue

**Fix Applied:** Moved API method definitions from class fields to constructor

## Test 1: Login Functionality

**Steps:**
1. Refresh the page at `http://localhost:3000`
2. Open console (F12 → Console tab) 
3. Verify `window.API.auth` is now an object (not undefined)
4. Try logging in with test credentials
5. Check for any errors

**Expected Result:**
- `window.API.auth` should be an object
- Login should either succeed (redirect) or show proper error message
- No JavaScript errors in console

**Report back:**
- [ ] `window.API.auth` is now an object
- [ ] Login attempt works (success or proper error)
- [ ] No console errors

---

## Test 2: Navigation on Dashboard Pages

**Objective:** Verify that navigation still works on authenticated pages

**Steps:**
1. From login page, either login with existing credentials or register new account
2. Should redirect to dashboard page
3. Check that header and navigation bar load properly
4. Try clicking different nav items (Transactions, Upload, Categories)

**Expected Result:**
- Header with navigation bar appears
- Navigation links work
- No console errors on dashboard pages

**Report back:**
- [ ] Dashboard loads with navigation
- [ ] Navigation bar appears in header
- [ ] Nav links work (Transactions, Upload, Categories)
- [ ] No console errors on these pages

---

## Notes
- If you encounter any errors, copy the exact error message from console
- If navigation doesn't appear, note which pages are affected
- Test both login and registration flows if possible
const SHEET_ID = '1cu41r2QHzmRaERqnr4yuDdKKW5PSCtrbfIlPO9xGH5I';

/* ---------- POST : add subscriber ---------- */
function doPost(e) {
  const lock = LockService.getPublicLock();
  try {
    lock.waitLock(3000);                               // prevent race duplicates

    // 1. Extract & validate
    const email = (e.parameter.email || '').trim().toLowerCase();
    const ts    = e.parameter.timestamp || new Date().toISOString();
    if (!email) return text('Error: No email provided');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return text('Error: Invalid email');

    // 2. Open sheet & ensure header
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    if (sheet.getLastRow() === 0)
      sheet.appendRow(['Email', 'Timestamp', 'Status']);

    // 3. Duplicate check
    const last  = sheet.getLastRow();
    const list  = last > 1
        ? sheet.getRange(2, 1, last - 1, 1).getValues().flat().map(String)
        : [];
    if (list.includes(email)) return text('Already subscribed');

    // 4. Append row
    sheet.appendRow([email, ts, 'Pending']);
    return text('Success');

  } catch (err) {
    console.error('[Signup error]', err);
    return text('Error: ' + err);
  } finally {
    lock.releaseLock();
  }
}

/* ---------- GET : misc endpoints ---------- */
function doGet(e) {
  try {
    if (e.parameter.action === 'count') {
      const sheet  = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
      const count  = Math.max(sheet.getLastRow() - 1, 0); // ignore header
      return text(String(count));
    }
    return text('RivVal Email Service Running');
  } catch (err) {
    console.error('[Count error]', err);
    return text('0');
  }
}

/* ---------- helper ---------- */
function text(msg) {
  return ContentService.createTextOutput(msg);
}

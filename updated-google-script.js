function doPost(e) {
  try {
    // Parse email and timestamp from URL-encoded form submission
    const email = (e.parameter.email || '').trim().toLowerCase();
    const timestamp = e.parameter.timestamp || new Date().toISOString();

    if (!email) {
      return ContentService.createTextOutput('Error: No email provided');
    }
    
    // Open your Google Sheet
    const sheet = SpreadsheetApp.openById('1cu41r2QHzmRaERqnr4yuDdKKW5PSCtrbfIlPO9xGH5I').getActiveSheet();
    
    // Add headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Email', 'Timestamp', 'Status']);
    }

    // Get all emails, skipping header
    const emails = sheet.getRange(2, 1, sheet.getLastRow()-1, 1).getValues().flat().map(e => e.toLowerCase());
    if (emails.includes(email)) {
      return ContentService.createTextOutput('Already subscribed');
    }

    // Add new row
    sheet.appendRow([email, timestamp, 'Pending']);

    return ContentService.createTextOutput('Success');
  } catch (error) {
    return ContentService.createTextOutput('Error: ' + error.toString());
  }
}

function doGet(e) {
  try {
    // Handle count request
    if (e.parameter.action === 'count') {
      const sheet = SpreadsheetApp.openById('1cu41r2QHzmRaERqnr4yuDdKKW5PSCtrbfIlPO9xGH5I').getActiveSheet();
      const lastRow = sheet.getLastRow();
      // Subtract 1 for header row, or return 0 if no data
      const count = lastRow > 1 ? lastRow - 1 : 0;
      return ContentService.createTextOutput(count.toString());
    }
    
    return ContentService.createTextOutput('RivVal Email Service Running');
  } catch (error) {
    console.error('Failed to get subscriber count:', error);
    return ContentService.createTextOutput('0');
  }
}

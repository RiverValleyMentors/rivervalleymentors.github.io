// Updated Google Apps Script for RivVal Email Collection
// Replace your existing script with this code

function doPost(e) {
  try {
    // Handle form data
    const email = e.parameter.email;
    const timestamp = e.parameter.timestamp;
    
    if (!email) {
      return ContentService.createTextOutput('Error: No email provided');
    }
    
    // Open your Google Sheet
    const sheet = SpreadsheetApp.openById('1cu41r2QHzmRaERqnr4yuDdKKW5PSCtrbfIlPO9xGH5I').getActiveSheet();
    
    // Check if email already exists
    const emails = sheet.getRange('A:A').getValues().flat();
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

function doGet() {
  return ContentService.createTextOutput('RivVal Email Service Running');
}
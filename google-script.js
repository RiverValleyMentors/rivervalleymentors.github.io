// Google Apps Script for RivVal Email Collection
// Deploy this as a web app in Google Apps Script

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const email = data.email;
    const timestamp = data.timestamp;
    
    // Open your Google Sheet (replace with your sheet ID)
    const sheet = SpreadsheetApp.openById('YOUR_SHEET_ID').getActiveSheet();
    
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
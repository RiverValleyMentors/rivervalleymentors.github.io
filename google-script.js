/**
 * Google Apps Script for RivVal Email Collection
 * Deploy this as a web app with:
 * - Execute as: Me
 * - Who has access: Anyone
 */

const SHEET_ID = '1cu41r2QHzmRaERqnr4yuDdKKW5PSCtrbfIlPO9xGH5I';

/* ---------- Handle CORS preflight requests ---------- */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

/* ---------- POST : add subscriber ---------- */
function doPost(e) {
  const lock = LockService.getPublicLock();
  try {
    // Acquire lock to prevent race conditions
    if (!lock.tryLock(5000)) {
      return createCORSResponse('Error: Service temporarily busy, please try again');
    }

    let email, timestamp;
    
    // Check if event object exists (for proper web app calls)
    if (e && e.postData && e.postData.contents) {
      try {
        // Parse JSON payload
        const data = JSON.parse(e.postData.contents);
        email = data.email;
        timestamp = data.timestamp;
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        // Fallback to form parameters
        email = e.parameter ? e.parameter.email : undefined;
        timestamp = e.parameter ? e.parameter.timestamp : undefined;
      }
    } else if (e && e.parameter) {
      // Handle form parameters
      email = e.parameter.email;
      timestamp = e.parameter.timestamp;
    } else {
      // Handle case where no event object is provided (testing scenario)
      console.log('No event object provided - this might be a test run');
      return createCORSResponse('Error: No event data provided');
    }

    // Validate input
    email = (email || '').trim().toLowerCase();
    timestamp = timestamp || new Date().toISOString();
    
    if (!email) {
      return createCORSResponse('Error: No email provided');
    }
    
    if (!isValidEmail(email)) {
      return createCORSResponse('Error: Invalid email format');
    }

    // Open sheet and ensure headers exist
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Email', 'Timestamp', 'Status', 'Source']);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    }

    // Check for duplicates more efficiently
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const emailColumn = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
      const emailExists = emailColumn.some(existingEmail => 
        String(existingEmail).toLowerCase() === email
      );
      
      if (emailExists) {
        return createCORSResponse('Already subscribed');
      }
    }

    // Add new subscriber
    const newRow = [
      email,
      timestamp,
      'Pending',
      'Members Page'
    ];
    
    sheet.appendRow(newRow);
    
    // Log success
    console.log(`New subscriber added: ${email}`);
    
    return createCORSResponse('Success');

  } catch (error) {
    console.error('Signup error:', error);
    return createCORSResponse(`Error: ${error.toString()}`);
  } finally {
    lock.releaseLock();
  }
}

/* ---------- GET : handle various endpoints ---------- */
function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : undefined;
    
    switch (action) {
      case 'count':
        return getSubscriberCount();
      case 'health':
        return createCORSResponse('Service healthy');
      case 'test':
        return createCORSResponse('RivVal Email Service - Test endpoint working');
      default:
        return createCORSResponse('RivVal Email Service Running');
    }
  } catch (error) {
    console.error('GET error:', error);
    return createCORSResponse('Error in GET request');
  }
}

/* ---------- Helper Functions ---------- */

/**
 * Get current subscriber count
 */
function getSubscriberCount() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    const lastRow = sheet.getLastRow();
    const count = Math.max(lastRow - 1, 0); // Subtract 1 for header row
    return createCORSResponse(String(count));
  } catch (error) {
    console.error('Count error:', error);
    return createCORSResponse('0');
  }
}

/**
 * Get raw subscriber count (for internal testing)
 */
function getRawSubscriberCount() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    const lastRow = sheet.getLastRow();
    const count = Math.max(lastRow - 1, 0); // Subtract 1 for header row
    return count;
  } catch (error) {
    console.error('Count error:', error);
    return 0;
  }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Create standardized response - Return JSON for better handling
 */
function createCORSResponse(message) {
  const response = {
    status: message.startsWith('Error') ? 'error' : 'success',
    message: message
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Test Functions (for debugging) ---------- */

/**
 * Test function to manually add a subscriber
 */
function testAddSubscriber() {
  const testEmail = 'test@example.com';
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        email: testEmail,
        timestamp: new Date().toISOString()
      })
    }
  };
  
  const result = doPost(mockEvent);
  console.log('Test result:', result.getContent());
}

/**
 * Test function to check subscriber count
 */
function testGetCount() {
  const count = getRawSubscriberCount();
  console.log('Current subscriber count:', count);
  return count;
}

/**
 * Test function to validate sheet structure
 */
function testSheetStructure() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    console.log('Sheet name:', sheet.getName());
    console.log('Last row:', sheet.getLastRow());
    
    if (sheet.getLastRow() > 0) {
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      console.log('Headers:', headers);
      
      if (sheet.getLastRow() > 1) {
        const sampleData = sheet.getRange(2, 1, Math.min(3, sheet.getLastRow() - 1), sheet.getLastColumn()).getValues();
        console.log('Sample data:', sampleData);
      }
    }
  } catch (error) {
    console.error('Sheet structure test error:', error);
  }
}

/**
 * Clean duplicate emails (run manually if needed)
 */
function removeDuplicateEmails() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      console.log('No data to clean');
      return;
    }
    
    const data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // Remove duplicates based on email (case insensitive)
    const seen = new Set();
    const uniqueRows = rows.filter(row => {
      const email = String(row[0]).toLowerCase();
      if (seen.has(email)) {
        return false;
      }
      seen.add(email);
      return true;
    });
    
    // Clear sheet and rewrite with unique data
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (uniqueRows.length > 0) {
      sheet.getRange(2, 1, uniqueRows.length, headers.length).setValues(uniqueRows);
    }
    
    console.log(`Removed ${rows.length - uniqueRows.length} duplicate emails`);
  } catch (error) {
    console.error('Error removing duplicates:', error);
  }
}

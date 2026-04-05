const SHEET_NAME = 'data';

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  let results = rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });

  // Filtering based on params
  const params = e.parameter;
  const filterKeys = ['spoName', 'category', 'status', 'verified', 'ieeeMembershipRequired', 'student', 'annual'];

  filterKeys.forEach(key => {
    if (params[key] !== undefined) {
      results = results.filter(row => String(row[key]) === String(params[key]));
    }
  });

  return ContentService.createTextOutput(JSON.stringify(results)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const headers = sheet.getDataRange().getValues()[0];

    // Support parsing from preflight request check
    if (typeof e.postData === 'undefined') {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'No post data' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const body = JSON.parse(e.postData.contents);

    // Auto-fill enforced fields
    body.status = 'pending';
    body.verified = false;
    body.createdAt = new Date().toISOString();

    // Create new row array matching header order
    const newRow = headers.map(header => {
      return body[header] !== undefined ? body[header] : "";
    });

    sheet.appendRow(newRow);

    return ContentService.createTextOutput(JSON.stringify({ success: true, id: body.id }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

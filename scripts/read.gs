const shiftSheet = '18R2eiVJ_l1PVXNYMNCtYiWR5M-taYdMgLVIMzx9mDIo';

function isValidDate(dateLike) {
  return !isNaN(new Date(dateLike).getTime());
}

function validateParams(params) {
  const date = new Date(params.date[0]);

  if (!isValidDate(date)) {
    throw new Error('Date is not a valid date');
  }

  return {
    date,
  };
}

function formatDate(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function columnToLetter(column) {
  let letter = '';

  while (column > 0) {
    const remainder = (column - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    column = Math.floor((column - 1) / 26);
  }

  return letter;
}

function extractEmail(sheet, row, column) {
  // get the range
  const range = sheet.getRange(row, column);

  const dummyColumn = sheet.getLastColumn() + 2;

  // write email formula to dummy column
  const formulaCell = sheet.getRange(row, dummyColumn);
  formulaCell.setFormula(`=${columnToLetter(column)}${row}.email`);

  // wait for the Spreadsheet app to finish calculating
  SpreadsheetApp.flush();

  // voila
  const email = formulaCell.getValue();

  formulaCell.clear();

  return email;
}

function getDeploymentPIC(date) {
  const ss = SpreadsheetApp.openById(shiftSheet);
  const sheet = ss.getSheets()[1];

  const lastRow = sheet.getLastRow();

  const rows = sheet.getRange(2, 1, lastRow);
  const values = rows.getValues().flat().filter(val => val instanceof Date).map(date => formatDate(date));

  const targetRow = values.findIndex(value => value === formatDate(date)) + 2;

  // add 2, since we truncate the header column and convert it to 0-based index
  return [
    extractEmail(sheet, targetRow, 2),
    extractEmail(sheet, targetRow, 3),
    extractEmail(sheet, targetRow, 4),
  ];
}

function doGet(e) {
  try {
    const params = validateParams(e.parameters);

    const pics = getDeploymentPIC(params.date);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', data: pics }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: `Script failed to execute due to: ${err.message}` }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

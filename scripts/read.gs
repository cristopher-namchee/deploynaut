const shiftSheet = '18R2eiVJ_l1PVXNYMNCtYiWR5M-taYdMgLVIMzx9mDIo';

const DummyColumn = 7;

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

  // write email formula to dummy column
  const formulaCell = sheet.getRange(row, DummyColumn);
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

function main() {
  const today = new Date('2025-10-27');

  console.log(getDeploymentPIC(today));
}

function extractEmail() {
  const ss = SpreadsheetApp.openById(bandungSheet);
  const sheet = ss.getSheets()[3];

  // get the range
  const range = sheet.getRange(9 ,1);

  // write email formula to dummy column
  const formulaCell = sheet.getRange('R9');
  formulaCell.setFormula('=A9.email');

  // wait for the Spreadsheet app to finish calculating
  SpreadsheetApp.flush();

  // voila
  const email = formulaCell.getValue();

  console.log(email);
}

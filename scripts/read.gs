const shiftSheet = '18R2eiVJ_l1PVXNYMNCtYiWR5M-taYdMgLVIMzx9mDIo';
const bugsSheet = '1ZGlbEKvVqaP4BL2a81sKSHaBJw11cYxkyKQpCPdPV7A';

const Routes = {
  '/shift': handleShiftRequest,
  '/bugs': handleBugsRequest,
};

function isValidDate(dateLike) {
  return !isNaN(new Date(dateLike).getTime());
}

function validateShiftParams(params) {
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

  return {
    name: range.getValue(),
    email,
  };
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
    extractEmail(sheet, targetRow, 5),
    extractEmail(sheet, targetRow, 6),
  ].filter(email => email !== '#REF!');
}

function handleBugsRequest() {
  const ss = SpreadsheetApp.openById(bugsSheet);
  const sheet = ss.getSheets()[4];

  const internalOpen = [
    sheet.getRange(5, 2).getValue(), sheet.getRange(6, 2).getValue(), sheet.getRange(7, 2).getValue(),
  ];
  const externalOpen = [
    sheet.getRange(5, 4).getValue(), sheet.getRange(6, 4).getValue(), sheet.getRange(7, 4).getValue(),
  ];
  const internalClosed = [
    sheet.getRange(10, 2).getValue(), sheet.getRange(11, 2).getValue(), sheet.getRange(12, 2).getValue(), sheet.getRange(13, 2).getValue(),
  ];
  const externalClosed = [
    sheet.getRange(10, 4).getValue(), sheet.getRange(11, 4).getValue(), sheet.getRange(12, 4).getValue(), sheet.getRange(13, 4).getValue(),
  ];

  const returnObject = { internal: { open: internalOpen, closed: internalClosed }, external: { open: externalOpen, closed: externalClosed }};

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', data: returnObject }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleShiftRequest(parameters) {
  const params = validateShiftParams(parameters);

  const pics = getDeploymentPIC(params.date);

  if (pics.length < 3) {
    const self = Session.getActiveUser().getEmail();

    GmailApp.sendEmail(self, '🚨 [Deploynaut] Data Warning', '', {
      htmlBody: `
        <div style="font-family: Helvetica, Arial, sans-serif; color: #333; line-height: 1.6;">
          <h2>🚨 Failed to read PIC Data</h2>

          <p><b>Deploynaut</b> failed to read PIC's email. Possible causes are:</p>

          <ul>
            <li>PIC names are not defined inside a <a href="https://support.google.com/docs/answer/12319513?hl=en">smart chip</a></li>
            <li>The PIC names are invalid</li>
            <li>The data hasn't been filled yet</li>
          </ul>

          <p>Please do a manual check to the <a href="https://docs.google.com/spreadsheets/d/${shiftSheet}">deployment shift sheet</a>.</p>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">

          <p style="font-size: 13px; color: #666;">
            This is an automated message from <b>Deploynaut</b>.
          </p>
        </div>`,
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', data: pics }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const route = e.parameters.route[0];

    if (route in Routes) {
      return Routes[route](e.parameters);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Route not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: `Script failed to execute due to: ${err.message}` }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

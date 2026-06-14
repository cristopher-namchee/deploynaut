import { chat } from '@googleapis/chat';
import { auth, sheets } from '@googleapis/sheets';
import { HolidayBackgrounds, JWT, SpreadsheetID } from '@/const';
import type { Employee, GoogleColor, PIC } from '@/types';
import { formatDate } from './date';

interface GoogleUserAPIResponse {
  name: string;
}

/**
 * Get auth token that can be used to interact with Google Chat API
 * using the provided service account credentials.
 *
 * @param {string} email Service account e-mail
 * @param {string} pem Service account private key
 * @returns {Promise<string>} Resolves into a string. If successful, it will
 * resolve into an access token. If not, it will resolve an empty string.
 */
export async function getGoogleAuthToken(
  email: string,
  pem: string,
): Promise<string> {
  const jwt = new auth.JWT({
    email,
    key: pem.replace(/\\n/gm, '\n'),
    scopes: JWT.Scopes,
  });
  const creds = await jwt.getAccessToken();

  if (!creds.token) {
    console.error('Failed to get credentials from service account');

    return '';
  }

  return creds.token;
}

function columnToLetter(column: number): string {
  return String.fromCharCode(column + 64);
}

function rgbToHex(rgb: GoogleColor) {
  if (!rgb) {
    return '#FFFFFF';
  }

  const r = Math.round((rgb.red || 0) * 255)
    .toString(16)
    .padStart(2, '0');
  const g = Math.round((rgb.green || 0) * 255)
    .toString(16)
    .padStart(2, '0');
  const b = Math.round((rgb.blue || 0) * 255)
    .toString(16)
    .padStart(2, '0');

  return `#${r}${g}${b}`.toUpperCase();
}

async function getRowByDate(token: string, date: Date) {
  const response = await sheets('v4').spreadsheets.values.get({
    spreadsheetId: SpreadsheetID,
    access_token: token,
    range: `A${7}:A`,
    valueRenderOption: 'FORMATTED_VALUE',
  });

  const rows = response.data.values;

  if (!rows || rows.length === 0) {
    return -1;
  }

  const values = rows.flat();

  const formattedTargetDate = formatDate(date, { locale: 'en-US' });
  const matchIndex = values.indexOf(formattedTargetDate);

  return matchIndex !== -1 ? matchIndex + 7 : -1;
}

export async function isHoliday(
  email: string,
  key: string,
  date: Date,
): Promise<boolean> {
  const jwt = new auth.JWT({
    email,
    key: key.replace(/\\n/gm, '\n'),
    scopes: JWT.Scopes,
  });
  const creds = await jwt.getAccessToken();

  if (!creds.token) {
    console.error('Failed to get credentials from service account');

    return false;
  }

  const targetRow = await getRowByDate(creds.token, date);

  const sampleRange = await sheets('v4').spreadsheets.get(
    {
      spreadsheetId: SpreadsheetID,
      ranges: [`${columnToLetter(10)}${targetRow}`],
      access_token: creds.token,
      includeGridData: true,
    },
    {},
  );

  const cell =
    sampleRange.data.sheets?.[0]?.data?.[0]?.rowData?.[0]?.values?.[0];
  const backgroundRgb = cell?.effectiveFormat?.backgroundColor;

  if (!backgroundRgb) {
    return false;
  }

  const hex = rgbToHex(backgroundRgb);

  return HolidayBackgrounds.includes(hex.toLowerCase());
}

export async function getSchedule(
  token: string,
  date: Date,
): Promise<PIC | null> {
  const targetRow = await getRowByDate(token, date);

  const dataToUpdate = [];
  const rangesToGet = [];
  const rangesToClear = [];

  for (let i = 0; i < 5; i++) {
    const dummyColumnLetter = columnToLetter(10 + i);
    const dummyRange = `${dummyColumnLetter}${row}`;

    const targetColumnLetter = columnToLetter(i + 2);
    const formula = `=${targetColumnLetter}${row}.email`;

    dataToUpdate.push({
      range: dummyRange,
      values: [[formula]],
    });

    rangesToGet.push(dummyRange);
    rangesToClear.push(dummyRange);
  }

  rangesToGet.push(`B${targetRow}:F${targetRow}`);

  const client = sheets('v4').spreadsheets.values;

  try {
    await client.batchUpdate({
      spreadsheetId: SpreadsheetID,
      access_token: token,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: dataToUpdate,
      },
    });

    const response = await client.batchGet({
      spreadsheetId: SpreadsheetID,
      access_token: token,
      ranges: rangesToGet,
    });

    await client.batchClear({
      spreadsheetId: SpreadsheetID,
      access_token: token,
      requestBody: {
        ranges: rangesToClear,
      },
    });

    const valueRanges = response.data.valueRanges;
    if (!valueRanges) {
      throw new Error(
        `Failed to get data from B${targetRow}:F${targetRow}, range doesn't exist.`,
      );
    }

    const users: Employee[] = [];

    for (let idx = 0; idx < 5; idx++) {
      const currentRange = valueRanges[idx];
      const lastRange = valueRanges[valueRanges.length - 1];

      if (!currentRange?.values || !lastRange?.values) {
        throw new Error('Something went wrong with the ranges');
      }

      const email = currentRange.values[0][0] as string;
      const name = lastRange.values[0][idx] as string;

      users.push({
        email: email === '#REF!' ? '' : email,
        name,
      });
    }

    return users as PIC;
  } catch (err) {
    console.error(err);

    return null;
  }
}

/**
 * Get Google Space user ID by email.
 *
 * @param {string} email User e-mail
 * @param {string} space Google space ID
 * @param {string} token Google access token that contains People API scopes
 * @returns {Promise<string>} Resolves into a string. If the user is not found, it will
 * resolve into an empty string.
 */
export async function getUserIdByEmail(
  email: string,
  space: string,
  token: string,
): Promise<string> {
  try {
    if (!email) {
      return '';
    }

    const url = new URL(
      `/v1/spaces/${space}/members/${email}`,
      'https://chat.googleapis.com',
    );

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Response returned ${response.status}`);
    }

    const data = (await response.json()) as GoogleUserAPIResponse;
    if (!data.name) {
      return '';
    }

    const [_space, _spaceId, _member, id] = data.name.split('/');

    return `users/${id}`;
  } catch (err) {
    console.error('Failed to get Google user ID:', err);

    return '';
  }
}

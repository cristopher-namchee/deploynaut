import { HolidayBackgrounds, JWT, SpreadsheetID } from '@/const';
import type { Employee, PIC } from '@/types';
import { formatDate } from './date';

interface GoogleAuthResponse {
  access_token: string;
}

interface GoogleSheetsValueRange {
  range: string;
  majorDimension: 'ROWS' | 'COLUMNS';
  values?: unknown[][];
}

interface GoogleRgbColor {
  red?: number;
  green?: number;
  blue?: number;
  alpha?: number;
}

interface GoogleCellData {
  effectiveFormat?: {
    backgroundColor?: GoogleRgbColor;
  };
}

interface GoogleGridData {
  rowData?: {
    values?: GoogleCellData[];
  }[];
}

interface GoogleSpreadsheetResponse {
  sheets?: {
    data?: GoogleGridData[];
  }[];
}

interface PersonProperties {
  email: string;
  displayFormat?: string;
}

interface ChipRun {
  startIndex?: number;
  chip?: {
    personProperties?: PersonProperties;
  };
}

interface CellValue {
  formattedValue?: string; // Note: singular formattedValue
  chipRuns?: ChipRun[];
}

interface RowData {
  values?: CellValue[];
}

interface GridData {
  rowData?: RowData[];
}

interface Sheet {
  data?: GridData[];
}

export interface ChipRunResponse {
  sheets?: Sheet[];
}

interface GoogleUserAPIResponse {
  name: string;
}

function b64(input: ArrayBuffer | string) {
  const bytes =
    typeof input === 'string'
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);

  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function pemToArrayBuffer(pem: string) {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '');

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

/**
 * Get auth token that can be used to interact with Google Chat API
 * using the provided service account credentials.
 *
 * @param {string} email Service account e-mail
 * @returns {Promise<string>} Resolves into a string. If successful, it will
 * resolve into an access token. If not, it will resolve an empty string.
 */
export async function getGoogleAuthToken(
  email: string,
  pem: string,
): Promise<string> {
  try {
    const iat = Math.floor(Date.now() / 1_000);
    const exp = iat + 3_600;

    const header = b64(JSON.stringify({ alg: JWT.Algorithm, typ: 'JWT' }));

    const claims = b64(
      JSON.stringify({
        iss: email,
        scope: JWT.Scopes.join(' '),
        aud: 'https://oauth2.googleapis.com/token',
        exp,
        iat,
      }),
    );

    const signatureInput = `${header}.${claims}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(pem),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      encoder.encode(signatureInput),
    );

    const jwt = `${signatureInput}.${b64(signature)}`;

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: JWT.Grant,
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      throw new Error(`Response returned ${response.status}`);
    }

    const body = (await response.json()) as GoogleAuthResponse;

    if (!body.access_token) {
      throw new Error('Access token is empty');
    }

    return body.access_token;
  } catch (err) {
    console.error('Failed to get access token from Google:', err);

    return '';
  }
}

function columnToLetter(column: number): string {
  return String.fromCharCode(column + 64);
}

function rgbToHex(rgb: GoogleRgbColor) {
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
  const range = `A7:A`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SpreadsheetID}/values/${range}?valueRenderOption=FORMATTED_VALUE`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Google Sheets API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: GoogleSheetsValueRange = await response.json();
  const rows = data.values;

  if (!rows || rows.length === 0) {
    return -1;
  }

  const values = rows.flat();
  const formattedTargetDate = formatDate(date, { locale: 'en-US' });
  const matchIndex = values.indexOf(formattedTargetDate);

  return matchIndex !== -1 ? matchIndex + 7 : -1;
}

/**
 * Checks whether a date doesn't have a deployment.
 *
 * A date doesn't have a deployment if it's marked with reddish background color as stated by PM.
 * If the check fails somehow, it will return `false` to force send.
 *
 * @param {string} token Google OAuth access token
 * @param {Date} date Date to check
 * @returns {Promise<boolean>} A promise that resolves into a boolean. `true` if there's no deployment
 * in that date. `false` otherwise.
 */
export async function isHoliday(token: string, date: Date): Promise<boolean> {
  try {
    const targetRow = await getRowByDate(token, date);
    // assume that it's not holiday if failed.
    if (targetRow === -1) {
      return false;
    }

    const cellCoordinate = `${columnToLetter(10)}${targetRow}`;

    const url = new URL(
      `https://sheets.googleapis.com/v4/spreadsheets/${SpreadsheetID}`,
    );
    url.searchParams.append('ranges', cellCoordinate);
    url.searchParams.append('includeGridData', 'true');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Google Sheets API error: ${response.status} ${response.statusText}`,
      );
    }

    const data: GoogleSpreadsheetResponse = await response.json();

    const cell = data.sheets?.[0]?.data?.[0]?.rowData?.[0]?.values?.[0];
    const backgroundRgb: GoogleRgbColor | undefined =
      cell?.effectiveFormat?.backgroundColor;

    if (!backgroundRgb) {
      return false;
    }

    const hex = rgbToHex(backgroundRgb);

    return HolidayBackgrounds.includes(hex.toLowerCase());
  } catch (err) {
    console.error('Failed to check date exclusion status:', err);

    // always send if you can't check.
    return false;
  }
}

/**
 * Get deployment PIC of a date.
 *
 * @param {string} token Google OAuth token
 * @param {Date} date Date to check
 * @returns {Promise<PIC | null>} A promise that resolves into array of users.
 * Or `null` if it fails somehow.
 */
export async function getSchedule(
  token: string,
  date: Date,
): Promise<PIC | null> {
  try {
    const targetRow = await getRowByDate(token, date);
    if (targetRow === -1) {
      return null;
    }

    const url = new URL(
      `/v4/spreadsheets/${SpreadsheetID}`,
      'https://sheets.googleapis.com',
    );
    const searchParams = new URLSearchParams();
    searchParams.append(
      'fields',
      'sheets.data.rowData.values(formattedValue,chipRuns)',
    );
    searchParams.append('ranges', `B${targetRow}:F${targetRow}`);

    url.search = searchParams.toString();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    const body = (await response.json()) as ChipRunResponse;

    const rows = body.sheets?.[0].data?.[0].rowData;
    const pics: Employee[][] = [];

    if (rows) {
      rows.forEach((cell) => {
        const cells = cell.values;

        cells?.forEach((cell) => {
          const actualValue = cell.formattedValue;
          const arr: { name: string; email: string }[] = [];

          let lastIdx = 0;
          let mail: string;

          cell.chipRuns?.forEach((cr) => {
            if (cr.chip) {
              mail = cr.chip?.personProperties?.email as string;
            } else if (cr.startIndex) {
              const name = actualValue?.slice(lastIdx, cr.startIndex) as string;
              lastIdx = cr.startIndex;

              arr.push({ name, email: mail });
              mail = '';
            }
          });

          pics.push(arr);
        });
      });
    }

    while (pics.length < 5) {
      pics.push([]);
    }

    return pics as PIC;
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

/**
 * Sends a message to a Google Space channel.
 *
 * @param {string} token Google OAuth access token
 * @param {string} channel Google Space channel ID to send the message
 * @param {string} message Actual content of the the message, formatted
 * using Google rules.
 * @returns A Promise that resolves to status of the request.
 */
export async function sendMessage(
  token: string,
  channel: string,
  message: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://chat.googleapis.com/v1/spaces/${channel}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`response returned ${response.status}`);
    }

    return response.ok;
  } catch (err) {
    console.error(`Failed to send message to channel ${channel}:`, err);

    return false;
  }
}

/**
 * Sends a message to a Google Space channel that can only be seen by a user.
 *
 * @param {string} token Google OAuth access token
 * @param {string} channel Google Space channel ID to send the message
 * @param {string} message Actual content of the the message, formatted
 * using Google rules.
 * @param {string} user User ID as target for the ephermal message.
 * @returns A Promise that resolves to status of the request.
 */
export async function sendEphmermalMessage(
  token: string,
  channel: string,
  message: string,
  user: string,
) {
  try {
    const response = await fetch(
      `https://chat.googleapis.com/v1/spaces/${channel}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
          privateMessageViewer: {
            name: user,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`response returned ${response.status}`);
    }

    return response.ok;
  } catch (err) {
    console.error(
      `Failed to send message ephermal to '${user} in channel '${channel}':`,
      err,
    );

    return false;
  }
}

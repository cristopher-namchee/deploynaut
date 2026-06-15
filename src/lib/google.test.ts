import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { SpreadsheetID } from '@/const';
import { getGoogleAuthToken, getUserIdByEmail, isHoliday } from '@/lib/google';

const mockServer = setupServer();

function arrayBufferToPem(buffer: ArrayBuffer) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

  const lines = base64.match(/.{1,64}/g)?.join('\n');

  return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`;
}

describe('getGoogleAuthToken', () => {
  const mockServiceAccount = {
    client_email: 'test@test.iam.gserviceaccount.com',
    private_key: '',
  };

  beforeAll(async () => {
    mockServer.listen();

    // mocking private key
    const keyPair = (await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify'],
    )) as CryptoKeyPair;

    const pkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const privateKeyPem = arrayBufferToPem(pkcs8 as ArrayBuffer);

    mockServiceAccount.private_key = privateKeyPem;
  });

  afterEach(() => {
    mockServer.resetHandlers();
    vi.resetAllMocks();
  });

  afterAll(() => {
    mockServer.close();
  });

  it('should resolve into empty string due to connection error', async () => {
    mockServer.use(
      http.post('https://oauth2.googleapis.com/token', async () => {
        throw new Error('Connection error');
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getGoogleAuthToken(
      mockServiceAccount.client_email,
      mockServiceAccount.private_key,
    );

    expect(result).toBe('');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should resolve into empty string when API returned non-200', async () => {
    mockServer.use(
      http.post('https://oauth2.googleapis.com/token', async () => {
        return HttpResponse.json({}, { status: 400 });
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getGoogleAuthToken(
      mockServiceAccount.client_email,
      mockServiceAccount.private_key,
    );

    expect(result).toBe('');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should resolve into empty string when access token is empty', async () => {
    mockServer.use(
      http.post('https://oauth2.googleapis.com/token', async () => {
        return HttpResponse.json({});
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getGoogleAuthToken(
      mockServiceAccount.client_email,
      mockServiceAccount.private_key,
    );

    expect(result).toBe('');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should resolve into an access token', async () => {
    mockServer.use(
      http.post('https://oauth2.googleapis.com/token', async () => {
        return HttpResponse.json({ access_token: 'token' });
      }),
    );

    const spy = vi.spyOn(console, 'error');

    const result = await getGoogleAuthToken(
      mockServiceAccount.client_email,
      mockServiceAccount.private_key,
    );

    expect(result).toBe('token');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('isHoliday', () => {
  beforeAll(async () => {
    mockServer.listen();
  });

  afterEach(() => {
    mockServer.resetHandlers();
    vi.resetAllMocks();
  });

  afterAll(() => {
    mockServer.close();
  });

  it('should return false when the date is not found in the sheet (getRowByDate returns -1)', async () => {
    mockServer.use(
      http.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SpreadsheetID}/values/A7:A`,
        () => {
          return HttpResponse.json({ values: [] });
        },
      ),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await isHoliday('token', new Date('2026-06-15'));

    expect(result).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should return false if the cell formatting API call returns a non-200 status code', async () => {
    mockServer.use(
      http.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SpreadsheetID}/values/A7:A`,
        () => {
          return HttpResponse.json({ values: [['Monday, June 15, 2026']] });
        },
      ),
    );

    mockServer.use(
      http.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SpreadsheetID}`,
        () => {
          return new HttpResponse(null, {
            status: 500,
            statusText: 'Internal Server Error',
          });
        },
      ),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await isHoliday('token', new Date('2026-06-15'));

    expect(result).toBe(false);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should return false when there is no background color applied to the targeted cell', async () => {
    mockServer.use(
      http.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SpreadsheetID}/values/A7:A`,
        () => {
          return HttpResponse.json({ values: [['Monday, June 15, 2026']] });
        },
      ),
    );

    mockServer.use(
      http.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SpreadsheetID}`,
        () => {
          return HttpResponse.json({
            sheets: [
              { data: [{ rowData: [{ values: [{ effectiveFormat: {} }] }] }] },
            ],
          });
        },
      ),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await isHoliday('token', new Date('2026-06-15'));

    expect(result).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should return false when the background color converts to a non-holiday hex', async () => {
    mockServer.use(
      http.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SpreadsheetID}/values/A7:A`,
        () => {
          return HttpResponse.json({ values: [['Monday, June 15, 2026']] });
        },
      ),
      http.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SpreadsheetID}`,
        () => {
          return HttpResponse.json({
            sheets: [
              {
                data: [
                  {
                    rowData: [
                      {
                        values: [
                          {
                            effectiveFormat: {
                              backgroundColor: { red: 1, green: 1, blue: 1 },
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        },
      ),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await isHoliday('token', new Date('2026-06-15'));

    expect(result).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should return true when background color matches HolidayBackgrounds registry', async () => {
    mockServer.use(
      http.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SpreadsheetID}/values/A7:A`,
        () => {
          return HttpResponse.json({ values: [['Monday, June 15, 2026']] });
        },
      ),
      http.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SpreadsheetID}`,
        () => {
          return HttpResponse.json({
            sheets: [
              {
                data: [
                  {
                    rowData: [
                      {
                        values: [
                          {
                            effectiveFormat: {
                              backgroundColor: { red: 1, green: 0, blue: 0 },
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        },
      ),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await isHoliday('token', new Date('2026-06-15'));

    expect(result).toBe(true);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('getUserIdByEmail', () => {
  beforeAll(async () => {
    mockServer.listen();
  });

  afterEach(() => {
    mockServer.resetHandlers();
    vi.resetAllMocks();
  });

  afterAll(() => {
    mockServer.close();
  });

  it('should return an empty string when the email is empty', async () => {
    mockServer.use(
      http.get('https://chat.googleapis.com/v1/spaces/123/members/', () => {
        return HttpResponse.json({
          name: 'should_not_get',
        });
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getUserIdByEmail('', '123', 'token');

    expect(result).toBe('');
    expect(spy).not.toHaveBeenCalled();
  });

  it('should return an empty string if People API returned non-200', async () => {
    mockServer.use(
      http.get(
        'https://chat.googleapis.com/v1/spaces/123/members/example@domain.com',
        () => {
          return HttpResponse.json({}, { status: 400 });
        },
      ),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getUserIdByEmail('example@domain.com', '123', 'token');

    expect(result).toBe('');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should return formatted user ID when the user is found', async () => {
    mockServer.use(
      http.get(
        'https://chat.googleapis.com/v1/spaces/123/members/example@domain.com',
        () => {
          return HttpResponse.json({
            name: 'spaces/1234/users/1234',
          });
        },
      ),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getUserIdByEmail('example@domain.com', '123', 'token');

    expect(result).toBe('users/1234');
    expect(spy).not.toHaveBeenCalled();
  });
});

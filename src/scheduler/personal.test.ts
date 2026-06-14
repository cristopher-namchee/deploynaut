import { afterEach, describe, expect, it, vi } from 'vitest';
import * as lib from '@/lib/google';
import type { PIC } from '@/types';
import { sendPICReminder } from './personal';

describe('sendDeploymentReminder', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should terminate if the app fails to get access token', async () => {
    const tokenSpy = vi
      .spyOn(lib, 'getGoogleAuthToken')
      .mockResolvedValueOnce('');
    const holidaySpy = vi.spyOn(lib, 'isHoliday');

    await sendPICReminder({
      SERVICE_ACCOUNT_EMAIL: 'EMAIL',
      SERVICE_ACCOUNT_PRIVATE_KEY: 'PK',
      DAILY_GOOGLE_SPACE: 'space',
      GITHUB_TOKEN: '',
      SCRIPT_URL: '',
    });

    expect(tokenSpy).toHaveBeenCalledOnce();
    expect(tokenSpy).toHaveBeenCalledWith('EMAIL', 'PK');

    expect(holidaySpy).not.toHaveBeenCalled();
  });

  it('should terminate if current date is holiday', async () => {
    const tokenSpy = vi
      .spyOn(lib, 'getGoogleAuthToken')
      .mockResolvedValueOnce('token');
    const holidaySpy = vi.spyOn(lib, 'isHoliday').mockResolvedValueOnce(true);
    const scheduleSpy = vi.spyOn(lib, 'getSchedule');
    const consoleSpy = vi
      .spyOn(console, 'log')
      .mockImplementationOnce(() => {});

    await sendPICReminder({
      SERVICE_ACCOUNT_EMAIL: 'EMAIL',
      SERVICE_ACCOUNT_PRIVATE_KEY: 'PK',
      DAILY_GOOGLE_SPACE: 'space',
      GITHUB_TOKEN: '',
      SCRIPT_URL: '',
    });

    expect(tokenSpy).toHaveBeenCalledOnce();
    expect(tokenSpy).toHaveBeenCalledWith('EMAIL', 'PK');

    expect(holidaySpy).toHaveBeenCalledOnce();
    expect(consoleSpy).toHaveBeenCalledOnce();

    expect(scheduleSpy).not.toHaveBeenCalled();
  });

  it('should send error message if the app fails to get schedules', async () => {
    const tokenSpy = vi
      .spyOn(lib, 'getGoogleAuthToken')
      .mockResolvedValueOnce('token');
    const holidaySpy = vi.spyOn(lib, 'isHoliday').mockResolvedValueOnce(false);
    const scheduleSpy = vi
      .spyOn(lib, 'getSchedule')
      .mockResolvedValueOnce(null);
    const userResolverSpy = vi.spyOn(lib, 'getUserIdByEmail');

    await sendPICReminder({
      SERVICE_ACCOUNT_EMAIL: 'EMAIL',
      SERVICE_ACCOUNT_PRIVATE_KEY: 'PK',
      DAILY_GOOGLE_SPACE: 'space',
      GITHUB_TOKEN: '',
      SCRIPT_URL: '',
    });

    expect(tokenSpy).toHaveBeenCalledOnce();
    expect(tokenSpy).toHaveBeenCalledWith('EMAIL', 'PK');

    expect(holidaySpy).toHaveBeenCalledOnce();

    expect(scheduleSpy).toHaveBeenCalledOnce();
    expect(userResolverSpy).not.toHaveBeenCalled();
  });

  it('should process employees and send ephemeral messages successfully', async () => {
    const tokenSpy = vi
      .spyOn(lib, 'getGoogleAuthToken')
      .mockResolvedValueOnce('mock-token');

    vi.spyOn(lib, 'isHoliday').mockResolvedValueOnce(false);

    const mockSchedule: PIC = [
      { email: 'index0@test.com', name: 'Zero' },
      { email: 'index1@test.com', name: 'One' },
      { email: 'index2@test.com', name: 'Two' },
      { email: 'index3@test.com', name: 'Three' },
      { email: 'index4@test.com', name: 'Four' },
    ];
    const scheduleSpy = vi
      .spyOn(lib, 'getSchedule')
      .mockResolvedValueOnce(mockSchedule);

    const userResolverSpy = vi
      .spyOn(lib, 'getUserIdByEmail')
      .mockImplementation(async (email) => {
        if (email === 'index1@test.com') return 'user-1';
        if (email === 'index2@test.com') return 'user-2';
        if (email === 'index4@test.com') return 'user-4';
        return '';
      });

    const sendMsgSpy = vi
      .spyOn(lib, 'sendEphmermalMessage')
      .mockResolvedValue(true);

    await sendPICReminder({
      SERVICE_ACCOUNT_EMAIL: 'EMAIL',
      SERVICE_ACCOUNT_PRIVATE_KEY: 'PK',
      DAILY_GOOGLE_SPACE: 'space-123',
      GITHUB_TOKEN: '',
      SCRIPT_URL: '',
    });

    expect(tokenSpy).toHaveBeenCalledWith('EMAIL', 'PK');
    expect(scheduleSpy).toHaveBeenCalledWith('mock-token', expect.any(Date));

    expect(userResolverSpy).toHaveBeenCalledTimes(3);
    expect(userResolverSpy).toHaveBeenCalledWith(
      'index1@test.com',
      'space-123',
      'mock-token',
    );
    expect(userResolverSpy).toHaveBeenCalledWith(
      'index2@test.com',
      'space-123',
      'mock-token',
    );
    expect(userResolverSpy).toHaveBeenCalledWith(
      'index4@test.com',
      'space-123',
      'mock-token',
    );

    expect(sendMsgSpy).toHaveBeenCalledTimes(3);
    expect(sendMsgSpy).toHaveBeenCalledWith(
      'mock-token',
      'space-123',
      expect.any(String),
      'user-1',
    );
    expect(sendMsgSpy).toHaveBeenCalledWith(
      'mock-token',
      'space-123',
      expect.any(String),
      'user-2',
    );
    expect(sendMsgSpy).toHaveBeenCalledWith(
      'mock-token',
      'space-123',
      expect.any(String),
      'user-4',
    );
  });

  it('should skip sending message if userId cannot be resolved', async () => {
    vi.spyOn(lib, 'getGoogleAuthToken').mockResolvedValueOnce('mock-token');
    vi.spyOn(lib, 'isHoliday').mockResolvedValueOnce(false);

    const mockSchedule: PIC = [
      { email: 'index0@test.com', name: 'Zero' },
      { email: 'index1@test.com', name: 'One' },
      { email: 'index2@test.com', name: 'Two' },
      { email: 'index3@test.com', name: 'Three' },
      { email: 'index4@test.com', name: 'Four' },
    ];
    vi.spyOn(lib, 'getSchedule').mockResolvedValueOnce(mockSchedule);

    vi.spyOn(lib, 'getUserIdByEmail').mockImplementation(async (email) => {
      if (email === 'index1@test.com') return '';
      return 'valid-user-id';
    });

    const sendMsgSpy = vi
      .spyOn(lib, 'sendEphmermalMessage')
      .mockResolvedValue(true);

    await sendPICReminder({
      SERVICE_ACCOUNT_EMAIL: 'EMAIL',
      SERVICE_ACCOUNT_PRIVATE_KEY: 'PK',
      DAILY_GOOGLE_SPACE: 'space-123',
      GITHUB_TOKEN: '',
      SCRIPT_URL: '',
    });

    expect(sendMsgSpy).toHaveBeenCalledTimes(2);
  });

  it('should log an error to console if sendEphmermalMessage fails', async () => {
    vi.spyOn(lib, 'getGoogleAuthToken').mockResolvedValueOnce('mock-token');
    vi.spyOn(lib, 'isHoliday').mockResolvedValueOnce(false);

    const mockSchedule: PIC = [
      { email: 'index0@test.com', name: 'Zero' },
      { email: 'index1@test.com', name: 'One' },
      { email: 'index2@test.com', name: 'Two' },
      { email: 'index3@test.com', name: 'Three' },
      { email: 'index4@test.com', name: 'Four' },
    ];
    vi.spyOn(lib, 'getSchedule').mockResolvedValueOnce(mockSchedule);
    vi.spyOn(lib, 'getUserIdByEmail').mockResolvedValue('user-id');

    vi.spyOn(lib, 'sendEphmermalMessage').mockResolvedValueOnce(false);
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await sendPICReminder({
      SERVICE_ACCOUNT_EMAIL: 'EMAIL',
      SERVICE_ACCOUNT_PRIVATE_KEY: 'PK',
      DAILY_GOOGLE_SPACE: 'space-123',
      GITHUB_TOKEN: '',
      SCRIPT_URL: '',
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to send message to 'user-id'"),
    );
  });
});

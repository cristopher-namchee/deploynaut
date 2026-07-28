import { afterEach, describe, expect, it, vi } from 'vitest';
import * as lib from '@/lib/google';
import type { PIC } from '@/types';
import { sendDeploymentReminder } from './channel';

describe('sendDeploymentReminder', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should terminate if the app fails to get access token', async () => {
    const tokenSpy = vi
      .spyOn(lib, 'getGoogleAuthToken')
      .mockResolvedValueOnce('');
    const holidaySpy = vi.spyOn(lib, 'isHoliday');

    await sendDeploymentReminder({
      SERVICE_ACCOUNT_EMAIL: 'EMAIL',
      SERVICE_ACCOUNT_PRIVATE_KEY: 'PK',
      DAILY_GOOGLE_SPACE: 'space',
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

    await sendDeploymentReminder({
      SERVICE_ACCOUNT_EMAIL: 'EMAIL',
      SERVICE_ACCOUNT_PRIVATE_KEY: 'PK',
      DAILY_GOOGLE_SPACE: 'space',
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
    const sendSpy = vi.spyOn(lib, 'sendMessage').mockResolvedValueOnce(false);

    await sendDeploymentReminder({
      SERVICE_ACCOUNT_EMAIL: 'EMAIL',
      SERVICE_ACCOUNT_PRIVATE_KEY: 'PK',
      DAILY_GOOGLE_SPACE: 'space',
    });

    expect(tokenSpy).toHaveBeenCalledOnce();
    expect(tokenSpy).toHaveBeenCalledWith('EMAIL', 'PK');

    expect(holidaySpy).toHaveBeenCalledOnce();

    expect(scheduleSpy).toHaveBeenCalledOnce();
    expect(sendSpy).toHaveBeenCalledOnce();
    expect(userResolverSpy).not.toHaveBeenCalled();
  });

  it('should format message with fallbacks when some user IDs fail to resolve', async () => {
    const tokenSpy = vi
      .spyOn(lib, 'getGoogleAuthToken')
      .mockResolvedValueOnce('token');
    vi.spyOn(lib, 'isHoliday').mockResolvedValueOnce(false);

    const mockSchedule: PIC = [
      [{ name: 'Bug Reporter', email: 'bugger@gdplabs.id' }],
      [{ name: 'PM', email: 'pm@company.com' }],
      [{ name: 'Engineer', email: 'eng@company.com' }],
      [{ name: 'Infra', email: 'infra@company.com' }],
      [{ name: 'QA', email: 'qa@company.com' }],
    ];
    vi.spyOn(lib, 'getSchedule').mockResolvedValueOnce(mockSchedule);

    const userResolverSpy = vi
      .spyOn(lib, 'getUserIdByEmail')
      .mockResolvedValueOnce('users/pm_id')
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce('users/qa_id')
      .mockResolvedValueOnce('');

    const sendSpy = vi.spyOn(lib, 'sendMessage').mockResolvedValueOnce(true);

    await sendDeploymentReminder({
      SERVICE_ACCOUNT_EMAIL: 'EMAIL',
      SERVICE_ACCOUNT_PRIVATE_KEY: 'PK',
      DAILY_GOOGLE_SPACE: 'space',
    });

    expect(tokenSpy).toHaveBeenCalledWith('EMAIL', 'PK');
    expect(userResolverSpy).toHaveBeenCalledTimes(4);
    expect(sendSpy).toHaveBeenCalledOnce();

    const sentMessage = sendSpy.mock.calls[0][2];
    expect(sentMessage).toContain('PM: <users/pm_id>');
    expect(sentMessage).toContain('Engineer: ⚠️');
    expect(sentMessage).toContain('QA: <users/qa_id>');
    expect(sentMessage).toContain('Infra: ⚠️');
  });

  it('should list every mention when a role has multiple PICs', async () => {
    vi.spyOn(lib, 'getGoogleAuthToken').mockResolvedValueOnce('token');
    vi.spyOn(lib, 'isHoliday').mockResolvedValueOnce(false);

    const mockSchedule: PIC = [
      [{ name: 'Bug Reporter', email: 'bugger@gdplabs.id' }],
      [
        { name: 'PM A', email: 'pm.a@company.com' },
        { name: 'PM B', email: 'pm.b@company.com' },
      ],
      [{ name: 'Engineer', email: 'eng@company.com' }],
      [],
      [{ name: 'QA', email: 'qa@company.com' }],
    ];
    vi.spyOn(lib, 'getSchedule').mockResolvedValueOnce(mockSchedule);

    const userResolverSpy = vi
      .spyOn(lib, 'getUserIdByEmail')
      .mockImplementation(async (email) => {
        if (email === 'pm.a@company.com') return 'users/pm_a';
        if (email === 'pm.b@company.com') return 'users/pm_b';
        if (email === 'eng@company.com') return 'users/eng';
        if (email === 'qa@company.com') return 'users/qa';
        return '';
      });

    const sendSpy = vi.spyOn(lib, 'sendMessage').mockResolvedValueOnce(true);

    await sendDeploymentReminder({
      SERVICE_ACCOUNT_EMAIL: 'EMAIL',
      SERVICE_ACCOUNT_PRIVATE_KEY: 'PK',
      DAILY_GOOGLE_SPACE: 'space',
    });

    // the empty Infra slot resolves nobody
    expect(userResolverSpy).toHaveBeenCalledTimes(4);

    const sentMessage = sendSpy.mock.calls[0][2];
    expect(sentMessage).toContain('PM: <users/pm_a> <users/pm_b>');
    expect(sentMessage).toContain('Engineer: <users/eng>');
    expect(sentMessage).toContain('QA: <users/qa>');
    expect(sentMessage).toContain('Infra: ⚠️');
  });

  it('should fully resolve all users, send the complete payload, and handle send failures gracefully', async () => {
    vi.spyOn(lib, 'getGoogleAuthToken').mockResolvedValueOnce('token');
    vi.spyOn(lib, 'isHoliday').mockResolvedValueOnce(false);

    const mockSchedule: PIC = [
      [{ name: 'Bug Reporter', email: 'bugger@gdplabs.id' }],
      [{ name: 'PM', email: 'pm@company.com' }],
      [{ name: 'Engineer', email: 'eng@company.com' }],
      [{ name: 'Infra', email: 'infra@company.com' }],
      [{ name: 'QA', email: 'qa@company.com' }],
    ];
    vi.spyOn(lib, 'getSchedule').mockResolvedValueOnce(mockSchedule);

    vi.spyOn(lib, 'getUserIdByEmail')
      .mockResolvedValueOnce('users/pm_123')
      .mockResolvedValueOnce('users/eng_456')
      .mockResolvedValueOnce('users/qa_789')
      .mockResolvedValueOnce('users/infra_000');

    const sendSpy = vi.spyOn(lib, 'sendMessage').mockResolvedValueOnce(false);
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementationOnce(() => {});

    await sendDeploymentReminder({
      SERVICE_ACCOUNT_EMAIL: 'EMAIL',
      SERVICE_ACCOUNT_PRIVATE_KEY: 'PK',
      DAILY_GOOGLE_SPACE: 'space',
    });

    const sentMessage = sendSpy.mock.calls[0][2];
    expect(sentMessage).toContain('PM: <users/pm_123>');
    expect(sentMessage).toContain('Engineer: <users/eng_456>');
    expect(sentMessage).toContain('QA: <users/qa_789>');
    expect(sentMessage).toContain('Infra: <users/infra_000>');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send message');
  });
});

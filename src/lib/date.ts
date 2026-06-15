interface DateFormatOptions extends Intl.DateTimeFormatOptions {
  locale?: Intl.LocalesArgument;
}

export function formatDate(
  date: string | number | Date,
  opts?: DateFormatOptions,
): string {
  return new Date(date).toLocaleDateString(opts?.locale ?? 'en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...opts,
  });
}

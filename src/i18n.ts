import { getRequestConfig } from 'next-intl/server';
import { ReactNode } from 'react';

const locales = ['th', 'en'];
const defaultLocale = 'th';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

export type Locale = (typeof locales)[number];

export { locales, defaultLocale };

import { getRequestConfig } from 'next-intl/server';
import { ReactNode } from 'react';

const locales = ['th', 'en'];
const defaultLocale = 'th';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../messages/${locale}.json`)).default,
}));

export type Locale = (typeof locales)[number];

export { locales, defaultLocale };

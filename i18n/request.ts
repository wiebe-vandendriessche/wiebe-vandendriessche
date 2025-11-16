import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';


export default getRequestConfig(async ({ requestLocale }) => {
    // Typically corresponds to the `[locale]` segment
    const requested = await requestLocale;
    const locale = hasLocale(routing.locales, requested)
        ? requested
        : routing.defaultLocale;

    // Load static messages
    const baseMessages = (await import(`../messages/${locale}.json`)).default as Record<string, any>;

    const messages = { ...baseMessages };

    return { locale, messages };
});
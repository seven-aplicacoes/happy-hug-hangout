export const isValidCalendlyUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:') return false;
    const host = parsedUrl.hostname;
    return host === 'calendly.com' || host.endsWith('.calendly.com');
  } catch (e) {
    return false;
  }
};

export const DEFAULT_CALENDLY_URL = import.meta.env.VITE_CALENDLY_DEFAULT_URL || null;

export const buildCalendlyUrl = (
  url: string | null | undefined,
  prefill?: { name?: string; email?: string }
): string | null => {
  if (!isValidCalendlyUrl(url)) return null;

  try {
    const finalUrl = new URL(url as string);
    
    if (prefill?.name) {
      finalUrl.searchParams.set('name', prefill.name);
    }
    
    if (prefill?.email) {
      finalUrl.searchParams.set('email', prefill.email);
    }
    
    finalUrl.searchParams.set('hide_gdpr_banner', '1');
    
    return finalUrl.toString();
  } catch (e) {
    return null;
  }
};

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
  prefill?: { name?: string; email?: string },
  tracking?: { 
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    clientId?: string;
    contractId?: string;
    productId?: string;
    moduleId?: string;
    meetingId?: string;
    consultantId?: string;
  }
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

    if (tracking?.utm_source) finalUrl.searchParams.set('utm_source', tracking.utm_source);
    if (tracking?.utm_medium) finalUrl.searchParams.set('utm_medium', tracking.utm_medium);
    if (tracking?.utm_campaign) finalUrl.searchParams.set('utm_campaign', tracking.utm_campaign);
    if (tracking?.utm_content) finalUrl.searchParams.set('utm_content', tracking.utm_content);
    if (tracking?.utm_term) finalUrl.searchParams.set('utm_term', tracking.utm_term);
    
    // Custom context params for additional tracking if Calendly passes them through
    if (tracking?.clientId) finalUrl.searchParams.set('seven_client_id', tracking.clientId);
    if (tracking?.contractId) finalUrl.searchParams.set('seven_contract_id', tracking.contractId);
    if (tracking?.productId) finalUrl.searchParams.set('seven_product_id', tracking.productId);
    if (tracking?.moduleId) finalUrl.searchParams.set('seven_module_id', tracking.moduleId);
    if (tracking?.meetingId) finalUrl.searchParams.set('seven_meeting_id', tracking.meetingId);
    if (tracking?.consultantId) finalUrl.searchParams.set('seven_consultant_id', tracking.consultantId);
    
    finalUrl.searchParams.set('hide_gdpr_banner', '1');
    
    return finalUrl.toString();
  } catch (e) {
    return null;
  }
};



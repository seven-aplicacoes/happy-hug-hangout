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

export interface CalendlyContext {
  clientId?: string;
  contractId?: string;
  productId?: string;
  moduleId?: string;
  meetingId?: string;
  consultantId?: string;
  clientName?: string;
  contractName?: string;
  productName?: string;
  moduleName?: string;
  meetingTitle?: string;
  consultantName?: string;
}

export const buildCalendlyUrl = (
  url: string | null | undefined,
  prefill?: { name?: string; email?: string },
  context?: CalendlyContext
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

    // UTM tracking params (source of truth for webhook)
    finalUrl.searchParams.set('utm_source', 'seven');
    finalUrl.searchParams.set('utm_medium', 'portal_cliente');
    finalUrl.searchParams.set('utm_campaign', 'module_meeting');
    
    if (context?.meetingId) finalUrl.searchParams.set('utm_content', context.meetingId);
    if (context?.clientId) finalUrl.searchParams.set('utm_term', context.clientId);
    
    // Custom context params for additional tracking if Calendly passes them through
    if (context?.clientId) finalUrl.searchParams.set('seven_client_id', context.clientId);
    if (context?.contractId) finalUrl.searchParams.set('seven_contract_id', context.contractId);
    if (context?.productId) finalUrl.searchParams.set('seven_product_id', context.productId);
    if (context?.moduleId) finalUrl.searchParams.set('seven_module_id', context.moduleId);
    if (context?.meetingId) finalUrl.searchParams.set('seven_meeting_id', context.meetingId);
    if (context?.consultantId) finalUrl.searchParams.set('seven_consultant_id', context.consultantId);
    
    finalUrl.searchParams.set('hide_gdpr_banner', '1');
    
    return finalUrl.toString();
  } catch (e) {
    return null;
  }
};




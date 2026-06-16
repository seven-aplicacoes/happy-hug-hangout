import type { Cliente } from '@/types';

export const normalizeSearch = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const normalizeCnpj = (value: unknown): string =>
  String(value ?? '').replace(/\D/g, '');

export function matchesClienteSearch(c: Pick<Cliente, 'nomeFantasia' | 'razaoSocial' | 'cnpj' | 'contact_name'>, term: string): boolean {
  const raw = term.trim();
  if (!raw) return true;

  const qText = normalizeSearch(raw);
  const qDigits = normalizeCnpj(raw);

  const fields = [c.nomeFantasia, c.razaoSocial, c.contact_name]
    .map(normalizeSearch)
    .filter(Boolean);

  if (qText && fields.some(f => f.includes(qText))) return true;
  if (qDigits && normalizeCnpj(c.cnpj).includes(qDigits)) return true;

  return false;
}

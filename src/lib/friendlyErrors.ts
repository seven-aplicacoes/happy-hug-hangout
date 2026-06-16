/**
 * Centralized translator from raw/technical errors into user-friendly messages.
 *
 * Goal: never expose Supabase/Postgres/network jargon, stack traces, status
 * codes or English technical messages to the end user. The original error is
 * still logged to the console for debugging.
 */

export type ErrorContext =
  | 'load'
  | 'save'
  | 'create'
  | 'update'
  | 'delete'
  | 'upload'
  | 'download'
  | 'login'
  | 'auth'
  | 'permission'
  | 'schedule'
  | 'integration'
  | 'duplicate'
  | 'validation'
  | 'generic';

export interface FriendlyMessage {
  title: string;
  description: string;
}

const CONTEXT_DEFAULTS: Record<ErrorContext, FriendlyMessage> = {
  load: {
    title: 'Não foi possível carregar as informações',
    description: 'Atualize a página ou tente novamente em alguns instantes.',
  },
  save: {
    title: 'Não foi possível salvar as alterações',
    description: 'Revise os dados preenchidos e tente novamente.',
  },
  create: {
    title: 'Não foi possível concluir o cadastro',
    description: 'Revise os dados informados e tente novamente.',
  },
  update: {
    title: 'Não foi possível salvar as alterações',
    description: 'Revise os dados informados e tente novamente.',
  },
  delete: {
    title: 'Não foi possível excluir este item',
    description: 'Ele pode estar vinculado a outros registros do sistema.',
  },
  upload: {
    title: 'Não foi possível enviar o arquivo',
    description: 'Verifique o formato e o tamanho do arquivo e tente novamente.',
  },
  download: {
    title: 'Não foi possível baixar o arquivo',
    description: 'Tente novamente em alguns instantes.',
  },
  login: {
    title: 'E-mail ou senha inválidos',
    description: 'Verifique os dados e tente novamente.',
  },
  auth: {
    title: 'Sua sessão expirou',
    description: 'Faça login novamente para continuar.',
  },
  permission: {
    title: 'Você não tem permissão para esta ação',
    description: 'Seu perfil não possui acesso. Se precisar, fale com um administrador.',
  },
  schedule: {
    title: 'Não foi possível agendar a reunião',
    description: 'Verifique a disponibilidade e tente outro horário.',
  },
  integration: {
    title: 'Não foi possível conectar com a integração',
    description: 'Tente novamente ou revise a conexão da integração.',
  },
  duplicate: {
    title: 'Este cadastro já existe',
    description: 'Verifique se este cliente, e-mail ou CNPJ já foi cadastrado.',
  },
  validation: {
    title: 'Revise os dados informados',
    description: 'Algumas informações obrigatórias estão em branco ou inválidas.',
  },
  generic: {
    title: 'Não foi possível concluir essa ação',
    description: 'Tente novamente em alguns instantes. Se o problema continuar, fale com o suporte.',
  },
};

function extractRaw(error: unknown): { message: string; code?: string; status?: number } {
  if (!error) return { message: '' };
  if (typeof error === 'string') return { message: error };
  const e = error as Record<string, any>;
  return {
    message: String(e.message ?? e.error_description ?? e.error ?? ''),
    code: e.code ?? e.error_code,
    status: e.status ?? e.statusCode,
  };
}

/**
 * Convert any error into a friendly title/description pair.
 * The original error is still logged via console.error for debugging.
 */
export function getFriendlyError(
  error: unknown,
  context: ErrorContext = 'generic',
): FriendlyMessage {
  // Always log the technical detail for developers
  if (error) {
    // eslint-disable-next-line no-console
    console.error(`[${context}]`, error);
  }

  const { message, code, status } = extractRaw(error);
  const m = message.toLowerCase();

  // Network / connectivity
  if (
    m.includes('failed to fetch') ||
    m.includes('network') ||
    m.includes('networkerror') ||
    m.includes('load failed')
  ) {
    return {
      title: 'Não foi possível conectar ao sistema',
      description: 'Verifique sua conexão com a internet e tente novamente.',
    };
  }

  // Auth / session
  if (
    m.includes('jwt') ||
    m.includes('session') && m.includes('expir') ||
    m.includes('not authenticated') ||
    code === 'PGRST301'
  ) {
    return {
      title: 'Sua sessão expirou',
      description: 'Faça login novamente para continuar.',
    };
  }

  if (m.includes('invalid login') || m.includes('invalid credentials') || m.includes('email not confirmed')) {
    if (m.includes('email not confirmed')) {
      return {
        title: 'E-mail ainda não confirmado',
        description: 'Confirme seu e-mail antes de entrar no sistema.',
      };
    }
    return {
      title: 'E-mail ou senha inválidos',
      description: 'Verifique os dados e tente novamente.',
    };
  }

  // Permission / RLS
  if (
    m.includes('permission denied') ||
    m.includes('rls') ||
    m.includes('row-level security') ||
    m.includes('row level security') ||
    m.includes('not allowed') ||
    code === '42501' ||
    status === 401 ||
    status === 403
  ) {
    return CONTEXT_DEFAULTS.permission;
  }

  // Duplicate
  if (
    m.includes('duplicate key') ||
    m.includes('already exists') ||
    m.includes('already registered') ||
    code === '23505'
  ) {
    if (m.includes('cnpj')) {
      return {
        title: 'CNPJ já cadastrado',
        description: 'Já existe um cliente com este CNPJ. Verifique os dados ou procure o cliente na listagem.',
      };
    }
    if (m.includes('email') || m.includes('e-mail')) {
      return {
        title: 'E-mail já cadastrado',
        description: 'Já existe um cadastro com este e-mail.',
      };
    }
    return CONTEXT_DEFAULTS.duplicate;
  }

  // Not null / required field
  if (m.includes('null value') || m.includes('not-null') || m.includes('violates not-null') || code === '23502') {
    return {
      title: 'Preencha os campos obrigatórios',
      description: 'Algumas informações necessárias não foram preenchidas. Revise o formulário e tente novamente.',
    };
  }

  // Foreign key
  if (m.includes('foreign key') || code === '23503') {
    return {
      title: 'Não foi possível concluir essa ação',
      description: 'Este item está vinculado a outros registros do sistema.',
    };
  }

  // Check constraint / invalid input
  if (m.includes('check constraint') || m.includes('invalid input syntax') || code === '22P02' || code === '23514') {
    return {
      title: 'Revise os dados informados',
      description: 'Algum campo está em um formato inválido. Verifique o formulário e tente novamente.',
    };
  }

  // File/upload errors
  if (m.includes('payload too large') || m.includes('file size') || m.includes('too large')) {
    return {
      title: 'Arquivo muito grande',
      description: 'Envie um arquivo menor e tente novamente.',
    };
  }
  if (m.includes('invalid mime') || m.includes('unsupported file') || m.includes('file type')) {
    return {
      title: 'Formato de arquivo não suportado',
      description: 'Verifique o formato do arquivo e tente novamente.',
    };
  }

  // HTTP status fallbacks
  if (status && status >= 500) {
    return {
      title: 'Não foi possível concluir essa ação',
      description: 'Tente novamente em alguns instantes. Se o problema continuar, fale com o suporte.',
    };
  }
  if (status === 404) {
    return {
      title: 'Item não encontrado',
      description: 'O registro pode ter sido removido ou você não tem acesso a ele.',
    };
  }

  return CONTEXT_DEFAULTS[context];
}

/**
 * Helper for toasts that expect `{ title, description, variant }`.
 */
export function friendlyErrorToast(
  error: unknown,
  context: ErrorContext = 'generic',
) {
  const { title, description } = getFriendlyError(error, context);
  return { title, description, variant: 'destructive' as const };
}

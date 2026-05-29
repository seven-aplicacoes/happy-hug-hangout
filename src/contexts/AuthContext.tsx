import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { PerfilUsuario } from '@/types';
import { clientes } from '@/data/mockData';

interface AuthUser {
  id: string;
  email: string;
  nome: string;
  role: 'admin' | 'consultor' | 'cliente';
  consultorId: string;
}

interface ClienteSession {
  clienteId: string;
  nome: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  perfil: PerfilUsuario | null;
  clienteSession: ClienteSession | null;
  login: (email: string, senha: string) => Promise<boolean>;
  loginCliente: (email: string, senha: string) => Promise<{ ok: boolean; erro?: string }>;
  logoutCliente: () => void;
  logout: () => void;
  selecionarPerfil: (p: PerfilUsuario) => void;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

// Login handling
import { supabase } from '@/integrations/supabase/client';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [clienteSession, setClienteSession] = useState<ClienteSession | null>(null);

  const login = async (email: string, _senha: string): Promise<boolean> => {
    return true;
  };

  const loginCliente = async (identificador: string, senha: string): Promise<{ ok: boolean; erro?: string }> => {
    const id = identificador.trim();
    if (!id || !senha) return { ok: false, erro: 'Preencha usuário e senha.' };

    let email = id;
    const isCNPJ = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$|^\d{14}$/.test(id);

    if (isCNPJ) {
      const cnpjLimpo = id.replace(/\D/g, '');
      const { data: client, error } = await supabase
        .from('clients')
        .select('email, portal_access_enabled, status')
        .eq('cnpj', cnpjLimpo)
        .single();

      if (error || !client) return { ok: false, erro: 'Cliente não encontrado com este CNPJ.' };
      if (!client.portal_access_enabled) return { ok: false, erro: 'Acesso ao portal desativado para este cliente.' };
      if (client.status !== 'ativo') return { ok: false, erro: 'Cadastro do cliente não está ativo.' };
      if (!client.email) return { ok: false, erro: 'Cliente não possui e-mail vinculado.' };
      email = client.email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) {
      if (error.message === 'Invalid login credentials') return { ok: false, erro: 'E-mail/CNPJ ou senha incorretos.' };
      return { ok: false, erro: error.message };
    }

    // Additional check for client role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile?.role !== 'cliente') {
      await supabase.auth.signOut();
      return { ok: false, erro: 'Este acesso não possui permissão de cliente.' };
    }

    // Verify linked client and access enabled
    const { data: clientData } = await supabase
      .from('clients')
      .select('id, trade_name, portal_access_enabled, status')
      .eq('auth_user_id', data.user.id)
      .single();

    if (!clientData) {
      await supabase.auth.signOut();
      return { ok: false, erro: 'Nenhum cliente vinculado a este usuário.' };
    }

    if (!clientData.portal_access_enabled || clientData.status !== 'ativo') {
      await supabase.auth.signOut();
      return { ok: false, erro: 'Acesso ao portal desativado ou cliente inativo.' };
    }

    setClienteSession({ 
      clienteId: clientData.id, 
      nome: clientData.trade_name, 
      email: email 
    });

    return { ok: true };
  };

  const logoutCliente = () => setClienteSession(null);

  const logout = () => {
    setUser(null);
    setPerfil(null);
    setClienteSession(null);
  };

  const selecionarPerfil = (p: PerfilUsuario) => setPerfil(p);

  return (
    <AuthContext.Provider value={{ user, perfil, clienteSession, login, loginCliente, logoutCliente, logout, selecionarPerfil, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};


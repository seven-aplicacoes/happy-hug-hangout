import { useState } from "react";
import { BaseModal } from "../BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield, Key, Copy, Check, RefreshCw, Loader2, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Cliente } from "@/types";

interface ModalAcessoPortalProps {
  open: boolean;
  onClose: () => void;
  cliente: Cliente;
}

export function ModalAcessoPortal({ open, onClose, cliente }: ModalAcessoPortalProps) {
  const [email, setEmail] = useState(cliente.email || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [enabled, setEnabled] = useState(cliente.portal_access_enabled || false);

  const validatePassword = (pwd: string): string | null => {
    if (!pwd || pwd.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
    if (!/[a-z]/.test(pwd)) return "A senha deve conter ao menos uma letra minúscula.";
    if (!/[A-Z]/.test(pwd)) return "A senha deve conter ao menos uma letra maiúscula.";
    if (!/[0-9]/.test(pwd)) return "A senha deve conter ao menos um número.";
    if (!/[!@#$%^&*()_+\-=\[\]{};':"|<>?,./`~]/.test(pwd)) return "A senha deve conter ao menos um caractere especial (ex: !@#$%).";
    return null;
  };

  const handleCreateAccess = async () => {
    if (!email) {
      toast({ title: "Erro", description: "E-mail é obrigatório.", variant: "destructive" });
      return;
    }
    const pwdError = validatePassword(password);
    if (pwdError) {
      toast({ title: "Senha inválida", description: pwdError, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-client-access", {
        body: {
          clientId: cliente.id,
          email,
          password,
          action: "create"
        }
      });

      if (error) throw error;
      
      toast({ title: "Sucesso", description: "Acesso ao portal criado com sucesso." });
      onClose();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const pwdError = validatePassword(password);
    if (pwdError) {
      toast({ title: "Senha inválida", description: pwdError, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("manage-client-access", {
        body: {
          clientId: cliente.id,
          password,
          action: "reset-password"
        }
      });

      if (error) throw error;
      
      toast({ title: "Sucesso", description: "Senha redefinida com sucesso." });
      setPassword("");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccess = async (val: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("manage-client-access", {
        body: {
          clientId: cliente.id,
          enabled: val,
          action: "toggle-access"
        }
      });

      if (error) throw error;
      
      setEnabled(val);
      toast({ title: "Sucesso", description: `Acesso ao portal ${val ? 'ativado' : 'desativado'}.` });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyLoginInfo = () => {
    const info = `Acesso ao Portal Seven\nURL: ${window.location.origin}/portal\nUsuário: ${email}\nCNPJ: ${cliente.cnpj}\nSenha: ${password || 'Sua senha cadastrada'}`;
    navigator.clipboard.writeText(info);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copiado", description: "Informações de login copiadas para a área de transferência." });
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      titulo={`Gerenciar Acesso ao Portal - ${cliente.nomeFantasia}`}
    >
      <div className="space-y-6 pt-2">
        {!cliente.auth_user_id ? (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                Este cliente ainda não possui acesso ao portal. Crie um novo usuário para liberar o login.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>E-mail de Login</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="email@cliente.com"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Senha Temporária</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="password"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    className="pl-9"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Mín. 8 caracteres, com maiúscula, minúscula, número e símbolo.</p>
              </div>

              <Button 
                className="w-full" 
                onClick={handleCreateAccess}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                Criar Acesso ao Portal
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Acesso ao Portal</p>
                <p className="text-xs text-muted-foreground">
                  {enabled ? "O cliente pode fazer login" : "O login está bloqueado"}
                </p>
              </div>
              <Switch 
                checked={enabled} 
                onCheckedChange={handleToggleAccess}
                disabled={loading}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>E-mail vinculado</Label>
                <Input value={cliente.email} disabled className="bg-muted" />
              </div>

              <div className="space-y-3 pt-2 border-t">
                <p className="text-sm font-medium">Redefinir Senha</p>
                <div className="flex gap-2">
                  <Input 
                    type="password"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Nova senha temporária"
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleResetPassword}
                    disabled={loading || !password}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="secondary" 
                  className="flex-1" 
                  onClick={copyLoginInfo}
                >
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copiar Credenciais
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}

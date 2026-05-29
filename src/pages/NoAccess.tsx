import { Button } from "@/components/ui/button";
import { SevenLogo } from "@/components/SevenLogo";
import { LogOut, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function NoAccess() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="mb-12">
        <SevenLogo fill="black" height={24} />
      </div>

      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Sem acesso disponível</h1>
          <p className="text-muted-foreground">
            Você não possui permissões configuradas para acessar os módulos do sistema. 
            Por favor, entre em contato com o administrador para solicitar acesso.
          </p>
        </div>

        <div className="pt-6">
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="w-full h-11"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair do sistema
          </Button>
        </div>
      </div>
    </div>
  );
}

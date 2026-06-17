import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConsultantProfile } from "@/hooks/useConsultores";
import { useToast } from "@/hooks/use-toast";
import { useConsultantGoals, IndicatorGoal } from "@/hooks/useConsultantGoals";
import { Separator } from "@/components/ui/separator";

// KPI_CONFIG removed - managed in AdminConsultantGoalsPage

interface ConsultorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  consultor?: ConsultantProfile | null;
  isProcessing: boolean;
  modo?: 'admin' | 'consultor';
}

interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
}

interface IBGECity {
  id: number;
  nome: string;
}

const ESPECIALIDADES = [
  { label: 'Gestão', value: 'gestao' },
  { label: 'Financeiro', value: 'financeiro' },
  { label: 'Comercial', value: 'comercial' },
  { label: 'Processos', value: 'processos' },
  { label: 'Pessoas', value: 'pessoas' },
  { label: 'Estratégia', value: 'estrategia' },
];

const CONSULTING_AREAS = [
  'Gestão de Pessoas',
  'Gestão de Marketing',
  'Gestão Comercial',
  'Gestão Financeira',
];

export const ConsultorModal = ({
  isOpen,
  onClose,
  onSave,
  consultor,
  isProcessing,
  modo = 'admin',
}: ConsultorModalProps) => {
  const { toast } = useToast();
  const [states, setStates] = useState<IBGEState[]>([]);
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    specialty: "",
    phone: "",
    city: "",
    state: "",
    password: "", // Only for creation
    status: "ativo",
    role: "consultor",
    max_clients: 10,
    hours_available: 160,
    consulting_area: "",
    user_category: "",
  });

  const { consultantGoals } = useConsultantGoals(consultor?.id);
  const [kpiTargets, setKpiTargets] = useState<Record<string, number>>({});

  useEffect(() => {
    if (consultantGoals) {
      const targetMap: Record<string, number> = {};
      consultantGoals.forEach(t => {
        targetMap[t.indicator_key] = t.goal_value;
      });
      setKpiTargets(targetMap);
    }
  }, [consultantGoals]);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
        const data = await response.json();
        setStates(data);
      } catch (error) {
        console.error("Erro ao carregar estados:", error);
      }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      if (!formData.state) {
        setCities([]);
        return;
      }
      setIsLoadingCities(true);
      try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios?orderBy=nome`);
        const data = await response.json();
        setCities(data);
      } catch (error) {
        console.error("Erro ao carregar cidades:", error);
      } finally {
        setIsLoadingCities(false);
      }
    };
    fetchCities();
  }, [formData.state]);

  useEffect(() => {
    if (consultor) {
      setFormData({
        full_name: consultor.full_name || "",
        email: consultor.email || "",
        specialty: consultor.specialty || "",
        phone: consultor.phone || "",
        city: consultor.city || "",
        state: consultor.state || "",
        password: "",
        status: consultor.status || "ativo",
        role: (consultor as any).role || "consultor",
        max_clients: consultor.max_clients || 10,
        hours_available: consultor.hours_available || 160,
        consulting_area: (consultor as any).consulting_area || "",
        user_category: (consultor as any).user_category || "",
      });
    } else {
      setFormData({
        full_name: "",
        email: "",
        specialty: "",
        phone: "",
        city: "",
        state: "",
        password: "",
        status: "ativo",
        role: "consultor",
        max_clients: 10,
        hours_available: 160,
        consulting_area: "",
        user_category: "",
      });
    }
  }, [consultor, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isAdmin = formData.role === 'admin';

    if (!formData.full_name || !formData.email || (!consultor && !formData.password) || !formData.role || !formData.status) {
      toast({
        title: "Preencha os campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!isAdmin && !formData.user_category) {
      toast({
        title: "Selecione o tipo de usuário",
        description: "Informe se o usuário é Interno ou Consultor.",
        variant: "destructive",
      });
      return;
    }

    if (!isAdmin && formData.user_category && !formData.consulting_area) {
      toast({
        title: "Selecione a área da consultoria",
        description: "A área é obrigatória para usuários Internos e Consultores.",
        variant: "destructive",
      });
      return;
    }

    await onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {consultor ? "Editar Usuário" : "Novo Usuário"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                placeholder="Ex: João Silva"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                required
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@exemplo.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={!!consultor}
                required
              />
            </div>
            {!consultor && (
              <div className="col-span-2 space-y-2">
                <Label htmlFor="password">Senha Temporária *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>
            )}
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  if (value.length > 11) value = value.slice(0, 11);
                  if (value.length > 10) {
                    value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
                  } else if (value.length > 6) {
                    value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
                  } else if (value.length > 2) {
                    value = value.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
                  } else if (value.length > 0) {
                    value = value.replace(/^(\d{0,2}).*/, "($1");
                  }
                  setFormData({ ...formData, phone: value });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Acesso *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value, ...(value === 'admin' ? { user_category: '', consulting_area: '' } : {}) })
                }
                disabled={modo === 'consultor'}
                required
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultor">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Define as permissões do usuário no sistema.</p>
            </div>

            {formData.role !== 'admin' && (
              <div className="space-y-2">
                <Label htmlFor="user_category">Tipo de Usuário *</Label>
                <Select
                  value={formData.user_category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, user_category: value })
                  }
                  disabled={modo === 'consultor'}
                >
                  <SelectTrigger id="user_category">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interno">Interno</SelectItem>
                    <SelectItem value="consultor">Consultor</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Define se atua como consultor ou colaborador interno.</p>
              </div>
            )}

            {(formData.role === 'admin' || formData.user_category) && (
              <div className="col-span-2 space-y-2">
                <Label htmlFor="consulting_area">
                  Área da Consultoria {formData.role !== 'admin' && formData.user_category ? '*' : ''}
                </Label>
                <Select
                  value={formData.consulting_area}
                  onValueChange={(value) =>
                    setFormData({ ...formData, consulting_area: value })
                  }
                  disabled={modo === 'consultor'}
                >
                  <SelectTrigger id="consulting_area">
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSULTING_AREAS.map((area) => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Área operacional à qual o usuário pertence.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
                disabled={modo === 'consultor'}
                required
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_clients">Limite de Clientes *</Label>
              <Input
                id="max_clients"
                type="number"
                min="0"
                value={formData.max_clients}
                onChange={(e) =>
                  setFormData({ ...formData, max_clients: parseInt(e.target.value) || 0 })
                }
                disabled={modo === 'consultor'}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours_available">Horas Disponíveis / Mês *</Label>
              <Input
                id="hours_available"
                type="number"
                min="0"
                value={formData.hours_available}
                onChange={(e) =>
                  setFormData({ ...formData, hours_available: parseInt(e.target.value) || 0 })
                }
                disabled={modo === 'consultor'}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Select
                value={formData.state}
                onValueChange={(value) =>
                  setFormData({ ...formData, state: value, city: "" })
                }
              >
                <SelectTrigger id="state">
                  <SelectValue placeholder="Selecione o Estado" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.sigla}>
                      {state.nome} ({state.sigla})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Select
                value={formData.city}
                onValueChange={(value) =>
                  setFormData({ ...formData, city: value })
                }
                disabled={!formData.state || isLoadingCities}
              >
                <SelectTrigger id="city">
                  <SelectValue placeholder={isLoadingCities ? "Carregando..." : "Selecione a Cidade"} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.nome}>
                      {city.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? "Processando..." : consultor ? "Salvar Alterações" : "Criar Acesso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

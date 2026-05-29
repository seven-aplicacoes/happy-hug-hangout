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

export const ConsultorModal = ({
  isOpen,
  onClose,
  onSave,
  consultor,
  isProcessing,
}: ConsultorModalProps) => {
  const { toast } = useToast();
  const [states, setStates] = useState<IBGEState[]>([]);
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    specialty: "",
    city: "",
    state: "",
    password: "", // Only for creation
    status: "ativo",
    role: "consultor",
    max_clients: 10,
    hours_available: 160,
  });

  const { consultantGoals, upsertConsultantGoal, defaultGoals } = useConsultantGoals(consultor?.id);
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
        city: consultor.city || "",
        state: consultor.state || "",
        password: "",
        status: consultor.status || "ativo",
        role: (consultor as any).role || "consultor",
        max_clients: consultor.max_clients || 10,
        hours_available: consultor.hours_available || 160,
      });
    } else {
      setFormData({
        full_name: "",
        email: "",
        specialty: "",
        city: "",
        state: "",
        password: "",
        status: "ativo",
        role: "consultor",
        max_clients: 10,
        hours_available: 160,
      });
    }
  }, [consultor, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final check for mandatory fields
    if (!formData.full_name || !formData.email || (!consultor && !formData.password) || !formData.role || !formData.status) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    await onSave(formData);
    
    // Save KPI targets
    if (consultor?.id) {
      for (const [key, value] of Object.entries(kpiTargets)) {
        const existing = consultantGoals?.find(t => t.indicator_key === key);
        const config = KPI_CONFIG.find(c => c.key === key);
        const defaultConfig = defaultGoals?.find(d => d.indicator_key === key);

        await upsertConsultantGoal.mutateAsync({
          id: existing?.id,
          consultant_id: consultor.id,
          indicator_key: key,
          indicator_label: config?.label || key,
          goal_value: value,
          goal_type: existing?.goal_type || defaultConfig?.goal_type || 'minimum',
          comparison_operator: existing?.comparison_operator || defaultConfig?.comparison_operator || 'greater_or_equal',
          active: true
        } as any);
      }
    }
    
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
            
            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Acesso *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
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

            <div className="col-span-2 space-y-2">
              <Label htmlFor="specialty">Especialidade Principal</Label>
              <Select
                value={formData.specialty}
                onValueChange={(value) =>
                  setFormData({ ...formData, specialty: value })
                }
              >
                <SelectTrigger id="specialty">
                  <SelectValue placeholder="Selecione uma especialidade" />
                </SelectTrigger>
                <SelectContent>
                  {ESPECIALIDADES.map((esp) => (
                    <SelectItem key={esp.value} value={esp.value}>
                      {esp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {consultor && (
              <div className="col-span-2 space-y-4 pt-4">
                <Separator />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Metas de KPIs</h4>
                  <p className="text-xs text-muted-foreground">Defina os benchmarks operacionais para este consultor.</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {KPI_CONFIG.map((kpi) => (
                    <div key={kpi.key} className="space-y-1.5">
                      <Label htmlFor={`kpi-${kpi.key}`} className="text-xs">
                        {kpi.label} ({kpi.unit})
                      </Label>
                      <Input
                        id={`kpi-${kpi.key}`}
                        type="number"
                        step="0.1"
                        value={kpiTargets[kpi.key] || ""}
                        onChange={(e) =>
                          setKpiTargets({ ...kpiTargets, [kpi.key]: parseFloat(e.target.value) || 0 })
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
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

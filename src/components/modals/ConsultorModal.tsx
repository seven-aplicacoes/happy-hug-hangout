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
import { useConsultantCalendlyEventTypes } from "@/hooks/useConsultantCalendlyEventTypes";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CalendarClock, ExternalLink, Loader2 } from "lucide-react";

import type { ConsultantCalendlyEventType } from "@/types";


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

const CalendlyEventTypesManager = ({ consultantId }: { consultantId: string }) => {
  const { eventTypes, isLoading, upsertEventType, deleteEventType } = useConsultantCalendlyEventTypes(consultantId);
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState<Partial<ConsultantCalendlyEventType>>({
    name: "",
    calendly_url: "",
    event_category: "followup",
    is_active: true,
    is_default: false
  });

  const handleAdd = async () => {
    if (!newType.name || !newType.calendly_url) return;
    await upsertEventType.mutateAsync(newType);
    setNewType({ name: "", calendly_url: "", event_category: "followup", is_active: true, is_default: false });
    setIsAdding(false);
  };

  if (isLoading) return <div className="text-center py-4"><Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {eventTypes?.map((et) => (
          <div key={et.id} className="flex items-center justify-between p-3 rounded-lg border bg-neutral-50 group">
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-900 truncate">{et.name}</p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[300px]">{et.calendly_url}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-[8px] uppercase">{et.event_category}</Badge>
                {et.is_default && <Badge variant="secondary" className="text-[8px] uppercase bg-primary/10 text-primary border-primary/20">Padrão</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => window.open(et.calendly_url, '_blank')}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/5" onClick={() => deleteEventType.mutate(et.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {isAdding ? (
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3 animate-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-wider">Nome do Tipo</Label>
            <Input 
              value={newType.name} 
              onChange={e => setNewType({ ...newType, name: e.target.value })} 
              placeholder="Ex: Kickoff, Reunião Mensal"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-wider">URL Calendly</Label>
            <Input 
              value={newType.calendly_url} 
              onChange={e => setNewType({ ...newType, calendly_url: e.target.value })} 
              placeholder="https://calendly.com/..."
              className="h-8 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-wider">Categoria</Label>
              <Select value={newType.event_category} onValueChange={v => setNewType({ ...newType, event_category: v })}>
                <SelectTrigger className="h-8 text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diagnostic">Diagnóstico</SelectItem>
                  <SelectItem value="kickoff">Kickoff</SelectItem>
                  <SelectItem value="followup">Acompanhamento</SelectItem>
                  <SelectItem value="closing">Encerramento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input 
                type="checkbox" 
                checked={newType.is_default} 
                onChange={e => setNewType({ ...newType, is_default: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Padrão para categoria</span>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="h-7 text-[10px] flex-1" onClick={handleAdd}>Salvar Link</Button>
            <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setIsAdding(false)}>Cancelar</Button>
          </div>
        </div>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full h-8 border-dashed gap-1.5 text-xs font-bold"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar link específico
        </Button>
      )}
    </div>
  );
};


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
    calendly_url: "",
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
        calendly_url: consultor.calendly_url || "",
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
        calendly_url: "",
      });
    }
  }, [consultor, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Calendly URL if provided
    if (formData.calendly_url && !formData.calendly_url.startsWith('https://calendly.com/')) {
       toast({
        title: "Link do Calendly inválido",
        description: "Informe uma URL válida do Calendly (ex: https://calendly.com/seu-usuario/reuniao).",
        variant: "destructive",
      });
      return;
    }

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
            <div className="col-span-2 space-y-4 pt-4">
              <Separator />
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-tight">Configuração de Agendamento Calendly</h3>
              </div>
              
              <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-dashed">
                <div className="space-y-2">
                  <Label htmlFor="calendly_url" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Link padrão do Calendly</Label>
                  <Input
                    id="calendly_url"
                    type="url"
                    placeholder="https://calendly.com/seu-usuario/reuniao"
                    value={formData.calendly_url}
                    onChange={(e) =>
                      setFormData({ ...formData, calendly_url: e.target.value })
                    }
                    className="h-10 bg-white"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Usado quando não houver um link específico para o tipo de encontro.</p>
                </div>

                {consultor && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Links específicos por tipo de encontro</Label>
                      <p className="text-[10px] text-muted-foreground">Use quando o consultor tiver links diferentes para diagnóstico, kickoff, acompanhamento ou encerramento.</p>
                    </div>
                    <CalendlyEventTypesManager consultantId={consultor.id} />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Acesso *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
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
            </div>

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
          
          {consultor && (
            <div className="space-y-4 pt-4">
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-tight">Links de Agendamento por Tipo</h3>
                </div>
              </div>
              
              <CalendlyEventTypesManager consultantId={consultor.id} />
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

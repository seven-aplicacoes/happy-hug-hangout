import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { DataTable, Column } from '@/components/DataTable';
import { useConsultores } from '@/hooks/useConsultores';
import { useConsultantGoals, IndicatorGoal } from '@/hooks/useConsultantGoals';
import { Loader2, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const KPI_KEYS = [
  { key: 'meetings_completed', label: 'Reuniões Realizadas' },
  { key: 'csat_responses', label: 'CSAT Respostas' },
  { key: 'csat_adherence', label: 'Adesão CSAT' },
  { key: 'csat_score', label: 'Nota CSAT' },
  { key: 'nps', label: 'NPS' },
  { key: 'meetings_per_client', label: 'Encontros por Cliente' },
  { key: 'critical_clinics', label: 'Clínicas em crítico' },
  { key: 'attention_clinics', label: 'Clínicas em atenção' },
  { key: 'contracts_ending_90_days', label: 'Encerrando em 90 dias' },
  { key: 'upsell_potential', label: 'Potencial upsell' },
  { key: 'active_tasks', label: 'Tarefas ativas' },
  { key: 'client_portfolio', label: 'Meus clientes' },
];

export default function AdminConsultantGoalsPage() {
  const { consultores, isLoading: loadingConsultores } = useConsultores();
  const [selectedConsultantId, setSelectedConsultantId] = useState<string>('');
  
  const { 
    consultantGoals, 
    defaultGoals, 
    isLoading: loadingGoals, 
    upsertConsultantGoal,
    deleteConsultantGoal,
    restoreDefaults 
  } = useConsultantGoals(selectedConsultantId);

  const [editingGoal, setEditingGoal] = useState<Partial<IndicatorGoal> | null>(null);

  const handleSaveGoal = async () => {
    if (!selectedConsultantId || !editingGoal?.indicator_key) return;
    
    try {
      await upsertConsultantGoal.mutateAsync({
        ...editingGoal,
        consultant_id: selectedConsultantId,
        indicator_label: KPI_KEYS.find(k => k.key === editingGoal.indicator_key)?.label || editingGoal.indicator_key,
      } as any);
      setEditingGoal(null);
    } catch (error) {
      // toast handled in hook
    }
  };

  const columns: Column<IndicatorGoal>[] = [
    { key: 'indicator_label', header: 'Indicador', render: (g) => g.indicator_label },
    { key: 'goal_value', header: 'Meta', render: (g) => g.goal_value },
    { key: 'goal_type', header: 'Tipo', render: (g) => (
      <span className="capitalize">{g.goal_type}</span>
    )},
    { key: 'comparison_operator', header: 'Comparação', render: (g) => (
      <code className="text-xs bg-muted px-1 rounded">{g.comparison_operator}</code>
    )},
    { 
      key: 'actions', 
      header: 'Ações', 
      render: (g) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditingGoal(g)}>
            Editar
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteConsultantGoal.mutate(g.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const selectedConsultant = useMemo(() => 
    consultores?.find(c => c.id === selectedConsultantId),
    [consultores, selectedConsultantId]
  );

  return (
    <div className="space-y-8">
      <PageHeader 
        titulo="Metas dos Consultores" 
        subtitulo="Configure os objetivos e limites de performance por usuário"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Selecionar Consultor</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedConsultantId} onValueChange={setSelectedConsultantId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {consultores?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-6">
          {selectedConsultantId ? (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Metas de {selectedConsultant?.full_name}</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => restoreDefaults.mutate(selectedConsultantId)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restaurar Padrão
                  </Button>
                  <Button size="sm" onClick={() => setEditingGoal({ indicator_key: '', goal_value: 0, goal_type: 'minimum', comparison_operator: 'greater_or_equal' })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Meta
                  </Button>
                </div>
              </div>

              {editingGoal && (
                <Card className="border-primary/50">
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <Label>Indicador</Label>
                        <Select 
                          value={editingGoal.indicator_key} 
                          onValueChange={(v) => setEditingGoal({ ...editingGoal, indicator_key: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {KPI_KEYS.map(k => (
                              <SelectItem key={k.key} value={k.key}>{k.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Valor da Meta</Label>
                        <Input 
                          type="number" 
                          step="0.1"
                          value={editingGoal.goal_value} 
                          onChange={(e) => setEditingGoal({ ...editingGoal, goal_value: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Tipo</Label>
                        <Select 
                          value={editingGoal.goal_type} 
                          onValueChange={(v: any) => setEditingGoal({ ...editingGoal, goal_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minimum">Mínimo</SelectItem>
                            <SelectItem value="maximum">Máximo</SelectItem>
                            <SelectItem value="target">Alvo</SelectItem>
                            <SelectItem value="informational">Informativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Comparação</Label>
                        <Select 
                          value={editingGoal.comparison_operator} 
                          onValueChange={(v: any) => setEditingGoal({ ...editingGoal, comparison_operator: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="greater_or_equal">GTE ( {'>'} = )</SelectItem>
                            <SelectItem value="less_or_equal">LTE ( {'<'} = )</SelectItem>
                            <SelectItem value="equal">Igual ( = )</SelectItem>
                            <SelectItem value="none">Nenhuma</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setEditingGoal(null)}>Cancelar</Button>
                      <Button onClick={handleSaveGoal}>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Meta
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {loadingGoals ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <DataTable 
                      data={consultantGoals || []} 
                      columns={columns}
                      emptyMessage="Nenhuma meta personalizada. Este consultor está usando os padrões globais."
                    />
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-20" />
              <p>Selecione um consultor para gerenciar suas metas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

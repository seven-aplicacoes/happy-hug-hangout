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
import { useConsultores } from '@/hooks/useConsultores';
import { useConsultantGoals, IndicatorGoal } from '@/hooks/useConsultantGoals';
import { Loader2, Save, Users, CheckCircle2, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

export default function AdminConsultantGoalsPage() {
  const { consultores } = useConsultores();
  const [selectedConsultantId, setSelectedConsultantId] = useState<string>('');
  
  const { 
    consultantGoals, 
    isLoading: loadingGoals, 
    upsertConsultantGoal 
  } = useConsultantGoals(selectedConsultantId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<IndicatorGoal>>({});

  const handleEdit = (goal: IndicatorGoal) => {
    setEditingId(goal.id);
    setEditValues(goal);
  };

  const handleSave = async () => {
    if (!editValues.id) return;
    await upsertConsultantGoal.mutateAsync(editValues);
    setEditingId(null);
  };

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
              </div>

              {loadingGoals ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Indicador</TableHead>
                          <TableHead>Meta Esperada</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead>Meta por Cliente Ativo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {consultantGoals?.map((goal) => (
                          <TableRow key={goal.id}>
                            <TableCell className="font-medium">{goal.indicator_label}</TableCell>
                            <TableCell>
                              {editingId === goal.id ? (
                                <Input 
                                  type="number" 
                                  className="w-24"
                                  value={editValues.goal_value}
                                  onChange={(e) => setEditValues({ ...editValues, goal_value: parseFloat(e.target.value) || 0 })}
                                />
                              ) : (
                                goal.goal_value
                              )}
                            </TableCell>
                            <TableCell>
                              {editingId === goal.id ? (
                                <Select 
                                  value={editValues.period_type} 
                                  onValueChange={(v: any) => setEditValues({ ...editValues, period_type: v })}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="weekly">Semanal</SelectItem>
                                    <SelectItem value="monthly">Mensal</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="capitalize">{goal.period_type === 'weekly' ? 'Semanal' : 'Mensal'}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingId === goal.id ? (
                                <div className="flex items-center space-x-2">
                                  <Switch 
                                    checked={editValues.is_per_client} 
                                    onCheckedChange={(v) => setEditValues({ ...editValues, is_per_client: v })} 
                                  />
                                  <Label>{editValues.is_per_client ? 'Sim' : 'Não'}</Label>
                                </div>
                              ) : (
                                <Badge variant={goal.is_per_client ? "default" : "secondary"}>
                                  {goal.is_per_client ? "Sim" : "Não"}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingId === goal.id ? (
                                <div className="flex items-center space-x-2">
                                  <Switch 
                                    checked={editValues.is_active} 
                                    onCheckedChange={(v) => setEditValues({ ...editValues, is_active: v })} 
                                  />
                                  <Label>{editValues.is_active ? 'Ativo' : 'Inativo'}</Label>
                                </div>
                              ) : (
                                goal.is_active ? (
                                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">Ativo</Badge>
                                ) : (
                                  <Badge variant="secondary">Inativo</Badge>
                                )
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {editingId === goal.id ? (
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                                    Cancelar
                                  </Button>
                                  <Button size="sm" onClick={handleSave} disabled={upsertConsultantGoal.isPending}>
                                    {upsertConsultantGoal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                    Salvar
                                  </Button>
                                </div>
                              ) : (
                                <Button variant="outline" size="sm" onClick={() => handleEdit(goal)}>
                                  Editar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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

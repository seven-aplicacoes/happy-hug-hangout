import { HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface IndiceSevenInfoProps {
  size?: 'sm' | 'md';
}

const FATORES = [
  { peso: 30, nome: 'Engajamento', desc: 'Frequência de reuniões realizadas e tempo de resposta do cliente.' },
  { peso: 25, nome: 'Aderência metodológica', desc: 'Avanço no processo Seven (Diagnóstico → Encerramento).' },
  { peso: 20, nome: 'Resultados entregues', desc: 'Entregáveis aprovados, metas atingidas e indicadores do cliente.' },
  { peso: 15, nome: 'Satisfação (CSAT/NPS)', desc: 'Avaliações pós-reunião e NPS trimestral.' },
  { peso: 10, nome: 'Saúde contratual', desc: 'Status do contrato, pagamento em dia e ausência de bloqueios.' },
];

export function IndiceSevenInfo({ size = 'sm' }: IndiceSevenInfoProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={`${size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'} p-0 text-muted-foreground hover:text-foreground`}>
          <HelpCircle className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} strokeWidth={1.5} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px]" align="start">
        <div className="space-y-3">
          <div>
            <p className="font-editorial text-lg leading-tight">O que é o Índice Seven?</p>
            <p className="text-xs text-muted-foreground mt-1">
              Score consolidado de 0 a 100 que mede a saúde de um cliente sob a metodologia Seven.
              Quanto maior, melhor o estado do projeto e a probabilidade de renovação.
            </p>
          </div>
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="ui-overline">Composição do cálculo</p>
            {FATORES.map(f => (
              <div key={f.nome} className="flex items-start gap-3">
                <span className="font-mono text-xs text-primary tabular-nums w-8 shrink-0 pt-0.5">{f.peso}%</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium">{f.nome}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-border text-[11px] text-muted-foreground">
            <p><span className="font-medium text-seven-success">≥ 80</span> Excelente · <span className="font-medium text-seven-warning">60–79</span> Atenção · <span className="font-medium text-seven-danger">&lt; 60</span> Crítico</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

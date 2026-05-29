import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// Using standard overflow for better scroll performance in popover

interface DurationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const DurationInput = ({ value, onChange, placeholder = "00:00", className }: DurationInputProps) => {
  const [hours, setHours] = useState("00");
  const [minutes, setMinutes] = useState("00");

  useEffect(() => {
    if (value && value.includes(":")) {
      const [h, m] = value.split(":");
      setHours(h.padStart(2, "0"));
      setMinutes(m.padStart(2, "0"));
    } else {
      setHours("00");
      setMinutes("00");
    }
  }, [value]);

  const handleSelect = (h: string, m: string) => {
    const newValue = `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
    onChange(newValue);
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" title="Selecionar duração">
            <Clock className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-48 p-0 z-[100]" 
          align="end"
          onWheel={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex h-64">
            <div className="flex-1 border-r">
              <div className="p-2 text-[10px] font-semibold text-muted-foreground uppercase text-center bg-muted/50">Horas</div>
              <div 
                className="h-[calc(100%-25px)] overflow-y-auto overflow-x-hidden overscroll-contain"
                onWheel={(e) => e.stopPropagation()}
              >
                <div className="p-1">
                  {Array.from({ length: 200 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelect(String(i), minutes)}
                      className={`w-full text-left px-2 py-1 text-sm rounded-sm hover:bg-accent ${
                        parseInt(hours) === i ? "bg-accent font-bold" : ""
                      }`}
                    >
                      {String(i).padStart(2, "0")}h
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="p-2 text-[10px] font-semibold text-muted-foreground uppercase text-center bg-muted/50">Min</div>
              <div 
                className="h-[calc(100%-25px)] overflow-y-auto overflow-x-hidden overscroll-contain"
                onWheel={(e) => e.stopPropagation()}
              >
                <div className="p-1">
                  {[0, 15, 30, 45, 59].map((m) => (
                    <button
                      key={m}
                      onClick={() => handleSelect(hours, String(m))}
                      className={`w-full text-left px-2 py-1 text-sm rounded-sm hover:bg-accent ${
                        parseInt(minutes) === m ? "bg-accent font-bold" : ""
                      }`}
                    >
                      {String(m).padStart(2, "0")}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

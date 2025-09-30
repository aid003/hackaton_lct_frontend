"use client";

import { useMemo } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { Textarea } from "@/shared/components/ui/textarea";
import type { PreviewData, SourceConfig, SourceType, TargetSystem } from "@/shared/store/pipelineWizard";

export function Step3Schedule(props: {
  cron: string;
  incrementalMode: "none" | "updated_at" | "id";
  incrementalColumn?: string;
  onChange: (upd: Partial<{ cron: string; incrementalMode: "none" | "updated_at" | "id"; incrementalColumn?: string }>) => void;
  summary: { sourceType: SourceType; source: SourceConfig; preview?: PreviewData; target?: TargetSystem; ddl: { clickhouse: string; postgresql: string; hdfs: string } };
  onPrev: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const { cron, incrementalMode, incrementalColumn, onChange, summary, onPrev, onSubmit, submitting } = props;
  const presets = useMemo(() => ([
    { label: "каждые 30 мин", cron: "*/30 * * * *" },
    { label: "каждый час", cron: "0 * * * *" },
    { label: "каждый день 03:00", cron: "0 3 * * *" },
  ] as const), []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>CRON</Label>
            <Select value={cron} onValueChange={(v) => onChange({ cron: v })}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Выберите пресет" /></SelectTrigger>
              <SelectContent>
                {presets.map((p) => (
                  <SelectItem key={p.cron} value={p.cron}>{p.label}</SelectItem>
                ))}
                <SelectItem value={cron}>Текущий: {cron}</SelectItem>
              </SelectContent>
            </Select>
            <Input value={cron} onChange={(e) => onChange({ cron: e.target.value })} placeholder="*/5 * * * *" />
          </div>
          <div className="space-y-2">
            <Label>Инкрементальный режим</Label>
            <RadioGroup value={incrementalMode} onValueChange={(v: "none" | "updated_at" | "id") => onChange({ incrementalMode: v })}>
              <div className="flex items-center space-x-2"><RadioGroupItem id="incr-none" value="none" /><Label htmlFor="incr-none">none</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem id="incr-upd" value="updated_at" /><Label htmlFor="incr-upd">updated_at</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem id="incr-id" value="id" /><Label htmlFor="incr-id">id</Label></div>
            </RadioGroup>
            {(incrementalMode === "updated_at" || incrementalMode === "id") && (
              <div className="space-y-2">
                <Label htmlFor="incr-col">Имя колонки</Label>
                <Input id="incr-col" value={incrementalColumn ?? ""} onChange={(e) => onChange({ incrementalColumn: e.target.value })} />
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Резюме</CardTitle>
              <CardDescription>Проверьте настройки перед запуском</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Источник:</span> <span className="font-medium">{summary.sourceType.toUpperCase()}</span></div>
              <div><span className="text-muted-foreground">Цель:</span> <span className="font-medium">{summary.target ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Строк в сэмпле:</span> <span className="font-medium">{summary.preview?.rowCount ?? 0}</span></div>
              <Separator />
              <div className="space-y-1">
                <div className="text-muted-foreground">DDL (свёрнуто):</div>
                <Textarea value={(summary.target ? summary.ddl[summary.target] : Object.values(summary.ddl)[0]) ?? ""} readOnly className="min-h-[120px]" />
              </div>
              <Separator />
              <div><span className="text-muted-foreground">CRON:</span> <span className="font-medium">{cron}</span></div>
              <div><span className="text-muted-foreground">Инкрементальный режим:</span> <span className="font-medium">{incrementalMode}{(incrementalMode === "updated_at" || incrementalMode === "id") && incrementalColumn ? ` (${incrementalColumn})` : ""}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={onPrev}>Назад</Button>
        <Button onClick={onSubmit} disabled={submitting}>Создать и запустить</Button>
      </div>
    </div>
  );
}



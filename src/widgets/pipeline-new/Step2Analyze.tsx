"use client";

import { useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Separator } from "@/shared/components/ui/separator";
import { Badge } from "@/shared/components/ui/badge";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Textarea } from "@/shared/components/ui/textarea";
import type { TargetSystem } from "@/shared/store/pipelineWizard";

// Детальное логирование для отладки
const logAnalysisData = (data: unknown, context: string) => {
  console.group(`🔍 [Step2Analyze] ${context}`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Data:', JSON.stringify(data, null, 2));
  
  // Дополнительная информация о размере данных
  if (data && typeof data === 'object') {
    console.log('Data size:', JSON.stringify(data).length, 'bytes');
    const dataObj = data as Record<string, unknown>;
    if (dataObj.preview) {
      const preview = dataObj.preview as Record<string, unknown>;
      console.log('Preview rows count:', preview.rowCount);
      console.log('Preview columns count:', (preview.columns as unknown[])?.length);
    }
    if (dataObj.result) {
      const result = dataObj.result as Record<string, unknown>;
      const recommendation = result.recommendation as Record<string, unknown>;
      console.log('Result recommendation target:', recommendation?.target);
      console.log('Result confidence:', recommendation?.confidence);
    }
  }
  console.groupEnd();
};

const logError = (error: unknown, context: string) => {
  console.group(`❌ [Step2Analyze] ERROR in ${context}`);
  console.error('Timestamp:', new Date().toISOString());
  console.error('Error object:', error);
  
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    console.error('Error message:', errorObj.message);
    console.error('Error stack:', errorObj.stack);
    if (errorObj.response) {
      console.error('HTTP Response:', errorObj.response);
    }
  }
  console.groupEnd();
};

export function Step2Analyze(props: {
  status: "idle" | "queued" | "started" | "progress" | "done" | "error";
  progress?: number;
  stage?: "extract" | "transform" | "load" | "validate";
  message?: string;
  result?: { recommendation: { target: TargetSystem; confidence: number; rationale: string; schedule_hint?: string }; ddl: { clickhouse: string; postgresql: string; hdfs: string } };
  editedDdl: { clickhouse: string; postgresql: string; hdfs: string };
  activeTarget?: TargetSystem;
  onActiveTargetChange: (t: TargetSystem) => void;
  onDdlChange: (sys: TargetSystem, ddl: string) => void;
  onAnalyze: () => void;
  error: string;
  onPrev: () => void;
  onNext: () => void;
  canNext: boolean;
}) {
  const { status, progress, stage, message, result, editedDdl, activeTarget, onActiveTargetChange, onDdlChange, onAnalyze, error, onPrev, onNext, canNext } = props;
  const target = activeTarget ?? result?.recommendation.target;
  const confidencePercent = Math.round((result?.recommendation.confidence ?? 0) * (result && result.recommendation.confidence <= 1 ? 100 : 1));

  // Логирование изменений статуса
  useEffect(() => {
    logAnalysisData({
      status,
      progress,
      stage,
      message,
      error,
      hasResult: !!result,
      activeTarget,
      target,
      confidencePercent,
      editedDdlKeys: Object.keys(editedDdl),
      canNext
    }, `Status changed to: ${status}`);
  }, [status, progress, stage, message, error, result, activeTarget, target, confidencePercent, editedDdl, canNext]);

  // Логирование результата анализа
  useEffect(() => {
    if (result) {
      logAnalysisData({
        recommendation: result.recommendation,
        ddl: {
          clickhouse: result.ddl.clickhouse?.length || 0,
          postgresql: result.ddl.postgresql?.length || 0,
          hdfs: result.ddl.hdfs?.length || 0
        },
        fullResult: result
      }, 'Analysis result received');
    }
  }, [result]);

  // Логирование ошибок
  useEffect(() => {
    if (error) {
      logError({ message: error, status, stage, progress }, 'Analysis error occurred');
    }
  }, [error, status, stage, progress]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="default" onClick={onAnalyze}>Анализировать</Button>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" onClick={onPrev}>Назад</Button>
          <Button variant="default" disabled={!canNext} onClick={onNext}>Далее</Button>
        </div>
      </div>

      {status !== "idle" && (
        <Card>
          <CardHeader>
            <CardTitle>Статус анализа</CardTitle>
            <CardDescription>
              {status === "queued" && "В очереди"}
              {status === "started" && "Запущен"}
              {status === "progress" && (stage ? `Прогресс: ${stage}` : "Прогресс")}
              {status === "done" && "Завершен"}
              {status === "error" && "Ошибка"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "progress" && (
              <div className="space-y-2">
                <Progress value={progress ?? 0} />
                {message && <p className="text-sm text-muted-foreground">{message}</p>}
              </div>
            )}
            {status === "error" && (
              <Alert variant="destructive">
                <AlertTitle>Ошибка анализа</AlertTitle>
                <AlertDescription>{error || "Что-то пошло не так"}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Рекомендованная цель (ML)</CardTitle>
              <CardDescription>
                Цель: <Badge>{result.recommendation.target}</Badge> · Уверенность: <Badge variant="secondary">{confidencePercent}%</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{result.recommendation.rationale}</p>
              {result.recommendation.schedule_hint && (
                <p className="text-sm">Подсказка по расписанию: <Badge variant="outline">{result.recommendation.schedule_hint}</Badge></p>
              )}
              <Separator />
              <div className="space-y-2">
                <Label>Выбранная цель</Label>
                <Select value={target} onValueChange={(v) => onActiveTargetChange(v as TargetSystem)}>
                  <SelectTrigger className="w-[240px]"><SelectValue placeholder="Цель" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clickhouse">ClickHouse</SelectItem>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="hdfs">HDFS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Tabs value={target} onValueChange={(v) => onActiveTargetChange(v as TargetSystem)}>
              <TabsList>
                <TabsTrigger value="clickhouse">ClickHouse</TabsTrigger>
                <TabsTrigger value="postgresql">PostgreSQL</TabsTrigger>
                <TabsTrigger value="hdfs">HDFS</TabsTrigger>
              </TabsList>
              <TabsContent value="clickhouse">
                <Textarea value={editedDdl.clickhouse} onChange={(e) => onDdlChange("clickhouse", e.target.value)} className="min-h-[220px]" />
              </TabsContent>
              <TabsContent value="postgresql">
                <Textarea value={editedDdl.postgresql} onChange={(e) => onDdlChange("postgresql", e.target.value)} className="min-h-[220px]" />
              </TabsContent>
              <TabsContent value="hdfs">
                <Textarea value={editedDdl.hdfs} onChange={(e) => onDdlChange("hdfs", e.target.value)} className="min-h-[220px]" />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}



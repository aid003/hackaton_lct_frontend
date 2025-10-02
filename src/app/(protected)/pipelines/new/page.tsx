"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import { toast } from "sonner";
import {
  apiAnalyzeStart,
  apiCreatePipeline,
  apiPreview,
} from "@/shared/api/pipelines";
import { safeErrorMessage } from "@/shared/api/http";
import { Step1Source } from "@/widgets/pipeline-new/Step1Source";
import { Step2Analyze } from "@/widgets/pipeline-new/Step2Analyze";
import { Step3Schedule } from "@/widgets/pipeline-new/Step3Schedule";

import {
  usePipelineWizard,
  type PreviewData,
  type TargetSystem,
} from "@/shared/store/pipelineWizard";
import { useWS } from "@/shared/api/ws/provider";
import type { WSEvent, WSCommand } from "@/shared/api/ws/events";
import { logWSEvent, logWSCommand } from "@/shared/api/ws/events";

// Детальное логирование для страницы пайплайна
const logPipelineData = (data: unknown, context: string) => {
  console.group(`📋 [PipelinePage] ${context}`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Data:', JSON.stringify(data, null, 2));

  if (data && typeof data === 'object') {
    const dataObj = data as Record<string, unknown>;

    if (dataObj.wizard) {
      const wizard = dataObj.wizard as Record<string, unknown>;
      console.log('Wizard step:', wizard.step);
      console.log('Wizard dirty:', wizard.dirty);
      console.log('Wizard sourceType:', wizard.sourceType);
      console.log('Wizard has preview:', !!wizard.preview);
      const analysis = wizard.analysis as Record<string, unknown>;
      console.log('Wizard analysis status:', analysis?.status);
      console.log('Wizard has result:', !!analysis?.result);
    }

    if (dataObj.selectedFile) {
      const file = dataObj.selectedFile as Record<string, unknown>;
      console.log('Selected file name:', file.name);
      console.log('Selected file size:', file.size, 'bytes');
      console.log('Selected file type:', file.type);
    }

    if (dataObj.error) {
      console.log('Error message:', dataObj.error);
    }
  }

  console.groupEnd();
};

type PreviewResponse = PreviewData;

export default function NewPipelinePage() {
  const router = useRouter();
  const ws = useWS();
  const wizard = usePipelineWizard();
  const [error, setError] = useState<string>("");
  const [analyzeError, setAnalyzeError] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Offline banner indicator
  const offline = ws.status !== "online";

  // Step guards
  const canGoToStep2 = !!wizard.preview && wizard.preview.rows.length > 0;
  const canGoToStep3 =
    wizard.analysis.status === "done" && !!wizard.analysis.result;

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (wizard.dirty) {
        e.preventDefault();
        e.returnValue = "Есть несохранённые изменения";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [wizard.dirty]);

  const handleTestPreview = useCallback(async () => {
    logPipelineData({
      wizard: {
        step: wizard.step,
        sourceType: wizard.sourceType,
        source: wizard.source,
        hasPreview: !!wizard.preview
      },
      selectedFile: selectedFile ? {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      } : null
    }, 'Starting preview test');

    setError("");
    wizard.resetPreview();
    try {
      let data: PreviewResponse;
      if (wizard.sourceType !== "postgresql") {
        if (!selectedFile) {
          throw new Error("Выберите файл источника");
        }
        const form = new FormData();
        form.append("file", selectedFile);
        form.append("fileType", wizard.sourceType);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

        logPipelineData({
          apiUrl,
          fileType: wizard.sourceType,
          fileName: selectedFile.name,
          fileSize: selectedFile.size
        }, 'Sending file preview request');

        const res = await fetch(`${apiUrl}/api/preview`, { method: "POST", body: form });
        if (!res.ok) {
          const msg = await safeErrorMessage(res);
          throw new Error(msg);
        }
        data = (await res.json()) as PreviewResponse;
      } else {
        logPipelineData({
          sourceType: wizard.sourceType,
          source: wizard.source
        }, 'Sending database preview request');

        data = await apiPreview({
          sourceType: wizard.sourceType,
          source: wizard.source,
        });
      }

      // Детальное логирование для отладки пустых колонок
      console.group('🔍 [DEBUG] Preview data analysis');
      console.log('Raw data:', data);
      console.log('Columns array:', data.columns);
      console.log('Columns length:', data.columns.length);
      data.columns.forEach((col, index) => {
        console.log(`Column ${index}:`, col);
        console.log(`Column ${index} name:`, col.name);
        console.log(`Column ${index} type:`, col.type);
      });
      console.groupEnd();

      logPipelineData({
        previewData: {
          rowCount: data.rowCount,
          columnsCount: data.columns.length,
          columns: data.columns.map(c => ({ name: c.name, type: c.type }))
        }
      }, 'Preview data received');

      wizard.setPreview(data);
      toast.success("Предпросмотр получен");
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Не удалось получить предпросмотр";
      logPipelineData({
        error: errorMessage,
        errorObject: e
      }, 'Preview error occurred');

      setError(errorMessage);
    }
  }, [
    wizard,
    selectedFile,
  ]);

  // WS analyze handlers
  useEffect(() => {
    const unsubscribes: Array<() => void> = [];
    const jobId = wizard.analysis.jobId;

    logPipelineData({
      jobId,
      hasJobId: !!jobId,
      wsStatus: ws.status
    }, 'Setting up WebSocket handlers');

    if (!jobId) return;

    const withId = (data: unknown): boolean => {
      const d = data as { id?: string; scope?: string } | undefined;
      return (
        !!d &&
        d.id === jobId &&
        (d.scope === "analyze" || d.scope === undefined)
      );
    };

    unsubscribes.push(
      ws.on("queued", (d) => {
        logWSEvent("queued", d, "WebSocket queued event");
        if (withId(d)) {
          logPipelineData({ jobId, eventData: d }, 'Processing queued event');
          wizard.setAnalysis((prev) => ({
            ...prev,
            status: "queued",
            message: undefined,
          }));
        }
      })
    );

    unsubscribes.push(
      ws.on("started", (d) => {
        logWSEvent("started", d, "WebSocket started event");
        if (withId(d)) {
          logPipelineData({ jobId, eventData: d }, 'Processing started event');
          wizard.setAnalysis((prev) => ({
            ...prev,
            status: "started",
            message: undefined,
          }));
        }
      })
    );

    unsubscribes.push(
      ws.on("progress", (d) => {
        logWSEvent("progress", d, "WebSocket progress event");
        if (withId(d)) {
          logPipelineData({
            jobId,
            eventData: d,
            progress: d.percent,
            stage: d.stage,
            message: d.message
          }, 'Processing progress event');

          wizard.setAnalysis((prev) => ({
            ...prev,
            status: "progress",
            progressPercent: d.percent,
            stage: d.stage,
            message: d.message,
          }));
        }
      })
    );

    unsubscribes.push(
      ws.on("error", (d) => {
        logWSEvent("error", d, "WebSocket error event");
        if (withId(d)) {
          logPipelineData({
            jobId,
            eventData: d,
            errorReason: d.reason
          }, 'Processing error event');

          wizard.setAnalysis((prev) => ({
            ...prev,
            status: "error",
            errorReason: d.reason,
          }));
          setAnalyzeError(d.reason);
          toast.error(`Ошибка анализа: ${d.reason}`);
        }
      })
    );

    unsubscribes.push(
      ws.on("done", (d) => {
        logWSEvent("done", d, "WebSocket done event");
        const dd = d as Extract<WSEvent, { type: "done" }>["data"]; // narrow
        if (!withId(dd)) return;
        if (dd.scope === "analyze") {
          logPipelineData({
            jobId,
            eventData: dd,
            hasPayload: !!dd.payload,
            recommendation: dd.payload?.recommendation,
            ddlKeys: dd.payload?.ddl ? Object.keys(dd.payload.ddl) : []
          }, 'Processing done event');

          wizard.setAnalysis((prev) => ({
            ...prev,
            status: "done",
            result: dd.payload
              ? {
                recommendation: dd.payload.recommendation,
                ddl: dd.payload.ddl,
              }
              : prev.result,
            editedDdl: dd.payload ? { ...dd.payload.ddl } : prev.editedDdl,
            activeTarget: dd.payload
              ? dd.payload.recommendation.target
              : prev.activeTarget,
          }));
          toast.success("Анализ завершён");
        }
      })
    );

    return () => {
      logPipelineData({ jobId }, 'Cleaning up WebSocket handlers');
      unsubscribes.forEach((u) => u());
    };
  }, [ws, wizard]);

  const startAnalyze = useCallback(async () => {
    logPipelineData({
      preview: wizard.preview ? {
        rowCount: wizard.preview.rowCount,
        columnsCount: wizard.preview.columns.length,
        columns: wizard.preview.columns.map(c => ({ name: c.name, type: c.type }))
      } : null,
      hasPreview: !!wizard.preview
    }, 'Starting analysis');

    setAnalyzeError("");
    try {
      const data = await apiAnalyzeStart({ preview: wizard.preview! });
      const jobId = data.job_id;

      logPipelineData({
        jobId,
        responseData: data
      }, 'Analysis started, received job ID');

      wizard.setAnalysis((prev) => ({ ...prev, status: "queued", jobId }));

      // subscribe via WS
      const cmd: WSCommand = {
        type: "subscribe",
        data: { topic: "analyze", id: jobId },
      };

      logWSCommand("subscribe", cmd.data, "Sending WebSocket subscribe command");
      ws.send(cmd);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Не удалось запустить анализ";
      logPipelineData({
        error: errorMessage,
        errorObject: e
      }, 'Analysis start error');

      setAnalyzeError(errorMessage);
    }
  }, [ws, wizard]);

  const recommendedTarget: TargetSystem | undefined =
    wizard.analysis.result?.recommendation.target ??
    wizard.analysis.activeTarget;

  const createPipeline = useCallback(async () => {
    if (!canGoToStep3) return;
    setCreating(true);
    try {
      const data = await apiCreatePipeline({
        sourceType: wizard.sourceType,
        source: wizard.source,
        preview: wizard.preview,
        target: recommendedTarget,
        ddl: wizard.analysis.editedDdl,
        schedule: wizard.schedule,
      });
      toast.success("Пайплайн создан и запущен");
      router.push(`/pipelines/${data.id}`);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Не удалось создать пайплайн"
      );
      setCreating(false);
    }
  }, [
    canGoToStep3,
    recommendedTarget,
    router,
    wizard.analysis.editedDdl,
    wizard.preview,
    wizard.schedule,
    wizard.source,
    wizard.sourceType,
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Новый пайплайн</h1>
          <p className="text-muted-foreground">
            Источник → Анализ (ML) → Подтверждение
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/pipelines">Назад</Link>
          </Button>
        </div>
      </div>

      {offline && (
        <Alert>
          <AlertTitle>Нет связи с WebSocket</AlertTitle>
          <AlertDescription>
            Переподключение выполняется автоматически…
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Шаг {wizard.step} из 3</CardTitle>
          <CardDescription>
            {wizard.step === 1 &&
              "Выберите источник данных и получите предпросмотр"}
            {wizard.step === 2 && "Запустите ML-анализ и изучите рекомендации"}
            {wizard.step === 3 && "Настройте расписание и подтвердите запуск"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {wizard.step === 1 && (
            <Step1Source
              sourceType={wizard.sourceType}
              source={wizard.source}
              onSourceTypeChange={wizard.setSourceType}
              onSourceChange={wizard.setSource}
              preview={wizard.preview}
              onTestPreview={handleTestPreview}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              error={error}
              onNext={() => wizard.setStep(2)}
              canNext={canGoToStep2}
            />
          )}
          {wizard.step === 2 && (
            <Step2Analyze
              status={wizard.analysis.status}
              progress={wizard.analysis.progressPercent}
              stage={wizard.analysis.stage}
              message={wizard.analysis.message}
              result={wizard.analysis.result}
              editedDdl={wizard.analysis.editedDdl}
              activeTarget={recommendedTarget}
              onActiveTargetChange={(t) =>
                wizard.setAnalysis((prev) => ({ ...prev, activeTarget: t }))
              }
              onDdlChange={(sys, ddl) =>
                wizard.setAnalysis((prev) => ({
                  ...prev,
                  editedDdl: { ...prev.editedDdl, [sys]: ddl },
                }))
              }
              onAnalyze={startAnalyze}
              error={analyzeError}
              onPrev={() => wizard.setStep(1)}
              onNext={() => wizard.setStep(3)}
              canNext={canGoToStep3}
            />
          )}
          {wizard.step === 3 && (
            <Step3Schedule
              cron={wizard.schedule.cron}
              incrementalMode={wizard.schedule.incrementalMode}
              incrementalColumn={wizard.schedule.incrementalColumn}
              onChange={(upd) =>
                wizard.setSchedule((prev) => ({ ...prev, ...upd }))
              }
              summary={{
                sourceType: wizard.sourceType,
                source: wizard.source,
                preview: wizard.preview,
                target: recommendedTarget,
                ddl: wizard.analysis.editedDdl,
              }}
              onPrev={() => wizard.setStep(2)}
              onSubmit={createPipeline}
              submitting={creating}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

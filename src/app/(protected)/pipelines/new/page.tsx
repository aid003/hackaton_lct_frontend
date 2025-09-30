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
        const res = await fetch("/api/preview", { method: "POST", body: form });
        if (!res.ok) {
          const msg = await safeErrorMessage(res);
          throw new Error(msg);
        }
        data = (await res.json()) as PreviewResponse;
      } else {
        data = await apiPreview({
          sourceType: wizard.sourceType,
          source: wizard.source,
        });
      }
      wizard.setPreview(data);
      toast.success("Предпросмотр получен");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не удалось получить предпросмотр"
      );
    }
  }, [
    wizard.sourceType,
    wizard.source,
    wizard.resetPreview,
    wizard.setPreview,
    selectedFile,
  ]);

  // WS analyze handlers
  useEffect(() => {
    const unsubscribes: Array<() => void> = [];
    const jobId = wizard.analysis.jobId;
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
        if (withId(d))
          wizard.setAnalysis((prev) => ({
            ...prev,
            status: "queued",
            message: undefined,
          }));
      })
    );
    unsubscribes.push(
      ws.on("started", (d) => {
        if (withId(d))
          wizard.setAnalysis((prev) => ({
            ...prev,
            status: "started",
            message: undefined,
          }));
      })
    );
    unsubscribes.push(
      ws.on("progress", (d) => {
        if (withId(d))
          wizard.setAnalysis((prev) => ({
            ...prev,
            status: "progress",
            progressPercent: d.percent,
            stage: d.stage,
            message: d.message,
          }));
      })
    );
    unsubscribes.push(
      ws.on("error", (d) => {
        if (withId(d)) {
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
        const dd = d as Extract<WSEvent, { type: "done" }>["data"]; // narrow
        if (!withId(dd)) return;
        if (dd.scope === "analyze") {
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
      unsubscribes.forEach((u) => u());
    };
  }, [ws, wizard.analysis.jobId, wizard.setAnalysis]);

  const startAnalyze = useCallback(async () => {
    setAnalyzeError("");
    try {
      const data = await apiAnalyzeStart({ preview: wizard.preview! });
      const jobId = data.job_id;
      wizard.setAnalysis((prev) => ({ ...prev, status: "queued", jobId }));
      // subscribe via WS
      const cmd: WSCommand = {
        type: "subscribe",
        data: { topic: "analyze", id: jobId },
      };
      ws.send(cmd);
    } catch (e) {
      setAnalyzeError(
        e instanceof Error ? e.message : "Не удалось запустить анализ"
      );
    }
  }, [ws, wizard.preview, wizard.setAnalysis]);

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

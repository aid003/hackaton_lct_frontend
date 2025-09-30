import { jsonFetch } from "@/shared/api/http";
import type { PreviewData, SourceConfig, SourceType, TargetSystem } from "@/shared/store/pipelineWizard";

export async function apiPreview(params: { sourceType: SourceType; source: SourceConfig }): Promise<PreviewData> {
  return jsonFetch<PreviewData>("/api/preview", { method: "POST", body: params });
}

export interface AnalyzeStartResponse { job_id: string }

export async function apiAnalyzeStart(payload: { preview: PreviewData }): Promise<AnalyzeStartResponse> {
  return jsonFetch<AnalyzeStartResponse>("/api/analyze", { method: "POST", body: payload });
}

export interface CreatePipelineResponse { id: string }

export async function apiCreatePipeline(payload: {
  sourceType: SourceType;
  source: SourceConfig;
  preview?: PreviewData;
  target?: TargetSystem;
  ddl: { clickhouse: string; postgresql: string; hdfs: string };
  schedule: { cron: string; incrementalMode: "none" | "updated_at" | "id"; incrementalColumn?: string };
}): Promise<CreatePipelineResponse> {
  return jsonFetch<CreatePipelineResponse>("/api/pipelines", { method: "POST", body: payload });
}



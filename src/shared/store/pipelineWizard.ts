import { create } from "zustand";

export type SourceType = "csv" | "json" | "xml" | "postgresql";

export interface FileSourceConfig {
  kind: "file";
  type: Exclude<SourceType, "postgresql">;
  pathOrUrl: string;
}

export interface PgSourceConfig {
  kind: "pg";
  dsn?: string;
  host?: string;
  port?: number;
  database?: string;
  table?: string;
  updatedAtColumn?: string;
}

export type SourceConfig = FileSourceConfig | PgSourceConfig;

export type InferredType = "string" | "number" | "bool" | "datetime";

export interface PreviewColumn {
  name: string;
  type: InferredType;
}

export interface PreviewData {
  columns: readonly PreviewColumn[];
  rows: readonly Readonly<Record<string, string | number | boolean | null>>[];
  rowCount: number;
}

export type AnalysisStatus = "idle" | "queued" | "started" | "progress" | "done" | "error";

export type TargetSystem = "clickhouse" | "postgresql" | "hdfs";

export interface Recommendation {
  target: TargetSystem;
  confidence: number; // 0..1 или 0..100 — трактуем как 0..1
  rationale: string;
  schedule_hint?: string;
}

export interface AnalysisResult {
  recommendation: Recommendation;
  ddl: { clickhouse: string; postgresql: string; hdfs: string };
}

export interface AnalysisState {
  status: AnalysisStatus;
  jobId?: string;
  progressPercent?: number;
  stage?: "extract" | "transform" | "load" | "validate";
  message?: string;
  errorReason?: string;
  result?: AnalysisResult;
  // Редактор DDL с текущими значениями
  editedDdl: { clickhouse: string; postgresql: string; hdfs: string };
  activeTarget?: TargetSystem;
}

export type IncrementalMode = "none" | "updated_at" | "id";

export interface ScheduleState {
  cron: string; // "*/30 * * * *" и т.п.
  incrementalMode: IncrementalMode;
  incrementalColumn?: string;
}

export interface PipelineWizardState {
  step: 1 | 2 | 3;
  dirty: boolean;
  sourceType: SourceType;
  source: SourceConfig;
  preview?: PreviewData;
  analysis: AnalysisState;
  schedule: ScheduleState;
  setStep: (s: 1 | 2 | 3) => void;
  setDirty: (d: boolean) => void;
  setSourceType: (t: SourceType) => void;
  setSource: (cfg: SourceConfig) => void;
  setPreview: (data?: PreviewData) => void;
  resetPreview: () => void;
  setAnalysis: (updater: (prev: AnalysisState) => AnalysisState) => void;
  setSchedule: (updater: (prev: ScheduleState) => ScheduleState) => void;
}

export const usePipelineWizard = create<PipelineWizardState>((set) => ({
  step: 1,
  dirty: false,
  sourceType: "csv",
  source: { kind: "file", type: "csv", pathOrUrl: "" },
  preview: undefined,
  analysis: {
    status: "idle",
    editedDdl: { clickhouse: "", postgresql: "", hdfs: "" },
    activeTarget: undefined,
  },
  schedule: { cron: "@hourly", incrementalMode: "none", incrementalColumn: undefined },
  setStep: (s) => set({ step: s }),
  setDirty: (d) => set({ dirty: d }),
  setSourceType: (t) => set({ sourceType: t, dirty: true }),
  setSource: (cfg) => set({ source: cfg, dirty: true }),
  setPreview: (data) => set({ preview: data, dirty: true }),
  resetPreview: () => set({ preview: undefined }),
  setAnalysis: (updater) => set((st) => ({ analysis: updater(st.analysis), dirty: true })),
  setSchedule: (updater) => set((st) => ({ schedule: updater(st.schedule), dirty: true })),
}));



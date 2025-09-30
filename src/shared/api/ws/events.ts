// Строгие типы событий и команд WebSocket

export type WSScope = "analyze" | "pipeline";

export interface QueuedPayload {
  scope: WSScope;
  id: string;
}

export interface StartedPayload {
  scope: WSScope;
  id: string;
}

export type ProgressStage = "extract" | "transform" | "load" | "validate";

export interface ProgressPayload {
  scope: WSScope;
  id: string;
  percent?: number;
  stage?: ProgressStage;
  message?: string;
}

export interface LogPayload {
  scope: WSScope;
  id: string;
  line: string;
}

// Разные payload для done по scope
export interface AnalyzeDonePayload {
  scope: "analyze";
  id: string;
  payload?: {
    recommendation: {
      target: "clickhouse" | "postgresql" | "hdfs";
      confidence: number;
      rationale: string;
      schedule_hint?: string;
    };
    ddl: {
      clickhouse: string;
      postgresql: string;
      hdfs: string;
    };
  };
}

export interface PipelineDonePayload {
  scope: "pipeline";
  id: string;
  payload?: {
    runId: string;
    rowsIn: number;
    rowsOut: number;
    durationMs: number;
  };
}

export type DonePayload = AnalyzeDonePayload | PipelineDonePayload;

export interface ErrorPayload {
  scope: WSScope;
  id: string;
  reason: string;
}

export interface CancelledPayload {
  scope: WSScope;
  id: string;
}

export interface PausedPayload {
  pipelineId: string;
}

export interface ResumedPayload {
  pipelineId: string;
}

// События от Backend → UI (readonly)
export type WSEvent =
  | { type: "connected" }
  | { type: "queued"; data: QueuedPayload }
  | { type: "started"; data: StartedPayload }
  | { type: "progress"; data: ProgressPayload }
  | { type: "log"; data: LogPayload }
  | { type: "done"; data: DonePayload }
  | { type: "error"; data: ErrorPayload }
  | { type: "cancelled"; data: CancelledPayload }
  | { type: "paused"; data: PausedPayload }
  | { type: "resumed"; data: ResumedPayload };

// Команды от UI → Backend
export type WSCommand =
  | { type: "subscribe"; data: { topic: WSScope; id: string } }
  | { type: "run_now"; data: { pipelineId: string } }
  | { type: "retry"; data: { runId: string } }
  | { type: "cancel"; data: { runId: string } }
  | { type: "pause"; data: { pipelineId: string } }
  | { type: "resume"; data: { pipelineId: string } };

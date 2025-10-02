// Строгие типы событий и команд WebSocket

// Детальное логирование для WebSocket событий
export const logWSEvent = (eventType: string, data: unknown, context: string) => {
  console.group(`🔌 [WebSocket] ${context} - ${eventType}`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Event type:', eventType);
  console.log('Data:', JSON.stringify(data, null, 2));

  // Дополнительная информация для разных типов событий
  if (data && typeof data === 'object') {
    const dataObj = data as Record<string, unknown>;

    if (dataObj.scope) {
      console.log('Scope:', dataObj.scope);
    }

    if (dataObj.id) {
      console.log('Job/Pipeline ID:', dataObj.id);
    }

    if (dataObj.percent !== undefined) {
      console.log('Progress:', dataObj.percent + '%');
    }

    if (dataObj.stage) {
      console.log('Stage:', dataObj.stage);
    }

    if (dataObj.message) {
      console.log('Message:', dataObj.message);
    }

    if (dataObj.reason) {
      console.log('Error reason:', dataObj.reason);
    }

    if (dataObj.payload) {
      console.log('Payload size:', JSON.stringify(dataObj.payload).length, 'bytes');
      const payload = dataObj.payload as Record<string, unknown>;
      if (payload.recommendation) {
        const recommendation = payload.recommendation as Record<string, unknown>;
        console.log('Recommendation target:', recommendation.target);
        console.log('Recommendation confidence:', recommendation.confidence);
      }
      if (payload.ddl) {
        console.log('DDL keys:', Object.keys(payload.ddl as Record<string, unknown>));
      }
    }
  }

  console.groupEnd();
};

export const logWSCommand = (commandType: string, data: unknown, context: string) => {
  console.group(`📤 [WebSocket] ${context} - ${commandType}`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Command type:', commandType);
  console.log('Data:', JSON.stringify(data, null, 2));

  if (data && typeof data === 'object') {
    const dataObj = data as Record<string, unknown>;

    if (dataObj.topic) {
      console.log('Topic:', dataObj.topic);
    }

    if (dataObj.id) {
      console.log('ID:', dataObj.id);
    }

    if (dataObj.pipelineId) {
      console.log('Pipeline ID:', dataObj.pipelineId);
    }

    if (dataObj.runId) {
      console.log('Run ID:', dataObj.runId);
    }
  }

  console.groupEnd();
};

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

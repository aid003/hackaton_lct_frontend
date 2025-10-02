import { jsonFetch } from "@/shared/api/http";
import type { PreviewData, SourceConfig, SourceType, TargetSystem } from "@/shared/store/pipelineWizard";

// Детальное логирование для API функций
const logApiCall = (endpoint: string, payload: unknown, context: string) => {
  console.group(`🌐 [API] ${context} - ${endpoint}`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Endpoint:', endpoint);
  console.log('Payload size:', JSON.stringify(payload).length, 'bytes');
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  // Дополнительная информация для preview
  if (payload && typeof payload === 'object') {
    const payloadObj = payload as Record<string, unknown>;
    if (payloadObj.sourceType) {
      console.log('Source type:', payloadObj.sourceType);
      console.log('Source config:', payloadObj.source);
    }
    
    // Дополнительная информация для analyze
    if (payloadObj.preview) {
      const preview = payloadObj.preview as Record<string, unknown>;
      console.log('Preview rows:', preview.rowCount);
      console.log('Preview columns:', (preview.columns as unknown[])?.length);
      console.log('Preview columns details:', (preview.columns as unknown[])?.map((c: unknown) => {
        const col = c as Record<string, unknown>;
        return { name: col.name, type: col.type };
      }));
    }
  }
  
  console.groupEnd();
};

const logApiResponse = (endpoint: string, response: unknown, context: string) => {
  console.group(`✅ [API] ${context} - ${endpoint} SUCCESS`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Response:', JSON.stringify(response, null, 2));
  
  if (response && typeof response === 'object') {
    const responseObj = response as Record<string, unknown>;
    if (responseObj.job_id) {
      console.log('Job ID:', responseObj.job_id);
    }
    
    if (responseObj.columns) {
      console.log('Response columns count:', (responseObj.columns as unknown[]).length);
      console.log('Response row count:', responseObj.rowCount);
    }
  }
  
  console.groupEnd();
};

const logApiError = (endpoint: string, error: unknown, context: string) => {
  console.group(`❌ [API] ${context} - ${endpoint} ERROR`);
  console.error('Timestamp:', new Date().toISOString());
  console.error('Endpoint:', endpoint);
  console.error('Error:', error);
  
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    console.error('Error message:', errorObj.message);
    console.error('Error stack:', errorObj.stack);
    
    if (errorObj.response) {
      const response = errorObj.response as Record<string, unknown>;
      console.error('HTTP Response status:', response.status);
      console.error('HTTP Response statusText:', response.statusText);
    }
  }
  
  console.groupEnd();
};

export async function apiPreview(params: { sourceType: SourceType; source: SourceConfig }): Promise<PreviewData> {
  logApiCall("/api/preview", params, "Preview request");
  
  try {
    const response = await jsonFetch<PreviewData>("/api/preview", { method: "POST", body: params });
    logApiResponse("/api/preview", response, "Preview response");
    return response;
  } catch (error) {
    logApiError("/api/preview", error, "Preview error");
    throw error;
  }
}

export interface AnalyzeStartResponse { job_id: string }

export async function apiAnalyzeStart(payload: { preview: PreviewData }): Promise<AnalyzeStartResponse> {
  logApiCall("/api/analyze", payload, "Analyze start request");
  
  try {
    const response = await jsonFetch<AnalyzeStartResponse>("/api/analyze", { method: "POST", body: payload });
    logApiResponse("/api/analyze", response, "Analyze start response");
    return response;
  } catch (error) {
    logApiError("/api/analyze", error, "Analyze start error");
    throw error;
  }
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



# Схема API для бэкенда пайплайнов

## Обзор

Фронтенд ожидает следующие API эндпоинты и WebSocket события для работы с пайплайнами данных.

---

## 1. API Эндпоинты

### 1.1 Предпросмотр данных

**POST** `/api/preview`

#### Для файлов (FormData):

```typescript
// Запрос
Content-Type: multipart/form-data
Body:
- file: File (CSV/JSON/XML)
- fileType: string ("csv" | "json" | "xml")

// Ответ
{
  columns: Array<{
    name: string;
    type: "string" | "number" | "bool" | "datetime";
  }>;
  rows: Array<Record<string, string | number | boolean | null>>;
  rowCount: number;
}
```

#### Для PostgreSQL (JSON):

```typescript
// Запрос
Content-Type: application/json
{
  sourceType: "postgresql";
  source: {
    kind: "pg";
    dsn?: string;
    host?: string;
    port?: number;
    database?: string;
    table?: string;
    updatedAtColumn?: string;
  };
}

// Ответ (тот же формат)
{
  columns: Array<{ name: string; type: string }>;
  rows: Array<Record<string, any>>;
  rowCount: number;
}
```

#### Ошибки:

- `400` - Файл не предоставлен / Недостаточно данных для подключения к БД
- `500` - Ошибка обработки файла / Ошибка подключения к БД

---

### 1.2 Запуск анализа

**POST** `/api/analyze`

```typescript
// Запрос
{
  preview: {
    columns: Array<{ name: string; type: string }>;
    rows: Array<Record<string, any>>;
    rowCount: number;
  }
}

// Ответ
{
  job_id: string; // Уникальный ID задачи для отслеживания через WebSocket
}
```

#### Ошибки:

- `400` - Некорректные данные предпросмотра
- `500` - Ошибка запуска анализа

---

### 1.3 Создание пайплайна

**POST** `/api/pipelines`

```typescript
// Запрос
{
  sourceType: "csv" | "json" | "xml" | "postgresql";
  source: {
    // Для файлов
    kind: "file";
    type: "csv" | "json" | "xml";
    pathOrUrl: string;
  } | {
    // Для PostgreSQL
    kind: "pg";
    dsn?: string;
    host?: string;
    port?: number;
    database?: string;
    table?: string;
    updatedAtColumn?: string;
  };
  preview?: {
    columns: Array<{ name: string; type: string }>;
    rows: Array<Record<string, any>>;
    rowCount: number;
  };
  target?: "clickhouse" | "postgresql" | "hdfs";
  ddl: {
    clickhouse: string;
    postgresql: string;
    hdfs: string;
  };
  schedule: {
    cron: string; // "*/30 * * * *", "@hourly", etc.
    incrementalMode: "none" | "updated_at" | "id";
    incrementalColumn?: string;
  };
}

// Ответ
{
  id: string; // ID созданного пайплайна
}
```

#### Ошибки:

- `400` - Некорректные параметры
- `500` - Ошибка создания пайплайна

---

## 2. WebSocket События

### 2.1 Подключение

```typescript
// URL: process.env.NEXT_PUBLIC_WS_URL
// Автоматическое переподключение при разрыве связи
```

### 2.2 Команды (от клиента)

#### Подписка на анализ:

```typescript
{
  type: "subscribe";
  data: {
    topic: "analyze";
    id: string; // job_id из /api/analyze
  }
}
```

#### Подписка на пайплайн:

```typescript
{
  type: "subscribe";
  data: {
    topic: "pipeline";
    id: string; // pipeline_id
  }
}
```

#### Возобновление пайплайна:

```typescript
{
  type: "resume";
  data: {
    pipelineId: string;
  }
}
```

### 2.3 События (от сервера)

#### Постановка в очередь:

```typescript
{
  type: "queued";
  data: {
    id: string; // job_id или pipeline_id
    scope?: "analyze" | "pipeline"; // опционально для анализа
  };
}
```

#### Начало выполнения:

```typescript
{
  type: "started";
  data: {
    id: string;
    scope?: "analyze" | "pipeline";
  };
}
```

#### Прогресс выполнения:

```typescript
{
  type: "progress";
  data: {
    id: string;
    scope?: "analyze" | "pipeline";
    percent: number; // 0-100
    stage?: "extract" | "transform" | "load" | "validate";
    message?: string;
  };
}
```

#### Логи:

```typescript
{
  type: "log";
  data: {
    id: string;
    scope?: "analyze" | "pipeline";
    level: "info" | "warn" | "error";
    line: string;
  };
}
```

#### Завершение анализа:

```typescript
{
  type: "done";
  data: {
    id: string;
    scope: "analyze";
    payload: {
      recommendation: {
        target: "clickhouse" | "postgresql" | "hdfs";
        confidence: number; // 0-1
        rationale: string;
        schedule_hint?: string;
      };
      ddl: {
        clickhouse: string;
        postgresql: string;
        hdfs: string;
      };
    };
  };
}
```

#### Завершение пайплайна:

```typescript
{
  type: "done";
  data: {
    id: string;
    scope: "pipeline";
    payload: {
      status: "success" | "failed";
      message?: string;
      stats?: {
        rows_processed: number;
        duration_ms: number;
      };
    };
  };
}
```

#### Ошибка:

```typescript
{
  type: "error";
  data: {
    id: string;
    scope?: "analyze" | "pipeline";
    reason: string;
  };
}
```

#### Возобновление пайплайна:

```typescript
{
  type: "resumed";
  data: {
    pipelineId: string;
  }
}
```

---

## 3. Типы данных

### 3.1 Источники данных

```typescript
type SourceType = "csv" | "json" | "xml" | "postgresql";

interface FileSourceConfig {
  kind: "file";
  type: Exclude<SourceType, "postgresql">;
  pathOrUrl: string;
}

interface PgSourceConfig {
  kind: "pg";
  dsn?: string;
  host?: string;
  port?: number;
  database?: string;
  table?: string;
  updatedAtColumn?: string;
}

type SourceConfig = FileSourceConfig | PgSourceConfig;
```

### 3.2 Целевые системы

```typescript
type TargetSystem = "clickhouse" | "postgresql" | "hdfs";
```

### 3.3 Расписание

```typescript
type IncrementalMode = "none" | "updated_at" | "id";

interface ScheduleState {
  cron: string;
  incrementalMode: IncrementalMode;
  incrementalColumn?: string;
}
```

---

## 4. Обработка ошибок

### 4.1 HTTP ошибки

- Все API эндпоинты должны возвращать JSON с полем `error`
- Использовать соответствующие HTTP статус коды
- Подробные сообщения об ошибках для отладки

### 4.2 WebSocket ошибки

- При ошибке отправлять событие `error` с полем `reason`
- Автоматическое переподключение при разрыве связи
- Повторная подписка на события после переподключения

---

## 5. Требования к производительности

### 5.1 Предпросмотр

- Ограничить количество строк в предпросмотре (например, первые 100)
- Быстрый ответ (< 2 секунд)

### 5.2 Анализ

- Асинхронная обработка через очереди
- Регулярные обновления прогресса через WebSocket
- Таймаут для длительных операций

### 5.3 Пайплайны

- Поддержка инкрементальных обновлений
- Мониторинг состояния через WebSocket
- Возможность приостановки/возобновления

---

## 6. Безопасность

- Валидация всех входящих данных
- Ограничение размера загружаемых файлов
- Санитизация SQL запросов для PostgreSQL
- Аутентификация через NextAuth (если требуется)

---

## 7. Примеры использования

### 7.1 Полный цикл создания пайплайна

1. **Загрузка файла** → `POST /api/preview` (FormData)
2. **Получение предпросмотра** → ответ с columns/rows
3. **Запуск анализа** → `POST /api/analyze` + WebSocket подписка
4. **Отслеживание анализа** → WebSocket события (queued → started → progress → done)
5. **Создание пайплайна** → `POST /api/pipelines`
6. **Мониторинг пайплайна** → WebSocket подписка на pipeline события

### 7.2 Работа с PostgreSQL

1. **Предпросмотр БД** → `POST /api/preview` (JSON с параметрами подключения)
2. **Остальные шаги** аналогично файлам

---

## 8. Переменные окружения

```bash
# WebSocket URL для фронтенда
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws

# Настройки бэкенда (пример)
DATABASE_URL=postgresql://user:pass@localhost/db
REDIS_URL=redis://localhost:6379
MAX_FILE_SIZE=10MB
```

"use client";

import { useRef } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { FileSpreadsheet, Braces, FileCode2, Database } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import type { PreviewData, SourceConfig, SourceType } from "@/shared/store/pipelineWizard";
import { safeErrorMessage } from "@/shared/api/http";

export function Step1Source(props: {
  sourceType: SourceType;
  source: SourceConfig;
  onSourceTypeChange: (t: SourceType) => void;
  onSourceChange: (cfg: SourceConfig) => void;
  preview?: PreviewData;
  onTestPreview: () => void;
  selectedFile: File | null;
  onSelectFile: (f: File | null) => void;
  error: string;
  onNext: () => void;
  canNext: boolean;
}) {
  const { sourceType, source, onSourceTypeChange, onSourceChange, preview, onTestPreview, selectedFile, onSelectFile, error, onNext, canNext } = props;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Тип источника</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { value: "csv", label: "CSV", desc: "Файлы .csv", Icon: FileSpreadsheet },
            { value: "json", label: "JSON", desc: "Файлы .json", Icon: Braces },
            { value: "xml", label: "XML", desc: "Файлы .xml", Icon: FileCode2 },
            { value: "postgresql", label: "PostgreSQL", desc: "Подключение к БД", Icon: Database },
          ] as const).map((opt) => {
            const selected = sourceType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSourceTypeChange(opt.value as SourceType);
                  if (opt.value === "postgresql") {
                    onSelectFile(null);
                  } else {
                    onSourceChange({ kind: "file", type: opt.value as Exclude<SourceType, "postgresql">, pathOrUrl: "" });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.currentTarget.click();
                  }
                }}
                aria-pressed={selected}
                className={
                  `group rounded-md border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-ring ` +
                  (selected ? "bg-muted border-border" : "hover:bg-muted/50")
                }
              >
                <div className="flex items-center gap-3">
                  <opt.Icon className="h-5 w-5 text-foreground" />
                  <div>
                    <div className="font-medium leading-none">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{opt.desc}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {sourceType !== "postgresql" ? (
        <div className="space-y-2">
          <Label>Файл источника</Label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={sourceType === "csv" ? ".csv,text/csv" : sourceType === "json" ? ".json,application/json" : ".xml,application/xml,text/xml"}
              className="hidden"
              onChange={(e) => onSelectFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>Выбрать файл</Button>
            <span className="text-sm text-muted-foreground truncate max-w-[320px]">{selectedFile ? selectedFile.name : "Файл не выбран"}</span>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dsn">DSN (опционально)</Label>
            <Input id="dsn" value={source.kind === "pg" ? (source.dsn ?? "") : ""} onChange={(e) => onSourceChange({ ...(source.kind === "pg" ? source : { kind: "pg" as const }), dsn: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="host">Хост</Label>
            <Input id="host" value={source.kind === "pg" ? (source.host ?? "") : ""} onChange={(e) => onSourceChange({ ...(source.kind === "pg" ? source : { kind: "pg" as const }), host: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="port">Порт</Label>
            <Input id="port" inputMode="numeric" value={source.kind === "pg" ? String(source.port ?? "") : ""} onChange={(e) => onSourceChange({ ...(source.kind === "pg" ? source : { kind: "pg" as const }), port: Number(e.target.value) || undefined })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="database">База</Label>
            <Input id="database" value={source.kind === "pg" ? (source.database ?? "") : ""} onChange={(e) => onSourceChange({ ...(source.kind === "pg" ? source : { kind: "pg" as const }), database: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="table">Таблица</Label>
            <Input id="table" value={source.kind === "pg" ? (source.table ?? "") : ""} onChange={(e) => onSourceChange({ ...(source.kind === "pg" ? source : { kind: "pg" as const }), table: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="updatedAt">Колонка updated_at (опционально)</Label>
            <Input id="updatedAt" value={source.kind === "pg" ? (source.updatedAtColumn ?? "") : ""} onChange={(e) => onSourceChange({ ...(source.kind === "pg" ? source : { kind: "pg" as const }), updatedAtColumn: e.target.value })} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button onClick={onTestPreview}>Тест подключения / Предпросмотр</Button>
        <Button variant="secondary" onClick={() => {/* черновик уже в Zustand */}}>Сохранить черновик</Button>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="default" disabled={!canNext} onClick={onNext}>Далее</Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Ошибка предпросмотра</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {preview && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Колонок: {preview.columns.length}</Badge>
            <Badge variant="secondary">Строк в сэмпле: {preview.rowCount}</Badge>
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {preview.columns.map((c) => (
                    <TableHead key={c.name}>
                      <div className="flex items-center gap-2">
                        <span>{c.name}</span>
                        <Badge variant="outline">{c.type}</Badge>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.map((r, idx) => (
                  <TableRow key={idx}>
                    {preview.columns.map((c) => (
                      <TableCell key={c.name}>{formatCell(r[c.name])}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

function formatCell(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}



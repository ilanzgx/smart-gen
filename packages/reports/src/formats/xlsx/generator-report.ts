import ExcelJS from "exceljs";
import type { ReportGenerator, ReportReading } from "../../types";

const TEMP_CRITICA = 40; // °C
const NIVEL_AGUA_CRITICO = 5; // %
const RESERVATORIO_CAPACIDADE_MAXIMA = 2000; // mL

interface DaySummary {
  date: string;
  totalReadings: number;
  temperatures: number[];
  waterLevels: number[];
  criticalAlerts: number;
  hasNullReadings: boolean;
}

/**
 * Agrupa as leituras por dia e calcula estatísticas resumidas.
 * @param readings - Array de leituras a serem agrupadas.
 * @returns Array de resumos por dia.
 */
function groupReadingsByDay(readings: ReportReading[]): DaySummary[] {
  const dayMap = new Map<string, DaySummary>();

  for (const reading of readings) {
    if (!reading.timestamp) continue;

    const dateKey = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(reading.timestamp));

    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, {
        date: dateKey,
        totalReadings: 0,
        temperatures: [],
        waterLevels: [],
        criticalAlerts: 0,
        hasNullReadings: false,
      });
    }

    const summary = dayMap.get(dateKey)!;
    summary.totalReadings++;

    if (reading.temperatura !== null) {
      summary.temperatures.push(reading.temperatura);
      if (reading.temperatura >= TEMP_CRITICA) summary.criticalAlerts++;
    } else {
      summary.hasNullReadings = true;
    }

    if (reading.nivel_agua !== null) {
      summary.waterLevels.push(reading.nivel_agua);
      if (reading.nivel_agua <= NIVEL_AGUA_CRITICO) summary.criticalAlerts++;
    } else {
      summary.hasNullReadings = true;
    }
  }

  // Ordena do dia mais recente para o mais antigo
  return Array.from(dayMap.values()).reverse();
}

/**
 * Gera o relatório em XLSX a partir dos dados do gerador e das leituras.
 * @param generator - Dados do gerador.
 * @param readings - Array de leituras.
 * @param period - Período de tempo opcional.
 * @returns ArrayBuffer do XLSX gerado.
 */
export async function generateReportXlsx(
  generator: ReportGenerator,
  readings: ReportReading[],
  period?: string,
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Smart Gen";
  workbook.created = new Date();

  // Planilha 1: Resumo
  const summarySheet = workbook.addWorksheet("Resumo");
  summarySheet.columns = [
    { header: "Propriedade", key: "prop", width: 30 },
    { header: "Valor", key: "val", width: 40 },
  ];

  const hasCriticalAlerts = readings.some(
    (r) =>
      (r.temperatura !== null && r.temperatura >= TEMP_CRITICA) ||
      (r.nivel_agua !== null && r.nivel_agua <= NIVEL_AGUA_CRITICO),
  );

  const statusValue = hasCriticalAlerts ? "Atenção" : "Normal";

  let currentWaterLevelPercent: number | null = null;
  let latestTimestamp = -Infinity;

  for (const r of readings) {
    if (r.nivel_agua !== null && r.timestamp) {
      const ts = new Date(r.timestamp).getTime();
      if (ts > latestTimestamp) {
        latestTimestamp = ts;
        currentWaterLevelPercent = r.nivel_agua;
      }
    }
  }

  const currentVolume =
    currentWaterLevelPercent !== null
      ? (currentWaterLevelPercent / 100) * RESERVATORIO_CAPACIDADE_MAXIMA
      : null;

  summarySheet.addRows([
    { prop: "Nome do Gerador", val: generator.name ?? "Não Nomeado" },
    { prop: "ID Interno", val: generator.id },
    { prop: "Endereço MAC (ESP32)", val: generator.esp32_id ?? "N/A" },
    { prop: "Status Geral", val: statusValue },
    { prop: "Período", val: period ?? "N/A" },
    { prop: "Total de Leituras", val: readings.length },
    {
      prop: "Capacidade do Reservatório",
      val: `${RESERVATORIO_CAPACIDADE_MAXIMA} mL`,
    },
    {
      prop: "Volume Atual",
      val:
        currentVolume !== null
          ? `${currentVolume.toFixed(0)} mL (${currentWaterLevelPercent?.toFixed(1)}%)`
          : "Desconhecido",
    },
  ]);

  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getColumn("prop").font = { bold: true };

  // Planilha 2: Resumo Diária
  const dailySheet = workbook.addWorksheet("Resumo Diário");
  dailySheet.columns = [
    { header: "Data", key: "date", width: 15 },
    { header: "Leituras", key: "count", width: 15 },
    { header: "Temp. Média (°C)", key: "avgTemp", width: 20 },
    { header: "Pico de Temp. (°C)", key: "maxTemp", width: 20 },
    { header: "Nível Água Mín. (%)", key: "minWater", width: 20 },
    { header: "Alertas Críticos", key: "alerts", width: 15 },
    { header: "Sensor Ok?", key: "sensorOk", width: 15 },
  ];

  const dailySummaries = groupReadingsByDay(readings);
  for (const day of dailySummaries) {
    const avgTemp =
      day.temperatures.length > 0
        ? day.temperatures.reduce((a, b) => a + b, 0) / day.temperatures.length
        : null;
    const maxTemp =
      day.temperatures.length > 0 ? Math.max(...day.temperatures) : null;
    const minWater =
      day.waterLevels.length > 0 ? Math.min(...day.waterLevels) : null;

    dailySheet.addRow({
      date: day.date,
      count: day.totalReadings,
      avgTemp: avgTemp !== null ? avgTemp.toFixed(1) : "-",
      maxTemp: maxTemp !== null ? maxTemp.toFixed(1) : "-",
      minWater: minWater !== null ? minWater.toFixed(1) : "-",
      alerts: day.criticalAlerts,
      sensorOk: day.hasNullReadings ? "Não (Falhas)" : "Sim",
    });
  }
  dailySheet.getRow(1).font = { bold: true };

  // Planilha 3: Dados Brutos
  const rawSheet = workbook.addWorksheet("Dados Brutos");
  rawSheet.columns = [
    { header: "Data/Hora", key: "timestamp", width: 25 },
    { header: "Temperatura (°C)", key: "temperatura", width: 20 },
    { header: "Nível de Água (%)", key: "nivel_agua", width: 20 },
  ];

  for (const r of readings) {
    rawSheet.addRow({
      timestamp: r.timestamp
        ? new Date(r.timestamp).toLocaleString("pt-BR")
        : "-",
      temperatura: r.temperatura !== null ? r.temperatura : "-",
      nivel_agua: r.nivel_agua !== null ? r.nivel_agua : "-",
    });
  }
  rawSheet.getRow(1).font = { bold: true };

  return await workbook.xlsx.writeBuffer();
}

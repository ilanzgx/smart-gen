import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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
 * Gera o relatório em PDF a partir dos dados do gerador e das leituras.
 * @param generator - Dados do gerador.
 * @param readings - Array de leituras.
 * @param period - Período de tempo opcional.
 * @returns Array de bytes do PDF gerado.
 */
export async function generateReportPdf(
  generator: ReportGenerator,
  readings: ReportReading[],
  period?: string,
): Promise<Uint8Array> {
  const document = await PDFDocument.create();

  // Fontes e Cores
  const fontRegular = await document.embedFont(StandardFonts.Helvetica);
  const fontBold = await document.embedFont(StandardFonts.HelveticaBold);
  const colorBlack = rgb(0, 0, 0);
  const colorGray = rgb(0.4, 0.4, 0.4);
  const colorDarkGray = rgb(0.25, 0.25, 0.25);
  const colorBlue = rgb(0.015, 0.392, 0.819);
  const colorRed = rgb(0.8, 0.15, 0.15);
  const colorGreen = rgb(0.1, 0.6, 0.2);

  let page = document.addPage();
  const { width, height } = page.getSize();
  const margin = 50;
  const bulletIndent = margin + 16;
  let cursorY = height - margin;

  // Função auxiliar para criar nova página se não couber
  const checkPageBreak = (requiredSpace: number) => {
    if (cursorY - requiredSpace < margin + 20) {
      page = document.addPage();
      cursorY = height - margin;
      return true;
    }
    return false;
  };

  // Desenha um bullet point com texto
  const drawBullet = (
    text: string,
    options?: { color?: ReturnType<typeof rgb>; bold?: boolean },
  ) => {
    const font = options?.bold ? fontBold : fontRegular;
    const color = options?.color ?? colorDarkGray;

    page.drawText("•", {
      font: fontRegular,
      size: 10,
      color,
      x: margin + 4,
      y: cursorY,
    });
    page.drawText(text, { font, size: 10, color, x: bulletIndent, y: cursorY });
    cursorY -= 18;
  };

  // Cabecalho
  const hasCriticalAlerts = readings.some(
    (r) =>
      (r.temperatura !== null && r.temperatura >= TEMP_CRITICA) ||
      (r.nivel_agua !== null && r.nivel_agua <= NIVEL_AGUA_CRITICO),
  );

  const statusLabel = "STATUS GERAL: ";
  const statusValue = hasCriticalAlerts ? "Atenção" : "Normal";
  const statusColor = hasCriticalAlerts ? colorRed : colorGreen;
  const periodText = period ? `Período: ${period}` : "";

  page.drawText("Relatório de Desempenho", {
    font: fontBold,
    size: 20,
    color: colorBlue,
    x: margin,
    y: cursorY,
  });

  const periodWidth = fontRegular.widthOfTextAtSize(periodText, 10);
  page.drawText(periodText, {
    font: fontRegular,
    size: 10,
    color: colorGray,
    x: width - margin - periodWidth,
    y: cursorY + 5,
  });

  cursorY -= 30;

  page.drawText(`Nome do Gerador: ${generator.name ?? "Não Nomeado"}`, {
    font: fontBold,
    size: 14,
    color: colorBlack,
    x: margin,
    y: cursorY,
  });

  const statusLabelWidth = fontBold.widthOfTextAtSize(statusLabel, 12);
  const statusValueWidth = fontBold.widthOfTextAtSize(statusValue, 12);

  page.drawText(statusLabel, {
    font: fontBold,
    size: 12,
    color: colorBlack,
    x: width - margin - statusLabelWidth - statusValueWidth,
    y: cursorY,
  });
  page.drawText(statusValue, {
    font: fontBold,
    size: 12,
    color: statusColor,
    x: width - margin - statusValueWidth,
    y: cursorY,
  });

  cursorY -= 20;

  page.drawText(`ID Interno: ${generator.id}`, {
    font: fontRegular,
    size: 10,
    color: colorGray,
    x: margin,
    y: cursorY,
  });
  cursorY -= 15;

  page.drawText(`Endereço MAC (ESP32): ${generator.esp32_id ?? "N/A"}`, {
    font: fontRegular,
    size: 10,
    color: colorGray,
    x: margin,
    y: cursorY,
  });
  cursorY -= 15;

  // Cálculo do nível de água mais recente
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

  page.drawText(
    `Capacidade do Reservatório: ${RESERVATORIO_CAPACIDADE_MAXIMA} mL`,
    {
      font: fontRegular,
      size: 10,
      color: colorGray,
      x: margin,
      y: cursorY,
    },
  );
  cursorY -= 15;

  const volumeText =
    currentVolume !== null
      ? `${currentVolume.toFixed(0)} mL (${currentWaterLevelPercent?.toFixed(1)}%)`
      : "Desconhecido";

  page.drawText(`Volume Atual (Última Leitura): ${volumeText}`, {
    font: fontRegular,
    size: 10,
    color:
      currentWaterLevelPercent !== null &&
      currentWaterLevelPercent <= NIVEL_AGUA_CRITICO
        ? colorRed
        : colorGray,
    x: margin,
    y: cursorY,
  });
  cursorY -= 15;

  page.drawText(`Total de leituras no período: ${readings.length}`, {
    font: fontRegular,
    size: 10,
    color: colorGray,
    x: margin,
    y: cursorY,
  });
  cursorY -= 20;

  page.drawLine({
    start: { x: margin, y: cursorY },
    end: { x: width - margin, y: cursorY },
    thickness: 1,
    color: colorGray,
  });
  cursorY -= 30;

  // Resumo por dia
  if (readings.length === 0) {
    page.drawText("Nenhuma leitura registrada para este período.", {
      font: fontRegular,
      size: 11,
      color: colorGray,
      x: margin,
      y: cursorY,
    });
  } else {
    const dailySummaries = groupReadingsByDay(readings);

    for (const day of dailySummaries) {
      const blockHeight = 140;
      checkPageBreak(blockHeight);

      // Título do dia
      page.drawText(`${day.date}`, {
        font: fontBold,
        size: 13,
        color: colorBlue,
        x: margin,
        y: cursorY,
      });
      cursorY -= 8;

      // Linha fina abaixo do título
      page.drawLine({
        start: { x: margin, y: cursorY },
        end: { x: width - margin, y: cursorY },
        thickness: 0.3,
        color: colorGray,
      });
      cursorY -= 18;

      // Temperatura média
      if (day.temperatures.length > 0) {
        const avgTemp =
          day.temperatures.reduce((a, b) => a + b, 0) / day.temperatures.length;
        drawBullet(`Temperatura média: ${avgTemp.toFixed(1)}°C`);
      } else {
        drawBullet("Temperatura média: sem dados");
      }

      // Pico máximo de temperatura
      if (day.temperatures.length > 0) {
        const maxTemp = Math.max(...day.temperatures);
        const isCritical = maxTemp >= TEMP_CRITICA;
        drawBullet(
          `Pico máximo: ${maxTemp.toFixed(1)}°C`,
          isCritical ? { color: colorRed, bold: true } : undefined,
        );
      } else {
        drawBullet("Pico máximo: sem dados");
      }

      // Nível mínimo de água
      if (day.waterLevels.length > 0) {
        const minWater = Math.min(...day.waterLevels);
        const minWaterVolume =
          (minWater / 100) * RESERVATORIO_CAPACIDADE_MAXIMA;
        const isCritical = minWater <= NIVEL_AGUA_CRITICO;
        drawBullet(
          `Nível mínimo de água: ${minWater.toFixed(1)}% (${minWaterVolume.toFixed(0)}mL)`,
          isCritical ? { color: colorRed, bold: true } : undefined,
        );
      } else {
        drawBullet("Nível mínimo de água: sem dados");
      }

      // Alertas críticos
      if (day.criticalAlerts > 0) {
        drawBullet(
          `${day.criticalAlerts} alerta${day.criticalAlerts > 1 ? "s" : ""} crítico${day.criticalAlerts > 1 ? "s" : ""} detectado${day.criticalAlerts > 1 ? "s" : ""}`,
          { color: colorRed, bold: true },
        );
      } else {
        drawBullet("Nenhum alerta crítico detectado", { color: colorGreen });
      }

      // Status do sensor
      if (day.hasNullReadings) {
        drawBullet("Sensor com falhas de leitura no período", {
          color: colorRed,
        });
      } else {
        drawBullet("Sensor operando normalmente", { color: colorGreen });
      }

      // Espaçamento entre dias
      cursorY -= 12;
    }
  }

  // Rodapé (em todas as páginas)
  const totalPages = document.getPageCount();
  const pages = document.getPages();
  const dataGeracao = new Date().toLocaleString("pt-BR");

  for (let i = 0; i < totalPages; i++) {
    const p = pages[i]!;
    p.drawText(
      `Smart-Gen | Página ${i + 1} de ${totalPages} | Gerado em: ${dataGeracao}`,
      {
        font: fontRegular,
        size: 8,
        color: colorGray,
        x: margin,
        y: 20,
      },
    );
  }

  return await document.save();
}

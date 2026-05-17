import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
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
 * Quebra um texto em linhas respeitando a largura máxima disponível.
 * @param text - Texto a ser quebrado.
 * @param font - Fonte a ser usada.
 * @param fontSize - Tamanho da fonte.
 * @param maxWidth - Largura máxima disponível.
 * @returns Array de linhas.
 */
function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Renderiza a seção de diagnóstico gerado por IA no PDF.
 * Trata markdown bold (**texto**), quebra de parágrafos e word-wrap.
 * @param resume - Resumo do diagnóstico.
 * @param provider - Provedor do diagnóstico.
 * @param page - Página do PDF.
 * @param document - Documento PDF.
 * @param fontBold - Fonte bold.
 * @param fontRegular - Fonte regular.
 * @param colorBlue - Cor azul.
 * @param colorDarkGray - Cor cinza escuro.
 * @param colorGray - Cor cinza.
 * @param margin - Margem.
 * @param pageWidth - Largura da página.
 * @param pageHeight - Altura da página.
 * @param getCursorY - Função para obter a posição Y do cursor.
 * @param setCursorY - Função para definir a posição Y do cursor.
 * @param checkPageBreak - Função para verificar a quebra de página.
 * @param setPage - Função para definir a página.
 * @returns Void.
 */
function drawDiagnosticSection(
  resume: string,
  provider: string | undefined,
  page: ReturnType<PDFDocument["addPage"]>,
  document: PDFDocument,
  fontBold: PDFFont,
  fontRegular: PDFFont,
  colorAccent: ReturnType<typeof rgb>,
  colorBody: ReturnType<typeof rgb>,
  colorMuted: ReturnType<typeof rgb>,
  margin: number,
  pageWidth: number,
  pageHeight: number,
  getCursorY: () => number,
  setCursorY: (v: number) => void,
  checkPageBreak: (space: number) => boolean,
  setPage: (p: ReturnType<PDFDocument["addPage"]>) => void,
): void {
  let currentPage = page;
  const maxTextWidth = pageWidth - margin * 2;
  const fontSize = 9;
  const lineHeight = 14;
  const paragraphSpacing = 10;

  const ensureSpace = (needed: number) => {
    if (getCursorY() - needed < margin + 20) {
      currentPage = document.addPage();
      setPage(currentPage);
      setCursorY(pageHeight - margin);
    }
  };

  // Título da seção
  ensureSpace(30);
  currentPage.drawText("Diagnóstico Inteligente (IA)", {
    font: fontBold,
    size: 13,
    color: colorAccent,
    x: margin,
    y: getCursorY(),
  });

  if (provider) {
    const titleWidth = fontBold.widthOfTextAtSize(
      "Diagnóstico Inteligente (IA)",
      13,
    );
    currentPage.drawText(`  via ${provider}`, {
      font: fontRegular,
      size: 9,
      color: colorMuted,
      x: margin + titleWidth + 4,
      y: getCursorY() + 2,
    });
  }

  setCursorY(getCursorY() - 8);

  currentPage.drawLine({
    start: { x: margin, y: getCursorY() },
    end: { x: pageWidth - margin, y: getCursorY() },
    thickness: 0.3,
    color: colorMuted,
  });
  setCursorY(getCursorY() - 16);

  // Divide por parágrafos (\n\n ou \n)
  const paragraphs = resume.split(/\n{2,}|\n/).filter((p) => p.trim());

  for (const paragraph of paragraphs) {
    // Remove markdown bold markers
    const cleanText = paragraph.replace(/\*\*/g, "").trim();
    if (!cleanText) continue;

    // Detecta se é um titulo (era bold no markdown inteiro)
    const isBoldParagraph =
      paragraph.trim().startsWith("**") && paragraph.trim().endsWith("**");

    const font = isBoldParagraph ? fontBold : fontRegular;
    const size = isBoldParagraph ? 10 : fontSize;
    const color = isBoldParagraph ? colorBody : colorBody;

    const lines = wrapText(cleanText, font, size, maxTextWidth);

    for (const line of lines) {
      ensureSpace(lineHeight);
      currentPage.drawText(line, {
        font,
        size,
        color,
        x: margin,
        y: getCursorY(),
      });
      setCursorY(getCursorY() - lineHeight);
    }

    setCursorY(getCursorY() - paragraphSpacing);
  }

  // Separador final antes da seção de resumos diários
  ensureSpace(20);
  currentPage.drawLine({
    start: { x: margin, y: getCursorY() },
    end: { x: pageWidth - margin, y: getCursorY() },
    thickness: 0.5,
    color: colorMuted,
  });
  setCursorY(getCursorY() - 30);
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
  resume?: string,
  provider?: string,
): Promise<Uint8Array> {
  const document = await PDFDocument.create();

  // Fontes e Cores
  const fontRegular = await document.embedFont(StandardFonts.Helvetica);
  const fontBold = await document.embedFont(StandardFonts.HelveticaBold);
  const colorHeading = rgb(0.1, 0.1, 0.12); // Slate-900 — títulos
  const colorBody = rgb(0.22, 0.23, 0.26); // Slate-700 — texto corpo
  const colorMeta = rgb(0.45, 0.47, 0.5); // Slate-500 — metadados
  const colorMuted = rgb(0.62, 0.64, 0.67); // Slate-400 — labels secundários
  const colorDivider = rgb(0.85, 0.86, 0.88); // Slate-200 — linhas divisórias
  const colorAccent = rgb(0.24, 0.31, 0.71); // Indigo-700 — títulos de seção
  const colorWarning = rgb(0.72, 0.33, 0.08); // Amber-700 — alertas
  const colorSuccess = rgb(0.09, 0.49, 0.42); // Teal-700 — status OK

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
    const color = options?.color ?? colorBody;

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
  const statusColor = hasCriticalAlerts ? colorWarning : colorSuccess;
  const periodText = period ? `Período: ${period}` : "";

  page.drawText("Relatório de Desempenho", {
    font: fontBold,
    size: 20,
    color: colorHeading,
    x: margin,
    y: cursorY,
  });

  const periodWidth = fontRegular.widthOfTextAtSize(periodText, 10);
  page.drawText(periodText, {
    font: fontRegular,
    size: 10,
    color: colorMuted,
    x: width - margin - periodWidth,
    y: cursorY + 5,
  });

  cursorY -= 30;

  page.drawText(`Nome do Gerador: ${generator.name ?? "Não Nomeado"}`, {
    font: fontBold,
    size: 14,
    color: colorHeading,
    x: margin,
    y: cursorY,
  });

  const statusLabelWidth = fontBold.widthOfTextAtSize(statusLabel, 12);
  const statusValueWidth = fontBold.widthOfTextAtSize(statusValue, 12);

  page.drawText(statusLabel, {
    font: fontBold,
    size: 12,
    color: colorBody,
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
    color: colorMeta,
    x: margin,
    y: cursorY,
  });
  cursorY -= 15;

  page.drawText(`Endereço MAC (ESP32): ${generator.esp32_id ?? "N/A"}`, {
    font: fontRegular,
    size: 10,
    color: colorMeta,
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
      color: colorMeta,
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
        ? colorWarning
        : colorMeta,
    x: margin,
    y: cursorY,
  });
  cursorY -= 15;

  page.drawText(`Total de leituras no período: ${readings.length}`, {
    font: fontRegular,
    size: 10,
    color: colorMeta,
    x: margin,
    y: cursorY,
  });
  cursorY -= 20;

  page.drawLine({
    start: { x: margin, y: cursorY },
    end: { x: width - margin, y: cursorY },
    thickness: 0.5,
    color: colorDivider,
  });
  cursorY -= 30;

  // Diagnóstico gerado por IA
  if (resume) {
    drawDiagnosticSection(
      resume,
      provider,
      page,
      document,
      fontBold,
      fontRegular,
      colorAccent,
      colorBody,
      colorMuted,
      margin,
      width,
      height,
      () => cursorY,
      (v: number) => {
        cursorY = v;
      },
      checkPageBreak,
      (newPage) => {
        page = newPage;
      },
    );
  }

  // Resumo por dia
  if (readings.length === 0) {
    page.drawText("Nenhuma leitura registrada para este período.", {
      font: fontRegular,
      size: 11,
      color: colorMuted,
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
        color: colorAccent,
        x: margin,
        y: cursorY,
      });
      cursorY -= 8;

      // Linha fina abaixo do título
      page.drawLine({
        start: { x: margin, y: cursorY },
        end: { x: width - margin, y: cursorY },
        thickness: 0.3,
        color: colorDivider,
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
          isCritical ? { color: colorWarning, bold: true } : undefined,
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
          isCritical ? { color: colorWarning, bold: true } : undefined,
        );
      } else {
        drawBullet("Nível mínimo de água: sem dados");
      }

      // Alertas críticos
      if (day.criticalAlerts > 0) {
        drawBullet(
          `${day.criticalAlerts} alerta${day.criticalAlerts > 1 ? "s" : ""} crítico${day.criticalAlerts > 1 ? "s" : ""} detectado${day.criticalAlerts > 1 ? "s" : ""}`,
          { color: colorWarning, bold: true },
        );
      } else {
        drawBullet("Nenhum alerta crítico detectado", { color: colorSuccess });
      }

      // Status do sensor
      if (day.hasNullReadings) {
        drawBullet("Sensor com falhas de leitura no período", {
          color: colorWarning,
        });
      } else {
        drawBullet("Sensor operando normalmente", { color: colorSuccess });
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
        color: colorMuted,
        x: margin,
        y: 20,
      },
    );
  }

  return await document.save();
}

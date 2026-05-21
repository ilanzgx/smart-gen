import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import { TEMP_CRITICA, NIVEL_AGUA_CRITICO } from "@smart-gen/shared";
import type { ReportGenerator, ReportReading } from "../../types";

const RESERVATORIO_CAPACIDADE_MAXIMA = 2000; // mL

interface DaySummary {
  date: string;
  totalReadings: number;
  temperatures: number[];
  waterLevels: number[];
  criticalAlerts: number;
  hasNullReadings: boolean;
  avgTemp: number | null;
  minWaterLevel: number | null;
}

/**
 * Agrupa as leituras por dia e calcula estatísticas resumidas.
 * @param readings - Array de leituras a serem agrupadas.
 * @returns Array de resumos por dia.
 */
function groupReadingsByDay(readings: ReportReading[]): DaySummary[] {
  const dayMap = new Map<string, DaySummary>();
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  for (const reading of readings) {
    if (!reading.timestamp) continue;

    const dateKey = formatter.format(new Date(reading.timestamp));

    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, {
        date: dateKey,
        totalReadings: 0,
        temperatures: [],
        waterLevels: [],
        criticalAlerts: 0,
        hasNullReadings: false,
        avgTemp: null,
        minWaterLevel: null,
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

  // Pré-calcula estatísticas por dia
  for (const summary of dayMap.values()) {
    if (summary.temperatures.length > 0) {
      summary.avgTemp = summary.temperatures.reduce((a, b) => a + b, 0) / summary.temperatures.length;
    }
    if (summary.waterLevels.length > 0) {
      summary.minWaterLevel = summary.waterLevels.reduce((a, b) => Math.min(a, b), Infinity);
    }
  }

  // Ordena do dia mais antigo para o mais recente (por data parseada)
  return Array.from(dayMap.values()).sort((a, b) => {
    const [da, ma, ya] = a.date.split("/").map(Number);
    const [db, mb, yb] = b.date.split("/").map(Number);
    return ya! - yb! || ma! - mb! || da! - db!;
  });
}

/**
 * Quebra um texto em linhas respeitando a largura máxima disponível.
 * @param text - Texto a ser quebrado.
 * @param font - Fonte a ser usada.
 * @param fontSize - Tamanho da fonte.
 * @param maxWidth - Largura máxima disponível.
 * @returns Array de linhas.
 */
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
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
function drawDiagnosticSection(resume: string, provider: string | undefined, page: ReturnType<PDFDocument["addPage"]>, document: PDFDocument, fontBold: PDFFont, fontRegular: PDFFont, colorAccent: ReturnType<typeof rgb>, colorBody: ReturnType<typeof rgb>, colorMuted: ReturnType<typeof rgb>, margin: number, pageWidth: number, pageHeight: number, getCursorY: () => number, setCursorY: (v: number) => void, checkPageBreak: (space: number) => boolean, setPage: (p: ReturnType<PDFDocument["addPage"]>) => void): void {
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
    const titleWidth = fontBold.widthOfTextAtSize("Diagnóstico Inteligente (IA)", 13);
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
    const isBoldParagraph = paragraph.trim().startsWith("**") && paragraph.trim().endsWith("**");

    const font = isBoldParagraph ? fontBold : fontRegular;
    const size = isBoldParagraph ? 10 : fontSize;
    const color = isBoldParagraph ? colorAccent : colorBody;

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
 * Desenha legenda do gráfico.
 * @param items - Array de itens da legenda com label e cor.
 * @param page - Página do PDF.
 * @param font - Fonte para os labels.
 * @param x - Posição X inicial.
 * @param y - Posição Y.
 */
function drawChartLegend(items: { label: string; color: ReturnType<typeof rgb> }[], page: ReturnType<PDFDocument["addPage"]>, font: PDFFont, x: number, y: number): void {
  let offsetX = x;
  const boxSize = 8;
  const fontSize = 7.5;
  const spacing = 16;

  for (const item of items) {
    page.drawRectangle({
      x: offsetX,
      y: y - 1,
      width: boxSize,
      height: boxSize,
      color: item.color,
    });
    offsetX += boxSize + 4;
    page.drawText(item.label, {
      font,
      size: fontSize,
      color: rgb(0.35, 0.37, 0.4),
      x: offsetX,
      y,
    });
    offsetX += font.widthOfTextAtSize(item.label, fontSize) + spacing;
  }
}

/**
 * Desenha um gráfico de barras duplas (temperatura média + nível mínimo de água) por dia.
 * @param dailySummaries - Resumos agrupados por dia.
 * @param page - Página atual do PDF.
 * @param document - Documento PDF.
 * @param fonts - Fontes regular e bold.
 * @param colors - Cores do tema.
 * @param layout - Dimensões e margens da página.
 * @param getCursorY - Getter da posição Y atual.
 * @param setCursorY - Setter da posição Y atual.
 * @param setPage - Setter da página atual.
 * @returns Página atual após renderização.
 */
function drawBarChart(
  dailySummaries: DaySummary[],
  page: ReturnType<PDFDocument["addPage"]>,
  document: PDFDocument,
  fonts: { regular: PDFFont; bold: PDFFont },
  colors: {
    accent: ReturnType<typeof rgb>;
    success: ReturnType<typeof rgb>;
    warning: ReturnType<typeof rgb>;
    muted: ReturnType<typeof rgb>;
    divider: ReturnType<typeof rgb>;
  },
  layout: { margin: number; pageWidth: number; pageHeight: number },
  getCursorY: () => number,
  setCursorY: (v: number) => void,
  setPage: (p: ReturnType<PDFDocument["addPage"]>) => void,
): ReturnType<PDFDocument["addPage"]> {
  let currentPage = page;
  const { margin, pageWidth, pageHeight } = layout;
  const chartHeight = 180;
  const chartWidth = pageWidth - margin * 2 - 50; // espaço para labels eixo Y
  const chartLeft = margin + 40;
  const totalNeeded = chartHeight + 60; // título + legenda + margem

  // Page break se necessário
  if (getCursorY() - totalNeeded < margin + 20) {
    currentPage = document.addPage();
    setPage(currentPage);
    setCursorY(pageHeight - margin);
  }

  // Título
  currentPage.drawText("Temperatura Média e Nível Mínimo de Água por Dia", {
    font: fonts.bold,
    size: 11,
    color: colors.accent,
    x: margin,
    y: getCursorY(),
  });
  setCursorY(getCursorY() - 16);

  // Legenda
  drawChartLegend(
    [
      { label: "Temp. Média (°C)", color: colors.accent },
      { label: "Nível Mín. Água (%)", color: colors.success },
      { label: "Valor Crítico", color: colors.warning },
    ],
    currentPage,
    fonts.regular,
    margin,
    getCursorY(),
  );
  setCursorY(getCursorY() - 20);

  const chartBottom = getCursorY() - chartHeight;
  const chartTop = getCursorY();

  // Fundo do gráfico
  currentPage.drawRectangle({
    x: chartLeft,
    y: chartBottom,
    width: chartWidth,
    height: chartHeight,
    color: rgb(0.97, 0.97, 0.98),
  });

  // Calcular escalas (usa reduce para evitar stack overflow com arrays grandes)
  const maxTemp = dailySummaries.reduce((max, d) => d.temperatures.reduce((m, t) => Math.max(m, t), max), TEMP_CRITICA + 10);
  const maxScale = Math.ceil(maxTemp / 10) * 10;
  const numDays = dailySummaries.length;
  const groupWidth = chartWidth / Math.max(numDays, 1);
  const barWidth = Math.min(groupWidth * 0.3, 25);

  // Linhas horizontais de grade + labels eixo Y
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const yPos = chartBottom + (chartHeight * i) / gridLines;
    const tempValue = (maxScale * i) / gridLines;
    const waterValue = (100 * i) / gridLines;

    // Linha de grade
    currentPage.drawLine({
      start: { x: chartLeft, y: yPos },
      end: { x: chartLeft + chartWidth, y: yPos },
      thickness: 0.2,
      color: colors.divider,
    });

    // Label esquerdo (temperatura)
    currentPage.drawText(`${tempValue.toFixed(0)}°`, {
      font: fonts.regular,
      size: 7,
      color: colors.accent,
      x: chartLeft - 22,
      y: yPos - 3,
    });

    // Label direito (nível água)
    currentPage.drawText(`${waterValue.toFixed(0)}%`, {
      font: fonts.regular,
      size: 7,
      color: colors.success,
      x: chartLeft + chartWidth + 4,
      y: yPos - 3,
    });
  }

  // Linha de limiar crítico temperatura (40°C)
  const critTempY = chartBottom + (TEMP_CRITICA / maxScale) * chartHeight;
  for (let dx = chartLeft; dx < chartLeft + chartWidth; dx += 6) {
    currentPage.drawLine({
      start: { x: dx, y: critTempY },
      end: { x: Math.min(dx + 3, chartLeft + chartWidth), y: critTempY },
      thickness: 0.6,
      color: colors.warning,
    });
  }

  // Linha de limiar crítico água (5%)
  const critWaterY = chartBottom + (NIVEL_AGUA_CRITICO / 100) * chartHeight;
  for (let dx = chartLeft; dx < chartLeft + chartWidth; dx += 6) {
    currentPage.drawLine({
      start: { x: dx, y: critWaterY },
      end: { x: Math.min(dx + 3, chartLeft + chartWidth), y: critWaterY },
      thickness: 0.6,
      color: colors.warning,
    });
  }

  // Barras por dia
  for (let i = 0; i < numDays; i++) {
    const day = dailySummaries[i]!;
    const centerX = chartLeft + groupWidth * i + groupWidth / 2;

    // Barra temperatura média
    if (day.avgTemp !== null) {
      const barH = (day.avgTemp / maxScale) * chartHeight;
      const isCritical = day.avgTemp >= TEMP_CRITICA;
      currentPage.drawRectangle({
        x: centerX - barWidth - 1,
        y: chartBottom,
        width: barWidth,
        height: Math.max(barH, 1),
        color: isCritical ? colors.warning : colors.accent,
      });
    }

    // Barra nível mínimo de água
    if (day.minWaterLevel !== null) {
      const barH = (day.minWaterLevel / 100) * chartHeight;
      const isCritical = day.minWaterLevel <= NIVEL_AGUA_CRITICO;
      currentPage.drawRectangle({
        x: centerX + 1,
        y: chartBottom,
        width: barWidth,
        height: Math.max(barH, 1),
        color: isCritical ? colors.warning : colors.success,
      });
    }

    // Label do dia no eixo X (pula labels para evitar sobreposição)
    const labelStep = Math.ceil(numDays / 12);
    if (i % labelStep === 0) {
      const labelFontSize = numDays > 10 ? 5.5 : 7;
      const parts = day.date.split("/");
      const dayLabel = `${parts[0]}/${parts[1]}`;
      const labelWidth = fonts.regular.widthOfTextAtSize(dayLabel, labelFontSize);
      currentPage.drawText(dayLabel, {
        font: fonts.regular,
        size: labelFontSize,
        color: colors.muted,
        x: centerX - labelWidth / 2,
        y: chartBottom - 12,
      });
    }
  }

  // Eixos
  currentPage.drawLine({
    start: { x: chartLeft, y: chartBottom },
    end: { x: chartLeft, y: chartTop },
    thickness: 0.5,
    color: colors.muted,
  });
  currentPage.drawLine({
    start: { x: chartLeft, y: chartBottom },
    end: { x: chartLeft + chartWidth, y: chartBottom },
    thickness: 0.5,
    color: colors.muted,
  });

  setCursorY(chartBottom - 28);
  return currentPage;
}

/**
 * Desenha um gráfico de linhas (evolução temporal) com limiares críticos.
 * @param dailySummaries - Resumos agrupados por dia.
 * @param page - Página atual do PDF.
 * @param document - Documento PDF.
 * @param fonts - Fontes regular e bold.
 * @param colors - Cores do tema.
 * @param layout - Dimensões e margens da página.
 * @param getCursorY - Getter da posição Y atual.
 * @param setCursorY - Setter da posição Y atual.
 * @param setPage - Setter da página atual.
 * @returns Página atual após renderização.
 */
function drawLineChart(
  dailySummaries: DaySummary[],
  page: ReturnType<PDFDocument["addPage"]>,
  document: PDFDocument,
  fonts: { regular: PDFFont; bold: PDFFont },
  colors: {
    accent: ReturnType<typeof rgb>;
    success: ReturnType<typeof rgb>;
    warning: ReturnType<typeof rgb>;
    muted: ReturnType<typeof rgb>;
    divider: ReturnType<typeof rgb>;
  },
  layout: { margin: number; pageWidth: number; pageHeight: number },
  getCursorY: () => number,
  setCursorY: (v: number) => void,
  setPage: (p: ReturnType<PDFDocument["addPage"]>) => void,
): ReturnType<PDFDocument["addPage"]> {
  let currentPage = page;
  const { margin, pageWidth, pageHeight } = layout;
  const chartHeight = 180;
  const chartWidth = pageWidth - margin * 2 - 50;
  const chartLeft = margin + 40;
  const totalNeeded = chartHeight + 60;

  if (getCursorY() - totalNeeded < margin + 20) {
    currentPage = document.addPage();
    setPage(currentPage);
    setCursorY(pageHeight - margin);
  }

  // Título
  currentPage.drawText("Evolução Temporal — Temperatura e Nível de Água", {
    font: fonts.bold,
    size: 11,
    color: colors.accent,
    x: margin,
    y: getCursorY(),
  });
  setCursorY(getCursorY() - 16);

  // Legenda
  drawChartLegend(
    [
      { label: "Temp. Média (°C)", color: colors.accent },
      { label: "Nível Mín. Água (%)", color: colors.success },
      { label: "Limiar Crítico", color: colors.warning },
    ],
    currentPage,
    fonts.regular,
    margin,
    getCursorY(),
  );
  setCursorY(getCursorY() - 20);

  const chartBottom = getCursorY() - chartHeight;
  const chartTop = getCursorY();

  // Fundo
  currentPage.drawRectangle({
    x: chartLeft,
    y: chartBottom,
    width: chartWidth,
    height: chartHeight,
    color: rgb(0.97, 0.97, 0.98),
  });

  const maxTemp = dailySummaries.reduce((max, d) => d.temperatures.reduce((m, t) => Math.max(m, t), max), TEMP_CRITICA + 10);
  const maxScale = Math.ceil(maxTemp / 10) * 10;
  const numDays = dailySummaries.length;

  // Grade horizontal + labels
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const yPos = chartBottom + (chartHeight * i) / gridLines;
    const tempValue = (maxScale * i) / gridLines;
    const waterValue = (100 * i) / gridLines;

    currentPage.drawLine({
      start: { x: chartLeft, y: yPos },
      end: { x: chartLeft + chartWidth, y: yPos },
      thickness: 0.2,
      color: colors.divider,
    });

    currentPage.drawText(`${tempValue.toFixed(0)}°`, {
      font: fonts.regular,
      size: 7,
      color: colors.accent,
      x: chartLeft - 22,
      y: yPos - 3,
    });

    currentPage.drawText(`${waterValue.toFixed(0)}%`, {
      font: fonts.regular,
      size: 7,
      color: colors.success,
      x: chartLeft + chartWidth + 4,
      y: yPos - 3,
    });
  }

  // Linhas de limiar crítico (pontilhadas)
  const critTempY = chartBottom + (TEMP_CRITICA / maxScale) * chartHeight;
  const critWaterY = chartBottom + (NIVEL_AGUA_CRITICO / 100) * chartHeight;

  for (let dx = chartLeft; dx < chartLeft + chartWidth; dx += 6) {
    currentPage.drawLine({
      start: { x: dx, y: critTempY },
      end: { x: Math.min(dx + 3, chartLeft + chartWidth), y: critTempY },
      thickness: 0.6,
      color: colors.warning,
    });
    currentPage.drawLine({
      start: { x: dx, y: critWaterY },
      end: { x: Math.min(dx + 3, chartLeft + chartWidth), y: critWaterY },
      thickness: 0.6,
      color: colors.warning,
    });
  }

  // Label nos limiares
  currentPage.drawText(`${TEMP_CRITICA}°C`, {
    font: fonts.regular,
    size: 6,
    color: colors.warning,
    x: chartLeft + chartWidth + 4,
    y: critTempY - 2,
  });
  currentPage.drawText(`${NIVEL_AGUA_CRITICO}%`, {
    font: fonts.regular,
    size: 6,
    color: colors.warning,
    x: chartLeft - 22,
    y: critWaterY - 2,
  });

  // Preparar pontos para as linhas
  const tempPoints: { x: number; y: number }[] = [];
  const waterPoints: { x: number; y: number }[] = [];

  for (let i = 0; i < numDays; i++) {
    const day = dailySummaries[i]!;
    const xPos = numDays === 1 ? chartLeft + chartWidth / 2 : chartLeft + (chartWidth * i) / (numDays - 1);

    if (day.avgTemp !== null) {
      tempPoints.push({
        x: xPos,
        y: chartBottom + (day.avgTemp / maxScale) * chartHeight,
      });
    }

    if (day.minWaterLevel !== null) {
      waterPoints.push({
        x: xPos,
        y: chartBottom + (day.minWaterLevel / 100) * chartHeight,
      });
    }

    // Label eixo X (pula labels para evitar sobreposição)
    const labelStep = Math.ceil(numDays / 12);
    if (i % labelStep === 0) {
      const labelFontSize = numDays > 10 ? 5.5 : 7;
      const parts = day.date.split("/");
      const dayLabel = `${parts[0]}/${parts[1]}`;
      const labelWidth = fonts.regular.widthOfTextAtSize(dayLabel, labelFontSize);
      currentPage.drawText(dayLabel, {
        font: fonts.regular,
        size: labelFontSize,
        color: colors.muted,
        x: xPos - labelWidth / 2,
        y: chartBottom - 12,
      });
    }
  }

  // Desenhar linhas de temperatura
  for (let i = 1; i < tempPoints.length; i++) {
    currentPage.drawLine({
      start: tempPoints[i - 1]!,
      end: tempPoints[i]!,
      thickness: 1.5,
      color: colors.accent,
    });
  }

  // Pontos de temperatura
  for (const pt of tempPoints) {
    currentPage.drawCircle({
      x: pt.x,
      y: pt.y,
      size: 3,
      color: colors.accent,
    });
  }

  // Desenhar linhas de nível de água
  for (let i = 1; i < waterPoints.length; i++) {
    currentPage.drawLine({
      start: waterPoints[i - 1]!,
      end: waterPoints[i]!,
      thickness: 1.5,
      color: colors.success,
    });
  }

  // Pontos de nível de água
  for (const pt of waterPoints) {
    currentPage.drawCircle({
      x: pt.x,
      y: pt.y,
      size: 3,
      color: colors.success,
    });
  }

  // Eixos
  currentPage.drawLine({
    start: { x: chartLeft, y: chartBottom },
    end: { x: chartLeft, y: chartTop },
    thickness: 0.5,
    color: colors.muted,
  });
  currentPage.drawLine({
    start: { x: chartLeft, y: chartBottom },
    end: { x: chartLeft + chartWidth, y: chartBottom },
    thickness: 0.5,
    color: colors.muted,
  });

  setCursorY(chartBottom - 28);
  return currentPage;
}

/**
 * Gera o relatório em PDF a partir dos dados do gerador e das leituras.
 * @param generator - Dados do gerador.
 * @param readings - Array de leituras.
 * @param period - Período de tempo opcional.
 * @returns Array de bytes do PDF gerado.
 */
export async function generateReportPdf(generator: ReportGenerator, readings: ReportReading[], period?: string, resume?: string, provider?: string): Promise<Uint8Array> {
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

  // Cabecalho
  const hasCriticalAlerts = readings.some((r) => (r.temperatura !== null && r.temperatura >= TEMP_CRITICA) || (r.nivel_agua !== null && r.nivel_agua <= NIVEL_AGUA_CRITICO));

  const statusLabel = "STATUS GERAL: ";
  const statusValue = hasCriticalAlerts ? "Atenção" : "Normal";
  const statusColor = hasCriticalAlerts ? colorWarning : colorSuccess;
  const periodText = period ? `Período: ${period}` : "";

  page.drawText("Relatório de Desempenho", {
    font: fontBold,
    size: 20,
    color: colorAccent,
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
    color: colorAccent,
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

  const currentVolume = currentWaterLevelPercent !== null ? (currentWaterLevelPercent / 100) * RESERVATORIO_CAPACIDADE_MAXIMA : null;

  page.drawText(`Capacidade do Reservatório: ${RESERVATORIO_CAPACIDADE_MAXIMA} mL`, {
    font: fontRegular,
    size: 10,
    color: colorMeta,
    x: margin,
    y: cursorY,
  });
  cursorY -= 15;

  const volumeText = currentVolume !== null ? `${currentVolume.toFixed(0)} mL (${currentWaterLevelPercent?.toFixed(1)}%)` : "Desconhecido";

  page.drawText(`Volume Atual (Última Leitura): ${volumeText}`, {
    font: fontRegular,
    size: 10,
    color: currentWaterLevelPercent !== null && currentWaterLevelPercent <= NIVEL_AGUA_CRITICO ? colorWarning : colorMeta,
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

  // Gráficos por dia
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
    const chartColors = {
      accent: colorAccent,
      success: colorSuccess,
      warning: colorWarning,
      muted: colorMuted,
      divider: colorDivider,
    };
    const chartFonts = { regular: fontRegular, bold: fontBold };
    const chartLayout = { margin, pageWidth: width, pageHeight: height };

    // Gráfico de barras — temperatura média + nível mínimo por dia
    page = drawBarChart(
      dailySummaries,
      page,
      document,
      chartFonts,
      chartColors,
      chartLayout,
      () => cursorY,
      (v: number) => {
        cursorY = v;
      },
      (newPage) => {
        page = newPage;
      },
    );

    cursorY -= 10;

    // Gráfico de linhas — evolução temporal
    page = drawLineChart(
      dailySummaries,
      page,
      document,
      chartFonts,
      chartColors,
      chartLayout,
      () => cursorY,
      (v: number) => {
        cursorY = v;
      },
      (newPage) => {
        page = newPage;
      },
    );
  }

  // Rodapé (em todas as páginas)
  const totalPages = document.getPageCount();
  const pages = document.getPages();
  const dataGeracao = new Date().toLocaleString("pt-BR");

  for (let i = 0; i < totalPages; i++) {
    const p = pages[i]!;
    p.drawText(`Smart-Gen | Página ${i + 1} de ${totalPages} | Gerado em: ${dataGeracao}`, {
      font: fontRegular,
      size: 8,
      color: colorMuted,
      x: margin,
      y: 20,
    });
  }

  return await document.save();
}

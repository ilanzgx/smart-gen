import { describe, test, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { generateReportPdf } from "../generator-report";
import type { ReportGenerator, ReportReading } from "../../../types";

const mockGenerator: ReportGenerator = {
  id: "gen-123",
  name: "Gerador de Teste",
  esp32_id: "AA:BB:CC:DD:EE:FF",
};

describe("generateReportPdf", () => {
  test("deve gerar um relatório PDF vazio quando não houver leituras", async () => {
    // Arrange & Act
    const result = await generateReportPdf(mockGenerator, [], "Últimos 7 dias");

    // Assert
    expect(result).toBeInstanceOf(Uint8Array);

    const pdfDoc = await PDFDocument.load(result);
    expect(pdfDoc.getPageCount()).toBe(1); // Deve ter 1 página contendo a mensagem de vazio
  });

  test("deve gerar um relatório PDF com leituras e calcular volume/status", async () => {
    // Arrange
    const readings: ReportReading[] = [
      {
        timestamp: new Date().toISOString(),
        temperatura: 35.5,
        nivel_agua: 80,
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        temperatura: 36.2,
        nivel_agua: 75.5,
      },
    ];

    // Act
    const result = await generateReportPdf(mockGenerator, readings, "Últimas 24 horas");

    // Assert
    expect(result).toBeInstanceOf(Uint8Array);
    const pdfDoc = await PDFDocument.load(result);
    expect(pdfDoc.getPageCount()).toBe(1);
  });

  test("deve gerar um relatório mapeando alertas críticos e leituras nulas (falhas)", async () => {
    // Arrange
    const readings: ReportReading[] = [
      { timestamp: new Date().toISOString(), temperatura: 42, nivel_agua: 4 }, // Crítico em temperatura e água
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        temperatura: null,
        nivel_agua: null,
      }, // Sensor falhou
    ];

    // Act
    const result = await generateReportPdf(mockGenerator, readings);

    // Assert
    expect(result).toBeInstanceOf(Uint8Array);
    const pdfDoc = await PDFDocument.load(result);
    expect(pdfDoc.getPageCount()).toBe(1);
  });

  test("deve forçar a quebra de página se o conteúdo for muito extenso", async () => {
    // Arrange
    const readings: ReportReading[] = [];

    for (let i = 0; i < 15; i++) {
      const date = new Date(Date.now() - i * 86400000).toISOString();
      readings.push({
        timestamp: date,
        temperatura: 30,
        nivel_agua: 50,
      });
    }

    // Resume longo de diagnóstico IA para forçar overflow de página
    const longResume = Array(30).fill("O gerador apresentou comportamento estável durante o período analisado, sem variações significativas de temperatura ou nível de água.").join("\n\n");

    // Act
    const result = await generateReportPdf(mockGenerator, readings, "Últimos 15 dias", longResume, "Gemini");

    // Assert
    expect(result).toBeInstanceOf(Uint8Array);
    const pdfDoc = await PDFDocument.load(result);
    expect(pdfDoc.getPageCount()).toBeGreaterThan(1);
  });
});

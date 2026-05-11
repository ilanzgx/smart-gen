import { describe, test, expect } from "vitest";
import { generateReportXlsx } from "../generator-report";
import type { ReportGenerator, ReportReading } from "../../../types";

const mockGenerator: ReportGenerator = {
  id: "gen-123",
  name: "Gerador de Teste",
  esp32_id: "AA:BB:CC:DD:EE:FF",
};

describe("generateReportXlsx", () => {
  test("deve gerar um relatório XLSX vazio quando não houver leituras", async () => {
    const result = await generateReportXlsx(mockGenerator, [], "Últimos 7 dias");
    expect(result).toBeDefined();
    expect(result.byteLength).toBeGreaterThan(0);
  });

  test("deve gerar um relatório XLSX com leituras", async () => {
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

    const result = await generateReportXlsx(
      mockGenerator,
      readings,
      "Últimas 24 horas",
    );

    expect(result).toBeDefined();
    expect(result.byteLength).toBeGreaterThan(0);
  });
});

import { describe, test, expect } from "vitest";
// import { writeFileSync } from "node:fs";
import { generateReportPdf } from "../generator-report";

describe("generateReportPdf", () => {
  test("deve gerar um relatório PDF", async () => {
    const result = await generateReportPdf();
    // writeFileSync("./relatorio.pdf", result);
    expect(result).toBeInstanceOf(Uint8Array);
  });
});

import { PDFDocument, StandardFonts, rgb, type Color } from "pdf-lib";

export async function generateReportPdf(): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);

  const page = document.addPage();
  const { width, height } = page.getSize();
  const fontSize = 14;
  const fontColor = rgb(0, 0, 0) as Color;
  const lineHeight = fontSize * 1.2;

  page.drawText("Hello World!", {
    font,
    size: fontSize,
    color: fontColor,
    lineHeight,
    x: 0,
    y: height - fontSize,
  });

  const documentBytes = await document.save();

  return documentBytes;
}

export interface ReportGenerator {
  id: string;
  name: string | null;
  esp32_id: string | null;
}

export interface ReportReading {
  timestamp: string | null;
  temperatura: number | null;
  nivel_agua: number | null;
}

export interface ReportData {
  generator: ReportGenerator;
  readings: ReportReading[];
}

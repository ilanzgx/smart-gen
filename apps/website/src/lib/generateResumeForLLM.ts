import type { Leitura } from '@smart-gen/supabase'
import { TEMP_CRITICA } from '@smart-gen/shared'

export interface ResumeForLLM {
  period: string
  readingsTotal: number
  temperature: {
    average: number
    maxAbs: number
    minAbs: number
    alertsAboveLimit: number
    hottestDay: string
  }
  waterLevel: {
    average: number
    minAbs: number
    detectedFalls: number
  }
  trend: string
}

export function generateResumeForLLM(readings: Leitura[], period: string): ResumeForLLM | null {
  if (!readings || readings.length === 0) return null

  const validTemps = readings.filter((r) => r.temperatura !== null)
  const validWater = readings.filter((r) => r.nivel_agua !== null)

  if (validTemps.length === 0 || validWater.length === 0) return null

  const temps = validTemps.map((r) => r.temperatura as number)
  const waterLevels = validWater.map((r) => r.nivel_agua as number)

  // Temperatura
  const maxTemp = Math.max(...temps)
  const minTemp = Math.min(...temps)
  const averageTemp = temps.reduce((a, b) => a + b, 0) / temps.length

  // Nível de Água
  const minWater = Math.min(...waterLevels)
  const averageWaterLevel = waterLevels.reduce((a, b) => a + b, 0) / waterLevels.length

  // Dia mais quente
  const hottestReading = validTemps.find((r) => r.temperatura === maxTemp)
  const hottestDayDate = hottestReading?.created_at
    ? new Date(hottestReading.created_at).toLocaleDateString('pt-BR')
    : 'Desconhecido'

  // Detecção de quedas no nível de água
  let detectedFalls = 0
  for (let i = 1; i < validWater.length; i++) {
    const diff = (validWater[i - 1]?.nivel_agua as number) - (validWater[i]?.nivel_agua as number)
    if (diff > 10) {
      detectedFalls++
    }
  }

  const firstHalfAvg =
    temps.slice(0, Math.floor(temps.length / 2)).reduce((a, b) => a + b, 0) / (temps.length / 2)
  const secondHalfAvg =
    temps.slice(Math.floor(temps.length / 2)).reduce((a, b) => a + b, 0) / (temps.length / 2)

  let trend = 'Estável'
  if (secondHalfAvg > firstHalfAvg + 3) trend = 'Tendência de Aquecimento'
  if (secondHalfAvg < firstHalfAvg - 3) trend = 'Tendência de Resfriamento'

  return {
    period: period,
    readingsTotal: readings.length,
    temperature: {
      average: Number(averageTemp.toFixed(1)),
      maxAbs: maxTemp,
      minAbs: minTemp,
      alertsAboveLimit: temps.filter((t) => t >= TEMP_CRITICA).length,
      hottestDay: hottestDayDate,
    },
    waterLevel: {
      average: Number(averageWaterLevel.toFixed(1)),
      minAbs: minWater,
      detectedFalls: detectedFalls,
    },
    trend: trend,
  }
}

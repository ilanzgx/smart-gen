import { describe, test, expect, vi, beforeEach } from 'vitest'
import { aiService } from '../ai.service'
import { supabase } from '@/lib/supabase'
import type { ResumeForLLM } from '@/lib/generateResumeForLLM'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

describe('AiService testes unitários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('deve chamar a edge function e retornar os dados em caso de sucesso', async () => {
    // Arrange
    const mockData = { diagnostic: 'Tudo OK', provider: 'Groq' }

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: mockData,
      error: null,
    })

    const dummyReportData: ResumeForLLM = {
      period: '7d',
      readingsTotal: 100,
      temperature: {
        average: 35,
        maxAbs: 45,
        minAbs: 20,
        alertsAboveLimit: 0,
        hottestDay: '10/10/2026',
      },
      waterLevel: { average: 90, minAbs: 80, detectedFalls: 0 },
      trend: 'Estável',
    }

    // Act
    const result = await aiService.generateResume(dummyReportData)

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(1)
    expect(supabase.functions.invoke).toHaveBeenCalledWith('generate-diagnostic', {
      body: dummyReportData,
    })

    expect(result).toEqual(mockData)
  })

  test('deve lançar um erro quando a edge function retornar error', async () => {
    // Arrange
    const mockError = new Error('Service Unavailable')

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: mockError,
    })

    const dummyReportData: ResumeForLLM = {
      period: '7d',
      readingsTotal: 100,
      temperature: {
        average: 35,
        maxAbs: 45,
        minAbs: 20,
        alertsAboveLimit: 0,
        hottestDay: '10/10/2026',
      },
      waterLevel: { average: 90, minAbs: 80, detectedFalls: 0 },
      trend: 'Estável',
    }

    // Act
    await expect(aiService.generateResume(dummyReportData)).rejects.toThrow('Service Unavailable')

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(1)
    expect(supabase.functions.invoke).toHaveBeenCalledWith('generate-diagnostic', {
      body: dummyReportData,
    })
  })
})

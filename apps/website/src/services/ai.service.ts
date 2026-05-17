import { supabase } from '@/lib/supabase'
import type { ResumeForLLM } from '@/lib/generateResumeForLLM'

export interface GenerateResumeResponse {
  diagnostic: string
  provider: string
}

export class AiService {
  async generateResume(reportData: ResumeForLLM): Promise<GenerateResumeResponse> {
    const { data, error } = await supabase.functions.invoke('generate-diagnostic', {
      body: reportData as ResumeForLLM,
    })

    if (error) {
      throw error
    }

    return data
  }
}

export const aiService = new AiService()

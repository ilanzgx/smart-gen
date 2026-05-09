/**
 * Serviço de atualização OTA usando @capgo/capacitor-updater
 *
 * Usa modo manual (autoUpdate: false em capacitor.config.ts).
 * O fluxo:
 *   1. App inicia → notifyAppReady() diz ao plugin que o bundle carregou OK
 *   2. Busca nossa Edge Function para verificar se existe um novo bundle (via eTag)
 *   3. Se novo → faz download() do zip e notifica a store (usuário decide quando aplicar)
 *   4. Usuário clica em "Instalar" → set() para aplicar (app recarrega)
 *   5. Se igual → não faz nada
 */

import type { CapacitorUpdaterPlugin, BundleInfo } from '@capgo/capacitor-updater'

interface OtaVersionResponse {
  version: string
  bundleUrl: string
  checksum: string
}

type OtaUpdater = CapacitorUpdaterPlugin

const OTA_TAG = '[OTA]' as const
const OTA_ENDPOINT = '/functions/v1/ota-version' as const
const OTA_APPLIED_KEY = 'ota_applied_version' as const

/**
 * Verifica se o objeto é uma resposta de versão OTA
 *
 * @description Essa função verifica se o objeto é uma resposta de versão OTA retornando
 * true se for, false caso contrário.
 *
 * @param {unknown} data - Objeto a ser verificado.
 * @returns {boolean} - True se o objeto for uma resposta de versão OTA, false caso contrário.
 */
function isOtaVersionResponse(data: unknown): data is OtaVersionResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'version' in data &&
    'bundleUrl' in data &&
    typeof (data as OtaVersionResponse).version === 'string' &&
    typeof (data as OtaVersionResponse).bundleUrl === 'string'
  )
}

export class OtaUpdateService {
  private updater: OtaUpdater | null = null

  /**
   * @description Verifica se o app está rodando em ambiente nativo.
   * @returns {boolean} - True se o app estiver rodando em ambiente nativo, false caso contrário.
   */
  get isNative(): boolean {
    return this.updater !== null
  }

  /**
   * @description Inicializa o serviço de atualização OTA.
   * @returns {Promise<void>} - Void
   */
  async initialize(): Promise<void> {
    if (typeof window === 'undefined' || !('Capacitor' in window)) return

    try {
      const { CapacitorUpdater } = await import('@capgo/capacitor-updater')
      this.updater = CapacitorUpdater

      await this.updater.notifyAppReady()
      console.log(OTA_TAG, 'Plugin initialized, notifyAppReady sent')
    } catch (error) {
      this.updater = null
      console.warn(OTA_TAG, 'Not running on native, skipping:', error)
    }
  }

  /**
   * @description Verifica se há atualização disponível e faz download do bundle.
   * @returns {Promise<{ bundle: BundleInfo; version: string } | null>} - O bundle baixado e a versão, ou null se não houver atualização.
   */
  async checkForUpdate(): Promise<{ bundle: BundleInfo; version: string } | null> {
    if (!this.updater) return null

    try {
      const versionInfo = await this.fetchLatestVersion()
      if (!versionInfo) return null

      const current = await this.updater.current()
      let currentVersion = current?.bundle?.version ?? 'builtin'

      // Usa o GITHUB_SHA injetado no build (se existir)
      if (currentVersion === 'builtin' && import.meta.env.VITE_APP_VERSION) {
        currentVersion = import.meta.env.VITE_APP_VERSION
      }

      if (currentVersion === versionInfo.version) {
        console.log(OTA_TAG, `Already on latest: ${currentVersion}`)
        return null
      }

      // Pula se essa versão já foi aplicada via set() e aguarda reinício
      const appliedVersion = localStorage.getItem(OTA_APPLIED_KEY)
      if (appliedVersion === versionInfo.version) {
        console.log(OTA_TAG, `Version ${versionInfo.version} already applied, waiting restart`)
        return null
      }

      console.log(OTA_TAG, `Update available: ${versionInfo.version} (current: ${currentVersion})`)

      const bundle = await this.updater.download({
        url: versionInfo.bundleUrl,
        version: versionInfo.version,
      })

      console.log(OTA_TAG, `Downloaded bundle: ${bundle.version}`)

      return { bundle, version: versionInfo.version }
    } catch (error) {
      console.error(OTA_TAG, 'Update check failed:', error)
      return null
    }
  }

  /**
   * @description Aplica um bundle previamente baixado.
   * Após set(), tenta reload nativo. Se a execução continuar (modo manual),
   * marca a versão como aplicada no localStorage para evitar re-download.
   * O bundle será carregado no próximo reinício do app.
   *
   * @param {BundleInfo} bundle - O bundle a ser aplicado.
   * @returns {Promise<void>} - Void
   */
  async applyUpdate(bundle: BundleInfo): Promise<void> {
    if (!this.updater) return

    console.log(OTA_TAG, `Applying bundle: ${bundle.version}`)
    await this.updater.set(bundle)

    // set() deve ser terminal (destroi o contexto JS), mas no modo manual
    // ele pode apenas preparar o bundle para o próximo reinício.
    // Se a execução chegar aqui, tenta reload nativo.
    console.log(OTA_TAG, 'set() did not reload, trying plugin reload…')
    localStorage.setItem(OTA_APPLIED_KEY, bundle.version)

    try {
      await this.updater.reload()
    } catch {
      // reload() falhou — bundle será aplicado no próximo reinício do app.
      // NÃO usar window.location.reload() pois recarrega o bundle built-in,
      // causando um loop infinito de detecção de atualização.
      console.warn(OTA_TAG, 'Plugin reload failed. Update will apply on next app restart.')
    }
  }

  /**
   * @description Busca a versão mais recente do bundle.
   * @returns {Promise<OtaVersionResponse | null>} - A versão mais recente do bundle, ou null se não houver atualização.
   */
  private async fetchLatestVersion(): Promise<OtaVersionResponse | null> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn(OTA_TAG, 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
      return null
    }

    try {
      const response = await fetch(`${supabaseUrl}${OTA_ENDPOINT}`, {
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data: unknown = await response.json()

      if (!isOtaVersionResponse(data)) {
        console.warn(OTA_TAG, 'Invalid response shape:', data)
        return null
      }

      return data
    } catch (error) {
      console.error(OTA_TAG, 'Failed to fetch version:', error)
      return null
    }
  }
}

export const otaUpdateService = new OtaUpdateService()

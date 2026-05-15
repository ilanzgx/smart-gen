/**
 * Serviço de atualização OTA usando @capgo/capacitor-updater
 *
 * Usa modo manual (autoUpdate: false em capacitor.config.ts).
 * O fluxo:
 *   1. App inicia → notifyAppReady() confirma que o bundle carregou OK
 *   2. Busca nossa Edge Function para verificar se existe um novo bundle
 *   3. Se novo → download() do zip e notifica a store
 *   4. Usuário clica "Instalar" → set({ id }) + reload() aplica imediatamente
 */

import type { CapacitorUpdaterPlugin, BundleInfo } from '@capgo/capacitor-updater'
import { Capacitor } from '@capacitor/core'

interface OtaVersionResponse {
  version: string
  bundleUrl: string
  checksum: string
}

type OtaUpdater = CapacitorUpdaterPlugin

const OTA_TAG = '[OTA]' as const
const OTA_ENDPOINT = '/functions/v1/ota-version' as const

/**
 * Verifica se o objeto é uma resposta de versão OTA válida.
 *
 * @param {unknown} data - Objeto a ser verificado.
 * @returns {boolean} - True se for uma resposta válida.
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

  public isFirstInstall: boolean = false

  /**
   * @description Verifica se o app está rodando em ambiente nativo.
   * @returns {boolean} - True se estiver em ambiente nativo.
   */
  get isNative(): boolean {
    return this.updater !== null
  }

  /**
   * @description Inicializa o plugin OTA e notifica que o bundle atual está OK.
   */
  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return

    try {
      const { CapacitorUpdater } = await import('@capgo/capacitor-updater')
      this.updater = CapacitorUpdater

      const state = await this.updater.notifyAppReady()
      console.log(OTA_TAG, 'Plugin initialized, notifyAppReady sent', state)

      if (state?.bundle?.id === 'builtin') {
        this.isFirstInstall = true
        console.log(OTA_TAG, 'Marcado como primeira instalação (Built-in detectado).')
      }
    } catch (error) {
      this.updater = null
      console.warn(OTA_TAG, 'Not running on native, skipping:', error)
    }
  }

  /**
   * @description Verifica se há atualização disponível e faz download do bundle.
   * @returns O bundle baixado e a versão, ou null se não houver atualização.
   */
  async checkForUpdate(): Promise<{ bundle: BundleInfo; version: string } | null> {
    if (!this.updater) return null

    try {
      const versionInfo = await this.fetchLatestVersion()
      if (!versionInfo) return null

      const current = await this.updater.current()
      let currentVersion = current?.bundle?.version ?? 'builtin'

      if (this.isFirstInstall && import.meta.env.VITE_APP_VERSION) {
        currentVersion = import.meta.env.VITE_APP_VERSION
      }

      if (currentVersion === versionInfo.version) {
        console.log(OTA_TAG, `Already on latest: ${currentVersion}`)
        localStorage.removeItem('pending_ota_version')
        return null
      }

      const justAppliedVersion = localStorage.getItem('pending_ota_version')
      if (justAppliedVersion === versionInfo.version) {
        console.log(OTA_TAG, `Update applied but awaiting Cold Start: ${versionInfo.version}`)
        return null
      }

      console.log(OTA_TAG, `Update available: ${versionInfo.version} (current: ${currentVersion})`)

      const bundle = await this.updater.download({
        url: versionInfo.bundleUrl,
        version: versionInfo.version,
      })

      console.log(OTA_TAG, `Downloaded bundle: ${bundle.version}`)

      if (this.isFirstInstall) {
        console.log(OTA_TAG, 'First install detected. Preparing bundle for next boot silently.')
        await this.updater.set({ id: bundle.id })
        return null
      }

      return { bundle, version: versionInfo.version }
    } catch (error) {
      console.error(OTA_TAG, 'Update check failed:', error)
      return null
    }
  }

  /**
   * @description Aplica um bundle previamente baixado.
   * Usa set({ id }) para marcar o bundle como ativo e reload() para recarregar.
   *
   * @param {BundleInfo} bundle - O bundle a ser aplicado.
   */
  async applyUpdate(bundle: BundleInfo): Promise<void> {
    if (!this.updater) return

    console.log(OTA_TAG, `Applying bundle: ${bundle.version}`)

    localStorage.setItem('pending_ota_version', bundle.version)

    // set({ id }) marca o bundle como ativo — conforme API do Capgo
    await this.updater.set({ id: bundle.id })

    // reload() força o recarregamento imediato com o novo bundle
    await this.updater.reload()
  }

  /**
   * @description Busca a versão mais recente do bundle na Edge Function.
   * @returns A versão mais recente ou null se indisponível.
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

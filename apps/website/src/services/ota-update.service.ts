/**
 * OTA Update Service using @capgo/capacitor-updater
 *
 * Uses manual mode (autoUpdate: false in capacitor.config.ts).
 * The flow:
 *   1. App boots → notifyAppReady() tells the plugin the bundle loaded OK
 *   2. Fetch our Edge Function to check if a new bundle exists (via eTag)
 *   3. If new → download() the zip and notify the store (user decides when to apply)
 *   4. User clicks "Install" → set() to apply it (app reloads)
 *   5. If same → do nothing
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

  get isNative(): boolean {
    return this.updater !== null
  }

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
   * Verifica se há atualização disponível e faz download do bundle.
   * Retorna o bundle baixado e a versão, ou null se não houver atualização.
   */
  async checkForUpdate(): Promise<{ bundle: BundleInfo; version: string } | null> {
    if (!this.updater) return null

    try {
      const versionInfo = await this.fetchLatestVersion()
      if (!versionInfo) return null

      const current = await this.updater.current()
      const currentVersion = current?.bundle?.version ?? 'builtin'

      if (currentVersion === versionInfo.version) {
        console.log(OTA_TAG, `Already on latest: ${currentVersion}`)
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
   * Aplica um bundle previamente baixado.
   * Após a chamada, o app será recarregado automaticamente.
   */
  async applyUpdate(bundle: BundleInfo): Promise<void> {
    if (!this.updater) return

    console.log(OTA_TAG, `Applying bundle: ${bundle.version}`)
    await this.updater.set(bundle)
  }

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

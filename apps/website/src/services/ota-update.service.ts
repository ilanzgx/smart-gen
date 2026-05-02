/**
 * OTA Update Service using @capgo/capacitor-updater
 *
 * Uses manual mode (autoUpdate: false in capacitor.config.ts).
 * The flow:
 *   1. App boots → notifyAppReady() tells the plugin the bundle loaded OK
 *   2. Fetch our Edge Function to check if a new bundle exists (via eTag)
 *   3. If new → download() the zip, then set() to apply it (app reloads)
 *   4. If same → do nothing
 */

import type { CapacitorUpdaterPlugin } from '@capgo/capacitor-updater'

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
      console.warn(OTA_TAG, 'Not running on native, skipping:', error)
    }
  }

  async checkForUpdate(): Promise<void> {
    if (!this.updater) return

    try {
      const versionInfo = await this.fetchLatestVersion()
      if (!versionInfo) return

      const current = await this.updater.current()
      const currentVersion = current?.bundle?.version ?? 'builtin'

      if (currentVersion === versionInfo.version) {
        console.log(OTA_TAG, `Already on latest: ${currentVersion}`)
        return
      }

      console.log(OTA_TAG, `Update available: ${versionInfo.version} (current: ${currentVersion})`)

      const bundle = await this.updater.download({
        url: versionInfo.bundleUrl,
        version: versionInfo.version,
      })

      console.log(OTA_TAG, `Downloaded bundle: ${bundle.version}`)

      await this.updater.set(bundle)
      // App reloads here — code below won't execute
    } catch (error) {
      console.error(OTA_TAG, 'Update check failed:', error)
    }
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

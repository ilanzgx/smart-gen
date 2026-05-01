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

interface OtaVersionResponse {
  version: string
  bundleUrl: string
  checksum: string
}

export class OtaUpdateService {
  private updater: import('@capgo/capacitor-updater').CapacitorUpdaterPlugin | null = null
  private isNativePlatform = false

  /**
   * Dynamically import the plugin so it doesn't break web builds.
   */
  async initialize(): Promise<void> {
    if (typeof window === 'undefined' || !('Capacitor' in window)) return

    try {
      const { CapacitorUpdater } = await import('@capgo/capacitor-updater')
      this.updater = CapacitorUpdater
      this.isNativePlatform = true

      // CRITICAL: Tell the plugin the current bundle loaded successfully.
      // Without this, the plugin will roll back to the built-in version
      // after a timeout (default 10s).
      await this.updater.notifyAppReady()
      console.log('[OTA] Plugin initialized, notifyAppReady sent')
    } catch (error) {
      console.warn('[OTA] Not running on native, skipping:', error)
    }
  }

  isNative(): boolean {
    return this.isNativePlatform
  }

  async checkForUpdate(): Promise<void> {
    if (!this.isNative() || !this.updater) return

    try {
      const versionInfo = await this.fetchLatestVersion()
      if (!versionInfo) {
        console.log('[OTA] No version info from server')
        return
      }

      // Check current bundle
      const current = await this.updater.current()
      const currentVersion = current?.bundle?.version

      if (currentVersion === versionInfo.version) {
        console.log(`[OTA] Already on latest: ${currentVersion}`)
        return
      }

      console.log(
        `[OTA] Update available: ${versionInfo.version} (current: ${currentVersion || 'builtin'})`,
      )

      // Download the zip — the plugin handles extraction natively
      const bundle = await this.updater.download({
        url: versionInfo.bundleUrl,
        version: versionInfo.version,
      })

      console.log(`[OTA] Downloaded bundle: ${bundle.version}`)

      // Apply the bundle — this reloads the app automatically
      await this.updater.set(bundle)
      // Code after this line won't execute because the app reloads
    } catch (error) {
      console.error('[OTA] Update check failed:', error)
    }
  }

  private async fetchLatestVersion(): Promise<OtaVersionResponse | null> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const response = await fetch(`${supabaseUrl}/functions/v1/ota-version`, {
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[OTA] Failed to fetch version:', error)
      return null
    }
  }
}

export const otaUpdateService = new OtaUpdateService()

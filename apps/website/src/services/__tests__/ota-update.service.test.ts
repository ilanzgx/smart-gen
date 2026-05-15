import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Capacitor } from '@capacitor/core'
import { OtaUpdateService } from '../ota-update.service'

const mockNotifyAppReady = vi.fn().mockResolvedValue({ bundle: { version: '1.0' } })
const mockCurrent = vi.fn()
const mockDownload = vi.fn()
const mockSet = vi.fn()
const mockReload = vi.fn()

vi.mock('@capgo/capacitor-updater', () => ({
  CapacitorUpdater: {
    notifyAppReady: (...args: unknown[]) => mockNotifyAppReady(...args),
    current: (...args: unknown[]) => mockCurrent(...args),
    download: (...args: unknown[]) => mockDownload(...args),
    set: (...args: unknown[]) => mockSet(...args),
    reload: (...args: unknown[]) => mockReload(...args),
  },
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn().mockReturnValue(true),
  },
}))

const mockFetch = vi.fn()

function createServiceWithCapacitor(): OtaUpdateService {
  vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
  return new OtaUpdateService()
}

function cleanupCapacitor(): void {
  // no-op
}

function setEnvVars(url = 'https://test.supabase.co', key = 'test-anon-key'): void {
  import.meta.env.VITE_SUPABASE_URL = url
  import.meta.env.VITE_SUPABASE_ANON_KEY = key
}

function clearEnvVars(): void {
  delete import.meta.env.VITE_SUPABASE_URL
  delete import.meta.env.VITE_SUPABASE_ANON_KEY
}

function mockFetchResponse(body: unknown, ok = true, status = 200): void {
  mockFetch.mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve(body),
  })
}

describe('OtaUpdateService testes unitários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.fetch = mockFetch
    localStorage.clear()
    setEnvVars()
  })

  afterEach(() => {
    cleanupCapacitor()
    clearEnvVars()
  })

  // ─── isNative ───────────────────────────────────────────────────────────────

  describe('isNative (getter)', () => {
    it('deve retornar false antes de inicializar', () => {
      // Arrange
      const service = new OtaUpdateService()

      // Act
      const result = service.isNative

      // Assert
      expect(result).toBe(false)
    })

    it('deve retornar true após inicialização com Capacitor', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()

      // Act
      const result = service.isNative

      // Assert
      expect(result).toBe(true)
    })
  })

  // ─── initialize ─────────────────────────────────────────────────────────────

  describe('initialize', () => {
    it('deve pular inicialização quando não for plataforma nativa', async () => {
      // Arrange
      vi.mocked(Capacitor.isNativePlatform).mockReturnValueOnce(false)
      const service = new OtaUpdateService()

      // Act
      await service.initialize()

      // Assert
      expect(service.isNative).toBe(false)
      expect(service.isFirstInstall).toBe(false)
      expect(mockNotifyAppReady).not.toHaveBeenCalled()
    })

    it('deve importar o plugin e chamar notifyAppReady quando Capacitor está presente', async () => {
      // Arrange
      const service = createServiceWithCapacitor()

      // Act
      await service.initialize()

      // Assert
      expect(service.isNative).toBe(true)
      expect(mockNotifyAppReady).toHaveBeenCalledOnce()
    })

    it('deve marcar isFirstInstall = true quando notifyAppReady retorna bundle builtin', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      mockNotifyAppReady.mockResolvedValueOnce({ bundle: { id: 'builtin', version: 'builtin' } })
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Act
      await service.initialize()

      // Assert
      expect(service.isFirstInstall).toBe(true)
      expect(logSpy).toHaveBeenCalledWith(
        '[OTA]',
        'Marcado como primeira instalação (Built-in detectado).',
      )
      logSpy.mockRestore()
    })

    it('deve manter isFirstInstall = false quando notifyAppReady retorna bundle OTA', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      mockNotifyAppReady.mockResolvedValueOnce({ bundle: { id: 'abc-123', version: 'v2.0' } })
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Act
      await service.initialize()

      // Assert
      expect(service.isFirstInstall).toBe(false)
      logSpy.mockRestore()
    })

    it('deve logar warning e resetar updater se notifyAppReady falhar', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      mockNotifyAppReady.mockRejectedValueOnce(new Error('Plugin not available'))
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Act
      await service.initialize()

      // Assert
      expect(service.isNative).toBe(false)
      expect(service.isFirstInstall).toBe(false)
      expect(warnSpy).toHaveBeenCalledWith(
        '[OTA]',
        'Not running on native, skipping:',
        expect.any(Error),
      )
      warnSpy.mockRestore()
    })
  })

  // ─── checkForUpdate ─────────────────────────────────────────────────────────

  describe('checkForUpdate', () => {
    it('deve retornar null se o updater não foi inicializado', async () => {
      // Arrange
      const service = new OtaUpdateService()

      // Act
      const result = await service.checkForUpdate()

      // Assert
      expect(result).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('deve retornar null se fetchLatestVersion retornar null', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()
      mockFetchResponse({ error: 'not found' }, false, 404)

      // Act
      const result = await service.checkForUpdate()

      // Assert
      expect(result).toBeNull()
      expect(mockCurrent).not.toHaveBeenCalled()
      expect(mockDownload).not.toHaveBeenCalled()
    })

    // ── versão já é a mais recente ──

    it('deve retornar null e limpar pending_ota_version se já estiver na versão mais recente', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()
      localStorage.setItem('pending_ota_version', 'abc123')
      mockFetchResponse({
        version: 'abc123',
        bundleUrl: 'https://cdn/latest.zip',
        checksum: 'abc123',
      })
      mockCurrent.mockResolvedValueOnce({ bundle: { version: 'abc123' } })
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Act
      const result = await service.checkForUpdate()

      // Assert
      expect(result).toBeNull()
      expect(mockDownload).not.toHaveBeenCalled()
      expect(localStorage.getItem('pending_ota_version')).toBeNull()
      expect(logSpy).toHaveBeenCalledWith('[OTA]', 'Already on latest: abc123')
      logSpy.mockRestore()
    })

    it('deve usar VITE_APP_VERSION como fallback quando isFirstInstall e versão bate', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      mockNotifyAppReady.mockResolvedValueOnce({ bundle: { id: 'builtin' } })
      await service.initialize()
      import.meta.env.VITE_APP_VERSION = 'sha-match'
      mockFetchResponse({
        version: 'sha-match',
        bundleUrl: 'https://cdn/latest.zip',
        checksum: 'sha-match',
      })
      mockCurrent.mockResolvedValueOnce({ bundle: { version: 'builtin' } })
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Act
      const result = await service.checkForUpdate()

      // Assert
      expect(result).toBeNull()
      expect(mockDownload).not.toHaveBeenCalled()
      expect(logSpy).toHaveBeenCalledWith('[OTA]', 'Already on latest: sha-match')
      logSpy.mockRestore()
    })

    // ── pending_ota_version guard ──

    it('deve pular download se pending_ota_version no localStorage bate com versão remota', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()
      localStorage.setItem('pending_ota_version', 'v2.0')
      mockFetchResponse({
        version: 'v2.0',
        bundleUrl: 'https://cdn/latest.zip',
        checksum: 'v2.0',
      })
      mockCurrent.mockResolvedValueOnce({ bundle: { version: 'v1.0' } })
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Act
      const result = await service.checkForUpdate()

      // Assert
      expect(result).toBeNull()
      expect(mockDownload).not.toHaveBeenCalled()
      expect(logSpy).toHaveBeenCalledWith(
        '[OTA]',
        'Update applied but awaiting Cold Start: v2.0',
      )
      logSpy.mockRestore()
    })

    // ── atualização disponível (não é first install) ──

    it('deve baixar bundle e retornar resultado quando há versão nova (não é first install)', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()
      const newBundle = { version: 'v2.0', id: 'bundle-id' } as any
      mockFetchResponse({
        version: 'v2.0',
        bundleUrl: 'https://cdn/latest.zip',
        checksum: 'v2.0',
      })
      mockCurrent.mockResolvedValueOnce({ bundle: { version: 'v1.0' } })
      mockDownload.mockResolvedValueOnce(newBundle)

      // Act
      const result = await service.checkForUpdate()

      // Assert
      expect(result).toEqual({ bundle: newBundle, version: 'v2.0' })
      expect(mockDownload).toHaveBeenCalledWith({
        url: 'https://cdn/latest.zip',
        version: 'v2.0',
      })
      expect(mockSet).not.toHaveBeenCalled()
    })

    // ── first install: download + set silencioso ──

    it('deve baixar e aplicar silenciosamente no first install (builtin sem VITE_APP_VERSION)', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      mockNotifyAppReady.mockResolvedValueOnce({ bundle: { id: 'builtin' } })
      await service.initialize()
      delete import.meta.env.VITE_APP_VERSION
      const newBundle = { version: 'v1.0', id: 'first-bundle' } as any
      mockFetchResponse({
        version: 'v1.0',
        bundleUrl: 'https://cdn/latest.zip',
        checksum: 'v1.0',
      })
      mockCurrent.mockResolvedValueOnce({ bundle: { version: 'builtin' } })
      mockDownload.mockResolvedValueOnce(newBundle)
      mockSet.mockResolvedValueOnce(undefined)
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Act
      const result = await service.checkForUpdate()

      // Assert
      expect(result).toBeNull()
      expect(mockDownload).toHaveBeenCalledWith({
        url: 'https://cdn/latest.zip',
        version: 'v1.0',
      })
      expect(mockSet).toHaveBeenCalledWith({ id: 'first-bundle' })
      expect(logSpy).toHaveBeenCalledWith(
        '[OTA]',
        'First install detected. Preparing bundle for next boot silently.',
      )
      logSpy.mockRestore()
    })

    it('deve baixar e aplicar silenciosamente no first install (builtin com VITE_APP_VERSION diferente)', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      mockNotifyAppReady.mockResolvedValueOnce({ bundle: { id: 'builtin' } })
      await service.initialize()
      import.meta.env.VITE_APP_VERSION = 'old-sha'
      const newBundle = { version: 'new-sha', id: 'b1' } as any
      mockFetchResponse({
        version: 'new-sha',
        bundleUrl: 'https://cdn/latest.zip',
        checksum: 'new-sha',
      })
      mockCurrent.mockResolvedValueOnce({ bundle: { version: 'builtin' } })
      mockDownload.mockResolvedValueOnce(newBundle)
      mockSet.mockResolvedValueOnce(undefined)
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Act
      const result = await service.checkForUpdate()

      // Assert
      expect(result).toBeNull()
      expect(mockDownload).toHaveBeenCalled()
      expect(mockSet).toHaveBeenCalledWith({ id: 'b1' })
      expect(logSpy).toHaveBeenCalledWith(
        '[OTA]',
        'First install detected. Preparing bundle for next boot silently.',
      )
      logSpy.mockRestore()
    })

    // ── erros ──

    it('deve retornar null e logar erro se download falhar', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()
      mockFetchResponse({
        version: 'v2.0',
        bundleUrl: 'https://cdn/latest.zip',
        checksum: 'v2.0',
      })
      mockCurrent.mockResolvedValueOnce({ bundle: { version: 'v1.0' } })
      mockDownload.mockRejectedValueOnce(new Error('Network error'))
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Act
      const result = await service.checkForUpdate()

      // Assert
      expect(result).toBeNull()
      expect(errorSpy).toHaveBeenCalledWith('[OTA]', 'Update check failed:', expect.any(Error))
      expect(mockSet).not.toHaveBeenCalled()
      errorSpy.mockRestore()
    })

    it('deve retornar null se set() falhar no first install', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      mockNotifyAppReady.mockResolvedValueOnce({ bundle: { id: 'builtin' } })
      await service.initialize()
      delete import.meta.env.VITE_APP_VERSION
      const newBundle = { version: 'v1.0', id: 'b1' } as any
      mockFetchResponse({
        version: 'v1.0',
        bundleUrl: 'https://cdn/latest.zip',
        checksum: 'v1.0',
      })
      mockCurrent.mockResolvedValueOnce({ bundle: { version: 'builtin' } })
      mockDownload.mockResolvedValueOnce(newBundle)
      mockSet.mockRejectedValueOnce(new Error('set failed'))
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Act
      const result = await service.checkForUpdate()

      // Assert
      expect(result).toBeNull()
      expect(errorSpy).toHaveBeenCalledWith('[OTA]', 'Update check failed:', expect.any(Error))
      logSpy.mockRestore()
      errorSpy.mockRestore()
    })
  })

  // ─── applyUpdate ────────────────────────────────────────────────────────────

  describe('applyUpdate', () => {
    it('deve chamar set({ id }) e reload() e salvar no localStorage', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()
      const bundle = { version: 'v2.0', id: 'bundle-id' } as any
      mockSet.mockResolvedValueOnce(undefined)
      mockReload.mockResolvedValueOnce(undefined)
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Act
      await service.applyUpdate(bundle)

      // Assert
      expect(mockSet).toHaveBeenCalledWith({ id: 'bundle-id' })
      expect(mockReload).toHaveBeenCalledOnce()
      expect(localStorage.getItem('pending_ota_version')).toBe('v2.0')
      logSpy.mockRestore()
    })

    it('deve propagar erro se set() falhar', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()
      const bundle = { version: 'v2.0', id: 'bundle-id' } as any
      mockSet.mockRejectedValueOnce(new Error('set failed'))
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Act & Assert
      await expect(service.applyUpdate(bundle)).rejects.toThrow('set failed')
      expect(mockReload).not.toHaveBeenCalled()
      logSpy.mockRestore()
    })

    it('deve propagar erro se reload() falhar', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()
      const bundle = { version: 'v2.0', id: 'bundle-id' } as any
      mockSet.mockResolvedValueOnce(undefined)
      mockReload.mockRejectedValueOnce(new Error('reload failed'))
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Act & Assert
      await expect(service.applyUpdate(bundle)).rejects.toThrow('reload failed')
      logSpy.mockRestore()
    })

    it('deve não fazer nada se o updater não foi inicializado', async () => {
      // Arrange
      const service = new OtaUpdateService()

      // Act
      await service.applyUpdate({ version: 'v2.0', id: 'x' } as any)

      // Assert
      expect(mockSet).not.toHaveBeenCalled()
      expect(mockReload).not.toHaveBeenCalled()
    })
  })

  // ─── fetchLatestVersion (via checkForUpdate) ────────────────────────────────

  describe('fetchLatestVersion (via checkForUpdate)', () => {
    it('deve retornar null se VITE_SUPABASE_URL não estiver definida', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()
      clearEnvVars()
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Act
      const result = await service.checkForUpdate()

      // Assert
      expect(result).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledWith(
        '[OTA]',
        'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY',
      )
      warnSpy.mockRestore()
    })

    it('deve enviar headers corretos na requisição', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()
      mockFetchResponse({ version: 'v1', bundleUrl: 'https://cdn/zip', checksum: 'v1' })
      mockCurrent.mockResolvedValueOnce({ bundle: { version: 'v1' } })

      // Act
      await service.checkForUpdate()

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('https://test.supabase.co/functions/v1/ota-version', {
        headers: {
          Authorization: 'Bearer test-anon-key',
          apikey: 'test-anon-key',
        },
      })
    })

    it('deve retornar null se a resposta HTTP não for ok', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()
      mockFetchResponse({}, false, 500)
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Act
      const result = await service.checkForUpdate()

      // Assert
      expect(result).toBeNull()
      expect(mockCurrent).not.toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalledWith('[OTA]', 'Failed to fetch version:', expect.any(Error))
      errorSpy.mockRestore()
    })

    it('deve retornar null se a resposta tiver formato inválido', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()
      mockFetchResponse({ error: 'something went wrong' })
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Act
      const result = await service.checkForUpdate()

      // Assert
      expect(result).toBeNull()
      expect(mockCurrent).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledWith('[OTA]', 'Invalid response shape:', {
        error: 'something went wrong',
      })
      warnSpy.mockRestore()
    })

    it('deve retornar null se version não for string', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()
      mockFetchResponse({ version: 123, bundleUrl: 'https://cdn/zip' })
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Act
      const result = await service.checkForUpdate()

      // Assert
      expect(result).toBeNull()
      expect(mockCurrent).not.toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('deve capturar erro de rede no fetch', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()
      mockFetch.mockRejectedValueOnce(new Error('DNS resolution failed'))
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Act
      const result = await service.checkForUpdate()

      // Assert
      expect(result).toBeNull()
      expect(errorSpy).toHaveBeenCalledWith('[OTA]', 'Failed to fetch version:', expect.any(Error))
      errorSpy.mockRestore()
    })
  })
})

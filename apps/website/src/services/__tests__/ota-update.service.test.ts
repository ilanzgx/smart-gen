import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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

const mockFetch = vi.fn()

function createServiceWithCapacitor(): OtaUpdateService {
  Object.defineProperty(globalThis, 'window', { value: globalThis, writable: true })
  Object.defineProperty(globalThis, 'Capacitor', { value: {}, writable: true, configurable: true })
  return new OtaUpdateService()
}

function cleanupCapacitor(): void {
  delete (globalThis as Record<string, unknown>).Capacitor
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

  describe('isNative (getter)', () => {
    it('deve retornar false antes de inicializar', () => {
      const service = new OtaUpdateService()
      expect(service.isNative).toBe(false)
    })

    it('deve retornar true após inicialização com Capacitor', async () => {
      const service = createServiceWithCapacitor()
      await service.initialize()
      expect(service.isNative).toBe(true)
    })
  })

  describe('initialize', () => {
    it('deve pular inicialização quando window não tem Capacitor', async () => {
      const service = new OtaUpdateService()
      await service.initialize()
      expect(service.isNative).toBe(false)
      expect(mockNotifyAppReady).not.toHaveBeenCalled()
    })

    it('deve importar o plugin e chamar notifyAppReady quando Capacitor está presente', async () => {
      const service = createServiceWithCapacitor()
      await service.initialize()
      expect(service.isNative).toBe(true)
      expect(mockNotifyAppReady).toHaveBeenCalledOnce()
    })

    it('deve logar warning e resetar updater se notifyAppReady falhar', async () => {
      const service = createServiceWithCapacitor()
      mockNotifyAppReady.mockRejectedValueOnce(new Error('Plugin not available'))
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await service.initialize()

      expect(service.isNative).toBe(false)
      expect(warnSpy).toHaveBeenCalledWith(
        '[OTA]',
        'Not running on native, skipping:',
        expect.any(Error),
      )
      warnSpy.mockRestore()
    })
  })

  describe('checkForUpdate', () => {
    it('deve retornar null se o updater não foi inicializado', async () => {
      const service = new OtaUpdateService()
      const result = await service.checkForUpdate()
      expect(result).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('deve retornar null se fetchLatestVersion retornar null', async () => {
      const service = createServiceWithCapacitor()
      await service.initialize()
      mockFetchResponse({ error: 'not found' }, false, 404)

      const result = await service.checkForUpdate()

      expect(result).toBeNull()
      expect(mockCurrent).not.toHaveBeenCalled()
      expect(mockDownload).not.toHaveBeenCalled()
    })

    it('deve retornar null e limpar pending_ota_version se já estiver na versão mais recente', async () => {
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

      const result = await service.checkForUpdate()

      expect(result).toBeNull()
      expect(mockDownload).not.toHaveBeenCalled()
      expect(localStorage.getItem('pending_ota_version')).toBeNull()
      expect(logSpy).toHaveBeenCalledWith('[OTA]', 'Already on latest: abc123')
      logSpy.mockRestore()
    })

    it('deve reconhecer versão via VITE_APP_VERSION quando bundle é builtin', async () => {
      const service = createServiceWithCapacitor()
      await service.initialize()
      import.meta.env.VITE_APP_VERSION = 'sha-match'

      mockFetchResponse({
        version: 'sha-match',
        bundleUrl: 'https://cdn/latest.zip',
        checksum: 'sha-match',
      })
      mockCurrent.mockResolvedValueOnce({ bundle: {} }) // builtin → fallback VITE_APP_VERSION

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await service.checkForUpdate()

      expect(result).toBeNull()
      expect(mockDownload).not.toHaveBeenCalled()
      expect(logSpy).toHaveBeenCalledWith('[OTA]', 'Already on latest: sha-match')
      logSpy.mockRestore()
    })

    it('deve baixar bundle e retornar resultado quando há versão nova (não é first install)', async () => {
      const service = createServiceWithCapacitor()
      await service.initialize()

      const newBundle = { version: 'v2.0', id: 'bundle-id' } as any
      mockFetchResponse({
        version: 'v2.0',
        bundleUrl: 'https://cdn/latest.zip',
        checksum: 'v2.0',
      })
      // current() retorna versão real → não é first install
      mockCurrent.mockResolvedValueOnce({ bundle: { version: 'v1.0' } })
      mockDownload.mockResolvedValueOnce(newBundle)

      const result = await service.checkForUpdate()

      expect(result).toEqual({ bundle: newBundle, version: 'v2.0' })
      expect(mockDownload).toHaveBeenCalledWith({
        url: 'https://cdn/latest.zip',
        version: 'v2.0',
      })
      expect(mockSet).not.toHaveBeenCalled()
    })

    it('deve pular download se pending_ota_version no localStorage bate com versão remota', async () => {
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

      const result = await service.checkForUpdate()

      expect(result).toBeNull()
      expect(mockDownload).not.toHaveBeenCalled()
      expect(logSpy).toHaveBeenCalledWith('[OTA]', 'Update applied but awaiting Cold Start: v2.0')
      logSpy.mockRestore()
    })

    it('deve baixar e aplicar silenciosamente no first install (builtin sem VITE_APP_VERSION)', async () => {
      const service = createServiceWithCapacitor()
      await service.initialize()
      delete import.meta.env.VITE_APP_VERSION

      const newBundle = { version: 'v1.0', id: 'first-bundle' } as any
      mockFetchResponse({
        version: 'v1.0',
        bundleUrl: 'https://cdn/latest.zip',
        checksum: 'v1.0',
      })
      mockCurrent.mockResolvedValueOnce({ bundle: {} }) // builtin → isFirstInstall = true
      mockDownload.mockResolvedValueOnce(newBundle)
      mockSet.mockResolvedValueOnce(undefined)

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await service.checkForUpdate()

      expect(result).toBeNull()
      expect(mockDownload).toHaveBeenCalled()
      expect(mockSet).toHaveBeenCalledWith({ id: 'first-bundle' })
      expect(logSpy).toHaveBeenCalledWith(
        '[OTA]',
        'First install detected. Preparing bundle for next boot silently.',
      )
      logSpy.mockRestore()
    })

    it('deve baixar e aplicar silenciosamente no first install (builtin com VITE_APP_VERSION diferente)', async () => {
      const service = createServiceWithCapacitor()
      await service.initialize()
      import.meta.env.VITE_APP_VERSION = 'old-sha'

      const newBundle = { version: 'new-sha', id: 'b1' } as any
      mockFetchResponse({
        version: 'new-sha',
        bundleUrl: 'https://cdn/latest.zip',
        checksum: 'new-sha',
      })
      mockCurrent.mockResolvedValueOnce({ bundle: {} }) // builtin → isFirstInstall = true
      mockDownload.mockResolvedValueOnce(newBundle)
      mockSet.mockResolvedValueOnce(undefined)

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await service.checkForUpdate()

      expect(result).toBeNull()
      expect(mockDownload).toHaveBeenCalled()
      expect(mockSet).toHaveBeenCalledWith({ id: 'b1' })
      expect(logSpy).toHaveBeenCalledWith(
        '[OTA]',
        'First install detected. Preparing bundle for next boot silently.',
      )
      logSpy.mockRestore()
    })

    it('deve retornar null e logar erro se download falhar', async () => {
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

      const result = await service.checkForUpdate()

      expect(result).toBeNull()
      expect(errorSpy).toHaveBeenCalledWith('[OTA]', 'Update check failed:', expect.any(Error))
      expect(mockSet).not.toHaveBeenCalled()
      errorSpy.mockRestore()
    })
  })

  describe('applyUpdate', () => {
    it('deve chamar set({ id }) e reload() e salvar no localStorage', async () => {
      const service = createServiceWithCapacitor()
      await service.initialize()

      const bundle = { version: 'v2.0', id: 'bundle-id' } as any
      mockSet.mockResolvedValueOnce(undefined)
      mockReload.mockResolvedValueOnce(undefined)

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await service.applyUpdate(bundle)

      expect(mockSet).toHaveBeenCalledWith({ id: 'bundle-id' })
      expect(mockReload).toHaveBeenCalledOnce()
      expect(localStorage.getItem('pending_ota_version')).toBe('v2.0')
      logSpy.mockRestore()
    })

    it('deve propagar erro se set() falhar', async () => {
      const service = createServiceWithCapacitor()
      await service.initialize()

      const bundle = { version: 'v2.0', id: 'bundle-id' } as any
      mockSet.mockRejectedValueOnce(new Error('set failed'))

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await expect(service.applyUpdate(bundle)).rejects.toThrow('set failed')
      expect(mockReload).not.toHaveBeenCalled()
      logSpy.mockRestore()
    })

    it('deve propagar erro se reload() falhar', async () => {
      const service = createServiceWithCapacitor()
      await service.initialize()

      const bundle = { version: 'v2.0', id: 'bundle-id' } as any
      mockSet.mockResolvedValueOnce(undefined)
      mockReload.mockRejectedValueOnce(new Error('reload failed'))

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await expect(service.applyUpdate(bundle)).rejects.toThrow('reload failed')
      logSpy.mockRestore()
    })

    it('deve não fazer nada se o updater não foi inicializado', async () => {
      const service = new OtaUpdateService()

      await service.applyUpdate({ version: 'v2.0', id: 'x' } as any)

      expect(mockSet).not.toHaveBeenCalled()
      expect(mockReload).not.toHaveBeenCalled()
    })
  })

  describe('fetchLatestVersion (via checkForUpdate)', () => {
    it('deve retornar null se VITE_SUPABASE_URL não estiver definida', async () => {
      const service = createServiceWithCapacitor()
      await service.initialize()
      clearEnvVars()

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await service.checkForUpdate()

      expect(result).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledWith(
        '[OTA]',
        'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY',
      )
      warnSpy.mockRestore()
    })

    it('deve enviar headers corretos na requisição', async () => {
      const service = createServiceWithCapacitor()
      await service.initialize()

      mockFetchResponse({ version: 'v1', bundleUrl: 'https://cdn/zip', checksum: 'v1' })
      mockCurrent.mockResolvedValueOnce({ bundle: { version: 'v1' } })

      await service.checkForUpdate()

      expect(mockFetch).toHaveBeenCalledWith('https://test.supabase.co/functions/v1/ota-version', {
        headers: {
          Authorization: 'Bearer test-anon-key',
          apikey: 'test-anon-key',
        },
      })
    })

    it('deve retornar null se a resposta HTTP não for ok', async () => {
      const service = createServiceWithCapacitor()
      await service.initialize()

      mockFetchResponse({}, false, 500)
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await service.checkForUpdate()

      expect(result).toBeNull()
      expect(mockCurrent).not.toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalledWith('[OTA]', 'Failed to fetch version:', expect.any(Error))
      errorSpy.mockRestore()
    })

    it('deve retornar null se a resposta tiver formato inválido', async () => {
      const service = createServiceWithCapacitor()
      await service.initialize()

      mockFetchResponse({ error: 'something went wrong' })
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await service.checkForUpdate()

      expect(result).toBeNull()
      expect(mockCurrent).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledWith('[OTA]', 'Invalid response shape:', {
        error: 'something went wrong',
      })
      warnSpy.mockRestore()
    })

    it('deve retornar null se version não for string', async () => {
      const service = createServiceWithCapacitor()
      await service.initialize()

      mockFetchResponse({ version: 123, bundleUrl: 'https://cdn/zip' })
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await service.checkForUpdate()

      expect(result).toBeNull()
      expect(mockCurrent).not.toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('deve capturar erro de rede no fetch', async () => {
      const service = createServiceWithCapacitor()
      await service.initialize()

      mockFetch.mockRejectedValueOnce(new Error('DNS resolution failed'))
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await service.checkForUpdate()

      expect(result).toBeNull()
      expect(errorSpy).toHaveBeenCalledWith('[OTA]', 'Failed to fetch version:', expect.any(Error))
      errorSpy.mockRestore()
    })
  })
})

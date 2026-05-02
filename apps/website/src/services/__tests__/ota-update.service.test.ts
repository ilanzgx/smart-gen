import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { OtaUpdateService } from '../ota-update.service'

const mockNotifyAppReady = vi.fn().mockResolvedValue({ bundle: { version: '1.0' } })
const mockCurrent = vi.fn()
const mockDownload = vi.fn()
const mockSet = vi.fn()

vi.mock('@capgo/capacitor-updater', () => ({
  CapacitorUpdater: {
    notifyAppReady: (...args: unknown[]) => mockNotifyAppReady(...args),
    current: (...args: unknown[]) => mockCurrent(...args),
    download: (...args: unknown[]) => mockDownload(...args),
    set: (...args: unknown[]) => mockSet(...args),
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
    setEnvVars()
  })

  afterEach(() => {
    cleanupCapacitor()
    clearEnvVars()
  })

  describe('isNative (getter)', () => {
    it('deve retornar false antes de inicializar', () => {
      // Arrange & Act
      const service = new OtaUpdateService()

      // Assert
      expect(service.isNative).toBe(false)
    })

    it('deve retornar true após inicialização com Capacitor', async () => {
      // Arrange
      const service = createServiceWithCapacitor()

      // Act
      await service.initialize()

      // Assert
      expect(service.isNative).toBe(true)
    })
  })

  describe('initialize', () => {
    it('deve pular inicialização quando window não tem Capacitor', async () => {
      // Arrange
      const service = new OtaUpdateService()

      // Act
      await service.initialize()

      // Assert
      expect(service.isNative).toBe(false)
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

    it('deve logar warning e resetar updater se notifyAppReady falhar', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      mockNotifyAppReady.mockRejectedValueOnce(new Error('Plugin not available'))
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Act
      await service.initialize()

      // Assert — falha no notifyAppReady reseta o updater para evitar estado inconsistente
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
    it('deve retornar silenciosamente se o updater não foi inicializado', async () => {
      // Arrange
      const service = new OtaUpdateService()

      // Act
      await service.checkForUpdate()

      // Assert
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('deve retornar silenciosamente se fetchLatestVersion retornar null', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()
      mockFetchResponse({ error: 'not found' }, false, 404)

      // Act
      await service.checkForUpdate()

      // Assert
      expect(mockCurrent).not.toHaveBeenCalled()
      expect(mockDownload).not.toHaveBeenCalled()
    })

    it('deve pular download se já estiver na versão mais recente', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()

      mockFetchResponse({
        version: 'abc123',
        bundleUrl: 'https://cdn/latest.zip',
        checksum: 'abc123',
      })
      mockCurrent.mockResolvedValueOnce({ bundle: { version: 'abc123' } })

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Act
      await service.checkForUpdate()

      // Assert
      expect(mockDownload).not.toHaveBeenCalled()
      expect(logSpy).toHaveBeenCalledWith('[OTA]', 'Already on latest: abc123')

      logSpy.mockRestore()
    })

    it('deve baixar e aplicar bundle quando há versão nova disponível', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()

      const newBundle = { version: 'v2.0', id: 'bundle-id' }
      mockFetchResponse({ version: 'v2.0', bundleUrl: 'https://cdn/latest.zip', checksum: 'v2.0' })
      mockCurrent.mockResolvedValueOnce({ bundle: { version: 'v1.0' } })
      mockDownload.mockResolvedValueOnce(newBundle)
      mockSet.mockResolvedValueOnce(undefined)

      // Act
      await service.checkForUpdate()

      // Assert
      expect(mockDownload).toHaveBeenCalledWith({
        url: 'https://cdn/latest.zip',
        version: 'v2.0',
      })
      expect(mockSet).toHaveBeenCalledWith(newBundle)
    })

    it('deve baixar quando versão atual é builtin (bundle nunca foi setado)', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()

      mockFetchResponse({ version: 'v1.0', bundleUrl: 'https://cdn/latest.zip', checksum: 'v1.0' })
      mockCurrent.mockResolvedValueOnce({ bundle: {} }) // sem version → cai no ?? 'builtin'

      const newBundle = { version: 'v1.0' }
      mockDownload.mockResolvedValueOnce(newBundle)
      mockSet.mockResolvedValueOnce(undefined)

      // Act
      await service.checkForUpdate()

      // Assert
      expect(mockDownload).toHaveBeenCalled()
      expect(mockSet).toHaveBeenCalledWith(newBundle)
    })

    it('deve capturar erro e logar se download falhar', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()

      mockFetchResponse({ version: 'v2.0', bundleUrl: 'https://cdn/latest.zip', checksum: 'v2.0' })
      mockCurrent.mockResolvedValueOnce({ bundle: { version: 'v1.0' } })
      mockDownload.mockRejectedValueOnce(new Error('Network error'))

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Act
      await service.checkForUpdate()

      // Assert
      expect(errorSpy).toHaveBeenCalledWith('[OTA]', 'Update check failed:', expect.any(Error))
      expect(mockSet).not.toHaveBeenCalled()

      errorSpy.mockRestore()
    })
  })

  describe('fetchLatestVersion (via checkForUpdate)', () => {
    it('deve retornar null se VITE_SUPABASE_URL não estiver definida', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()
      clearEnvVars()

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Act
      await service.checkForUpdate()

      // Assert
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
      await service.checkForUpdate()

      // Assert
      expect(mockCurrent).not.toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalledWith('[OTA]', 'Failed to fetch version:', expect.any(Error))

      errorSpy.mockRestore()
    })

    it('deve retornar null se a resposta tiver formato inválido', async () => {
      // Arrange
      const service = createServiceWithCapacitor()
      await service.initialize()

      mockFetchResponse({ error: 'something went wrong' }) // falta version e bundleUrl
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Act
      await service.checkForUpdate()

      // Assert
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
      await service.checkForUpdate()

      // Assert
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
      await service.checkForUpdate()

      // Assert
      expect(errorSpy).toHaveBeenCalledWith('[OTA]', 'Failed to fetch version:', expect.any(Error))

      errorSpy.mockRestore()
    })
  })
})

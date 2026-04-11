import { describe, it, expect } from 'vitest'
import router from '../index'

describe('router testes unitários', () => {
  it('deve conter a rota home com path "/"', () => {
    // Arrange & Act
    const homeRoute = router.getRoutes().find((route) => route.name === 'home')

    // Assert
    expect(homeRoute).toBeDefined()
    expect(homeRoute?.path).toBe('/')
  })

  it('deve usar createWebHistory', () => {
    // Arrange & Act
    // router.options.history.base é acessível quando se usa createWebHistory
    const history = router.options.history

    // Assert
    expect(history).toBeDefined()
    expect(router.options.history.location).toBe('/')
  })

  it('não deve conter rotas indefinidas', () => {
    // Arrange & Act
    const routes = router.getRoutes()

    // Assert
    routes.forEach((route) => {
      expect(route.path).toBeDefined()
      expect(route.name).toBeDefined()
    })
  })

  it('deve conter uma rota de fallback (404) para caminhos inexistentes', () => {
    // Arrange & Act
    const routes = router.getRoutes()
    const notFoundRoute = routes.find((route) => route.name === 'not-found')

    // Assert
    expect(notFoundRoute).toBeDefined()
    expect(notFoundRoute?.path).toBe('/:pathMatch(.*)*')
  })
})

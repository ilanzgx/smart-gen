import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<'light' | 'dark'>('light')

  const init = () => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') {
      theme.value = stored
    }
    applyTheme()
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    applyTheme()
  }

  const setTheme = (t: 'light' | 'dark') => {
    theme.value = t
    applyTheme()
  }

  const applyTheme = () => {
    if (theme.value === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme.value)
  }

  init()

  return {
    theme,
    toggleTheme,
    setTheme,
  }
})
<script setup lang="ts">
import { computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Button,
  Label,
} from '@/components/ui'
import { Switch } from '@/components/ui/switch'
import { Moon, Sun } from 'lucide-vue-next'
import { useThemeStore } from '@/stores/theme.store'

const props = defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const themeStore = useThemeStore()
const isDarkMode = computed(() => themeStore.theme === 'dark')

const onThemeToggle = (checked: boolean) => {
  themeStore.setTheme(checked ? 'dark' : 'light')
}
</script>

<template>
  <Dialog :open="props.open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="sm:max-w-106.25 md:max-w-xl">
      <DialogHeader>
        <DialogTitle class="text-xl font-bold">Configurações</DialogTitle>
        <DialogDescription class="text-slate-500 dark:text-slate-400">
          Gerencie as preferências da sua conta e da aplicação.
        </DialogDescription>
      </DialogHeader>

      <div class="py-4">
        <!-- Seção de Aparência -->
        <div class="space-y-4">
          <h3
            class="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider"
          >
            Aparência
          </h3>

          <div
            class="flex items-center justify-between p-4.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 shadow-2xs"
          >
            <div class="flex items-center gap-4">
              <div
                class="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-2xs border border-slate-100/80 dark:border-slate-700/60 flex items-center justify-center shrink-0"
              >
                <Moon v-if="isDarkMode" class="w-5 h-5 text-indigo-400" />
                <Sun v-else class="w-5 h-5 text-amber-500" />
              </div>
              <div class="space-y-0.5">
                <Label for="theme-toggle" class="text-base font-semibold cursor-pointer"
                  >Modo Escuro</Label
                >
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Ajusta o tema visual da tela.
                </p>
              </div>
            </div>

            <Switch id="theme-toggle" :model-value="isDarkMode" @update:model-value="onThemeToggle" />
          </div>
        </div>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="default" class="w-full sm:w-auto" @click="emit('update:open', false)">
            Pronto
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

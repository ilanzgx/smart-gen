<script setup lang="ts">
// Código de referência: https://gist.github.com/brattonc/5e5ce9beee483220e2f6
// Com adaptações para o projeto Smart Gen, sem D3.js

import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  value: number
  color?: string
  backgroundColor?: string
}>()

const primaryColor = props.color || '#3b82f6'
const bgColor = props.backgroundColor || '#bfdbfe'

const displayValue = ref(0)
const wavePathRef = ref<SVGPathElement | null>(null)

const wavePath = `
  M 0 0
  Q 12.5 -5, 25 0
  T 50 0
  T 75 0
  T 100 0
  T 125 0
  T 150 0
  T 175 0
  T 200 0
  V 120
  H 0
  Z
`

const uniqueId = `wave-clip-${Math.random().toString(36).substr(2, 9)}`

let globalRafId: number
let currentY = 0
let startY = 0
let targetY = 0

// Animação super otimizada bypassando a reatividade do Vue a cada frame de X e Y
onMounted(() => {
  const waveDuration = 3000 // 3 segundos para um loop da onda X (velocidade)
  let riseStartTime = performance.now()

  const runAnimation = (time: number) => {
    // 1. Fase X Infinita: -100px garante o loop visual pois 100 é o tamanho de um ciclo na curva
    const waveX = -((time % waveDuration) / waveDuration) * 100

    // 2. Transição Y da Água
    const elapsedY = time - riseStartTime
    const riseDuration = 1000
    const progressY = Math.min(elapsedY / riseDuration, 1)

    // Ease out quad
    const easeFlow = progressY * (2 - progressY)
    currentY = startY + (targetY - startY) * easeFlow

    // Atualiza o texto visual (reativo Vue)
    if (Math.round(currentY) !== displayValue.value) {
      displayValue.value = Math.round(currentY)
    }

    if (wavePathRef.value) {
      // Nível do eixo Y (100 = 0% de água; 0 = 100% de água)
      const waterLevelY = 100 - currentY
      wavePathRef.value.setAttribute('transform', `translate(${waveX}, ${waterLevelY})`)
    }

    globalRafId = requestAnimationFrame(runAnimation)
  }

  globalRafId = requestAnimationFrame(runAnimation)

  // Ao mudar as Props do Pai, apenas atualiza a meta e reseta o Timer Y
  watch(
    () => props.value,
    (newVal) => {
      startY = currentY
      targetY = newVal
      riseStartTime = performance.now()
    },
    { immediate: true },
  )
})

onUnmounted(() => {
  if (globalRafId) cancelAnimationFrame(globalRafId)
})
</script>

<template>
  <div class="relative w-full max-w-50 aspect-square mx-auto liquid-gauge-container">
    <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-sm">
      <defs>
        <clipPath :id="uniqueId">
          <path ref="wavePathRef" :d="wavePath" />
        </clipPath>
      </defs>

      <circle
        cx="50"
        cy="50"
        r="48"
        :stroke="primaryColor"
        stroke-width="4"
        fill="none"
        opacity="0.8"
      />
      <circle cx="50" cy="50" r="45" :fill="bgColor" opacity="0.3" />

      <circle
        cx="50"
        cy="50"
        r="45"
        :fill="primaryColor"
        :clip-path="`url(#${uniqueId})`"
        opacity="0.8"
      />

      <text
        x="50"
        y="50"
        transform="translate(0, 8)"
        text-anchor="middle"
        font-size="22"
        font-weight="bold"
        :fill="primaryColor"
      >
        {{ displayValue }}%
      </text>

      <g :clip-path="`url(#${uniqueId})`">
        <text
          x="50"
          y="50"
          transform="translate(0, 8)"
          text-anchor="middle"
          font-size="22"
          font-weight="bold"
          fill="#ffffff"
        >
          {{ displayValue }}%
        </text>
      </g>
    </svg>
  </div>
</template>

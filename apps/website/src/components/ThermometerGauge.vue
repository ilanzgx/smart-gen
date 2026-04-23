<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    max?: number
    color?: string
    backgroundColor?: string
    unit?: string
  }>(),
  {
    max: 100,
    color: '#ef4444',
    backgroundColor: '#fee2e2',
    unit: '°C',
  },
)

const safeValue = computed(() => Math.max(0, Math.min(props.value, props.max)))
const liquidY = computed(() => 134 - (safeValue.value / props.max) * 104)

const displayValue = ref(0)
let animationFrameId: number

watch(
  safeValue,
  (newVal) => {
    const startValue = displayValue.value
    const startTime = performance.now()

    const animateNumber = (time: number) => {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / 1000, 1)
      const easeFlow = progress * (2 - progress)

      displayValue.value = startValue + (newVal - startValue) * easeFlow

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animateNumber)
      }
    }

    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    animationFrameId = requestAnimationFrame(animateNumber)
  },
  { immediate: true },
)

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})

const thermoPath = `
  M 35 30
  A 15 15 0 0 1 65 30
  V 134
  A 30 30 0 1 1 35 134
  Z
`
const clipId = `clip-${Math.random().toString(36).substring(2, 9)}`
</script>

<template>
  <div
    class="relative w-full max-w-24 aspect-1/2 mx-auto group"
    role="meter"
    aria-label="Temperatura"
    :aria-valuenow="Math.round(safeValue)"
    aria-valuemin="0"
    :aria-valuemax="max"
  >
    <svg viewBox="0 0 100 200" class="w-full h-full drop-shadow-sm" aria-hidden="true">
      <defs>
        <!-- Limit height of thermal liquid -->
        <clipPath :id="clipId">
          <path :d="thermoPath" />
        </clipPath>
      </defs>

      <!-- Glass background -->
      <path :d="thermoPath" :stroke="color" stroke-width="4" fill="none" opacity="0.8" />
      <path :d="thermoPath" :fill="backgroundColor" opacity="0.3" />

      <!-- Thermal Fluid Masqueraded in Glass -->
      <g :clip-path="`url(#${clipId})`">
        <!-- Floor liquid. Moves Y to change height. -->
        <rect
          x="0"
          :y="liquidY"
          width="100"
          height="200"
          :fill="color"
          style="transition: y 1s ease-out"
          opacity="0.8"
        />
      </g>

      <!-- Glare Effect (Acrylic/Glass reflection) -->
      <line
        x1="42"
        y1="38"
        x2="42"
        y2="128"
        stroke="#ffffff"
        stroke-width="4"
        stroke-linecap="round"
        opacity="0.35"
      />
      <circle cx="42" cy="152" r="4" fill="#ffffff" opacity="0.4" />

      <!-- Gauge Marks -->
      <g stroke="#9ca3af" stroke-width="2" opacity="0.6" stroke-linecap="round">
        <line x1="72" y1="30" x2="82" y2="30" />
        <!-- 100% -->
        <line x1="72" y1="56" x2="77" y2="56" />
        <!-- 75% -->
        <line x1="72" y1="82" x2="82" y2="82" />
        <!-- 50% -->
        <line x1="72" y1="108" x2="77" y2="108" />
        <!-- 25% -->
        <line x1="72" y1="134" x2="82" y2="134" />
        <!-- 0% -->
      </g>

      <!-- Value Text -->
      <text
        x="50"
        y="160"
        transform="translate(0, 6)"
        text-anchor="middle"
        font-size="18"
        font-weight="bold"
        fill="#ffffff"
      >
        {{ Math.round(displayValue) }}{{ unit }}
      </text>
    </svg>
  </div>
</template>

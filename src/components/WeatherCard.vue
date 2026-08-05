<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  id: Number,
  name: String,
  temp: Number,
  status: String,
  running: Object,
})
const emit = defineEmits(['weatherCardClickEvent'])

const clickEvent = () => emit('weatherCardClickEvent', props.name)

import { useConfigStore } from '@/stores/configStore'
const configStore = useConfigStore()

const displayTemp = computed(() => {
  const rawTemp = props.temp // 기본 원본 데이터는 섭씨 숫자
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32) // 화씨 변환 연산
  }
  return rawTemp // 'celsius'일 때는 원본 그대로 반환
})

const weatherVisual = computed(() => {
  const status = (props.status ?? '').toLowerCase()
  const temperature = Number(props.temp)

  if (/(뇌우|천둥|번개|thunder|storm)/.test(status)) {
    return { tone: 'storm', icon: 'fa-solid fa-cloud-bolt', label: '뇌우 주의' }
  }
  if (temperature >= 28) {
    return { tone: 'hot', icon: 'fa-solid fa-temperature-arrow-up', label: '고온 주의' }
  }
  if (/(눈|진눈깨비|snow|sleet)/.test(status)) {
    return { tone: 'snow', icon: 'fa-regular fa-snowflake', label: '노면 주의' }
  }
  if (/(비|소나기|이슬비|rain|drizzle|shower)/.test(status)) {
    return { tone: 'rain', icon: 'fa-solid fa-cloud-showers-heavy', label: '우천 러닝' }
  }
  if (/(구름|흐림|cloud|overcast)/.test(status)) {
    return { tone: 'cloud', icon: 'fa-solid fa-cloud', label: '흐린 날씨' }
  }
  if (/(안개|박무|연무|황사|먼지|fog|mist|haze|dust|smoke|sand)/.test(status)) {
    return { tone: 'mist', icon: 'fa-solid fa-smog', label: '시야 주의' }
  }
  if (temperature <= 5) {
    return { tone: 'cold', icon: 'fa-solid fa-temperature-arrow-down', label: '추운 날씨' }
  }
  if (/(맑|쾌청|clear|sun)/.test(status)) {
    return { tone: 'clear', icon: 'fa-solid fa-sun', label: '맑고 쾌적' }
  }
  if (temperature >= 23) {
    return { tone: 'warm', icon: 'fa-solid fa-sun', label: '따뜻한 날씨' }
  }
  return { tone: 'mild', icon: 'fa-solid fa-wind', label: '선선한 날씨' }
})
</script>

<template>
  <article
    id="weatherCard"
    :class="['weather-card', `weather-card--${weatherVisual.tone}`]"
    @click="clickEvent"
  >
    <div class="weather-card__topline">
      <span class="location-label"><i class="fa-solid fa-location-dot"></i> {{ name }}</span>
      <span class="condition-pill">{{ status }}</span>
    </div>

    <div class="weather-card__temperature">
      <i :class="weatherVisual.icon"></i>
      <strong>{{ displayTemp }}<sup>{{ configStore.unitSymbol }}</sup></strong>
    </div>

    <div v-if="running" class="running-summary">
      <div class="running-score">
        <span class="score-icon"><i class="fa-solid fa-person-running"></i></span>
        <span>
          <small>RUNNING INDEX</small>
          <strong>{{ running.grade }} · {{ running.score }}점</strong>
        </span>
      </div>
      <p>{{ running.message }}</p>
    </div>

    <div class="weather-card__footer">
      <span class="temperature-feel">
        <i :class="weatherVisual.icon"></i>
        {{ weatherVisual.label }}
      </span>
      <button class="detail-button" @click.stop="router.push('/weather/' + id)">
        상세보기 <i class="fa-solid fa-arrow-right"></i>
      </button>
    </div>
  </article>
</template>

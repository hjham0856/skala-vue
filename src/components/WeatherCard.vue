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
</script>

<template>
  <article id="weatherCard" class="weather-card" @click="clickEvent">
    <div class="weather-card__topline">
      <span class="location-label"><i class="fa-solid fa-location-dot"></i> {{ name }}</span>
      <span class="condition-pill">{{ status }}</span>
    </div>

    <div class="weather-card__temperature">
      <i :class="temp >= 25 ? 'fa-solid fa-sun' : 'fa-solid fa-wind'"></i>
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
        <i :class="temp >= 25 ? 'fa-solid fa-fire' : 'fa-regular fa-snowflake'"></i>
        {{ temp >= 25 ? '더운 날씨' : '선선한 날씨' }}
      </span>
      <button class="detail-button" @click.stop="router.push('/weather/' + id)">
        상세보기 <i class="fa-solid fa-arrow-right"></i>
      </button>
    </div>
  </article>
</template>

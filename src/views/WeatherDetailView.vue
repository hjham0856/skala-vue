<script setup>
import { useCityListStore } from '@/stores/cityListStore'
import { useConfigStore } from '@/stores/configStore'
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { airQualityLabel, calculateRunningScore } from '@/utils/runningScore.js'

const route = useRoute()
const configStore = useConfigStore()

// Card에서 받아오는게 아니라 여기서 api 호출하는 방식
const OWM_KEY = 'b06c8e2135d8c4a27b4e67195a0416a9'
const OWM_URL = 'https://api.openweathermap.org/data/2.5/weather'
const AIR_POLLUTION_URL = 'https://api.openweathermap.org/data/2.5/air_pollution'
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast'

const weatherDetail = ref({})
const isLoading = ref(true)
const errorMessage = ref('')

const cityListStore = useCityListStore()
const getName = (cityId) => {
  for (let city of cityListStore.cityList) {
    if (city.id === Number(cityId)) {
      return city.name
    }
  }
  return '어딘가'
}

onMounted(async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const weatherResponse = await axios.get(OWM_URL, {
      params: { id: route.params.cityId, appid: OWM_KEY, units: 'metric', lang: 'kr' },
    })
    const weather = weatherResponse.data
    const { lat, lon } = weather.coord
    const [airPollutionResponse, forecastResponse] = await Promise.all([
      axios.get(AIR_POLLUTION_URL, { params: { lat, lon, appid: OWM_KEY } }),
      axios.get(FORECAST_URL, { params: { lat, lon, appid: OWM_KEY, units: 'metric', lang: 'kr', cnt: 1 } }),
    ])
    const air = airPollutionResponse.data.list[0]
    const forecast = forecastResponse.data.list[0] ?? {}
    const precipitation = (weather.rain?.['1h'] ?? 0) + (weather.snow?.['1h'] ?? 0)
    const runningInputs = {
      temp: weather.main.temp,
      feelsLike: weather.main.feels_like,
      humidity: weather.main.humidity,
      rain: weather.rain?.['1h'] ?? 0,
      snow: weather.snow?.['1h'] ?? 0,
      precipitationProbability: Math.round((forecast.pop ?? 0) * 100),
      windSpeed: weather.wind.speed,
      windGust: weather.wind.gust ?? forecast.wind?.gust ?? 0,
      visibility: weather.visibility ?? 10000,
      aqi: air.main.aqi,
      weatherCode: weather.weather[0].id,
    }

    weatherDetail.value = {
      id: weather.id,
      name: getName(weather.id),
      temp: weather.main.temp,
      feelsLike: weather.main.feels_like,
      status: weather.weather[0].description,
      humidity: weather.main.humidity,
      windSpeed: weather.wind.speed,
      windGust: weather.wind.gust ?? forecast.wind?.gust ?? 0,
      visibility: weather.visibility ?? 10000,
      rain: weather.rain?.['1h'] ?? 0,
      snow: weather.snow?.['1h'] ?? 0,
      precipitation,
      precipitationProbability: Math.round((forecast.pop ?? 0) * 100),
      pm25: air.components.pm2_5,
      pm10: air.components.pm10,
      ozone: air.components.o3,
      aqi: air.main.aqi,
      airQuality: airQualityLabel(air.main.aqi),
      running: calculateRunningScore(runningInputs),
    }
  } catch (error) {
    console.error(error)
    errorMessage.value = '날씨 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
})

const displayTemp = (rawTemp) => {
  // 기본 원본 데이터는 섭씨 숫자
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32) // 화씨 변환 연산
  }
  return rawTemp // 'celsius'일 때는 원본 그대로 반환
}

const runningScoreStyle = computed(() => {
  const score = Math.max(0, Math.min(100, Number(weatherDetail.value.running?.score ?? 0)))

  if (score >= 80) {
    return {
      '--score-progress': `${score * 3.6}deg`,
      '--score-color': '#9ff77d',
      '--score-color-rgb': '159, 247, 125',
    }
  }
  if (score >= 60) {
    return {
      '--score-progress': `${score * 3.6}deg`,
      '--score-color': '#67d7ff',
      '--score-color-rgb': '103, 215, 255',
    }
  }
  if (score >= 40) {
    return {
      '--score-progress': `${score * 3.6}deg`,
      '--score-color': '#ffc563',
      '--score-color-rgb': '255, 197, 99',
    }
  }
  return {
    '--score-progress': `${score * 3.6}deg`,
    '--score-color': '#ff7380',
    '--score-color-rgb': '255, 115, 128',
  }
})
</script>

<template>
  <div class="detail-page">
    <p v-if="isLoading" class="state-message glass-panel">
      <i class="fa-solid fa-circle-notch fa-spin"></i> 날씨 정보를 불러오는 중입니다...
    </p>
    <p v-else-if="errorMessage" class="state-message state-message--error glass-panel">
      <i class="fa-solid fa-triangle-exclamation"></i> {{ errorMessage }}
    </p>
    <template v-else>
      <div class="detail-titlebar">
        <div>
          <span class="section-kicker"><i class="fa-solid fa-location-dot"></i> RUNNING FORECAST</span>
          <h1>{{ weatherDetail.name }}의 날씨</h1>
        </div>
        <RouterLink class="back-link" to="/"><i class="fa-solid fa-arrow-left"></i> 홈으로</RouterLink>
      </div>

      <section class="detail-hero glass-panel">
        <div class="detail-current">
          <span class="condition-pill"><i class="fa-solid fa-cloud-sun"></i> {{ weatherDetail.status }}</span>
          <strong class="detail-temperature">{{ displayTemp(weatherDetail.temp) }}<sup>{{ configStore.unitSymbol }}</sup></strong>
          <p>체감 {{ displayTemp(weatherDetail.feelsLike) + configStore.unitSymbol }} · 습도 {{ weatherDetail.humidity }}%</p>
        </div>
        <div class="detail-running-score">
          <span
            class="score-ring"
            :style="runningScoreStyle"
            role="img"
            :aria-label="`러닝 지수 ${weatherDetail.running.score}점`"
          >
            <span class="score-ring__value">
              <strong>{{ weatherDetail.running.score }}</strong><small>/ 100</small>
            </span>
          </span>
          <div>
            <span class="section-kicker">RUNNING INDEX</span>
            <h2>{{ weatherDetail.running.grade }}</h2>
            <p>{{ weatherDetail.running.message }}</p>
          </div>
        </div>
      </section>

      <section class="metrics-grid">
        <article class="metric-card glass-panel"><i class="fa-solid fa-wind"></i><span>평균 풍속</span><strong>{{ weatherDetail.windSpeed }}<small>m/s</small></strong></article>
        <article class="metric-card glass-panel"><i class="fa-solid fa-gauge-high"></i><span>최대 돌풍</span><strong>{{ weatherDetail.windGust }}<small>m/s</small></strong></article>
        <article class="metric-card glass-panel"><i class="fa-solid fa-eye"></i><span>시정거리</span><strong>{{ (weatherDetail.visibility / 1000).toFixed(1) }}<small>km</small></strong></article>
        <article class="metric-card glass-panel"><i class="fa-solid fa-cloud-rain"></i><span>3시간 강수 확률</span><strong>{{ weatherDetail.precipitationProbability }}<small>%</small></strong></article>
      </section>

      <div class="detail-columns">
        <section class="info-card glass-panel">
          <div class="section-heading">
            <div><span class="section-kicker">AIR QUALITY</span><h2><i class="fa-solid fa-leaf"></i> 대기질</h2></div>
            <span class="condition-pill">{{ weatherDetail.airQuality }} · AQI {{ weatherDetail.aqi }}</span>
          </div>
          <dl class="data-list">
            <div><dt>초미세먼지 <small>PM2.5</small></dt><dd>{{ weatherDetail.pm25 }} μg/m³</dd></div>
            <div><dt>미세먼지 <small>PM10</small></dt><dd>{{ weatherDetail.pm10 }} μg/m³</dd></div>
            <div><dt>오존 <small>O₃</small></dt><dd>{{ weatherDetail.ozone }} μg/m³</dd></div>
          </dl>
        </section>
        <section class="info-card glass-panel">
          <div class="section-heading">
            <div><span class="section-kicker">PRECIPITATION</span><h2><i class="fa-solid fa-droplet"></i> 강수 정보</h2></div>
          </div>
          <dl class="data-list">
            <div><dt>시간당 비·눈</dt><dd>{{ weatherDetail.precipitation }} mm</dd></div>
            <div><dt>시간당 적설량</dt><dd>{{ weatherDetail.snow }} mm</dd></div>
            <div><dt>강수 확률</dt><dd>{{ weatherDetail.precipitationProbability }}%</dd></div>
          </dl>
        </section>
      </div>

      <div class="safety-note glass-panel">
        <i class="fa-solid fa-shield-heart"></i>
        <div><strong>러닝 안전 체크</strong><p>{{ weatherDetail.running.safetyWarnings.join(', ') || '특별한 안전 경고가 없습니다. 즐거운 러닝 되세요!' }}</p></div>
      </div>
    </template>
  </div>
</template>

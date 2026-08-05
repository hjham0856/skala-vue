<script setup>
import { useCityListStore } from '@/stores/cityListStore'
import { useConfigStore } from '@/stores/configStore'
import axios from 'axios'
import { onMounted, ref } from 'vue'
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
</script>

<template>
  <p v-if="isLoading">날씨 정보를 불러오는 중입니다...</p>
  <p v-else-if="errorMessage">{{ errorMessage }}</p>
  <template v-else>
    <h2>{{ weatherDetail.name }}의 날씨 상세</h2>
    <h3>기온: {{ displayTemp(weatherDetail.temp) + configStore.unitSymbol }}</h3>
    <p>체감온도: {{ displayTemp(weatherDetail.feelsLike) + configStore.unitSymbol }}</p>
    <p>습도: {{ weatherDetail.humidity }}%</p>
    <p>상태: {{ weatherDetail.status }}</p>
    <h3>러닝 추천: {{ weatherDetail.running.grade }} · {{ weatherDetail.running.score }}점</h3>
    <p>{{ weatherDetail.running.message }}</p>
    <p>안전 경고: {{ weatherDetail.running.safetyWarnings.join(', ') || '없음' }}</p>
    <p>대기질: {{ weatherDetail.airQuality }} (AQI {{ weatherDetail.aqi }})</p>
    <p>초미세먼지(PM2.5): {{ weatherDetail.pm25 }} μg/m³</p>
    <p>미세먼지(PM10): {{ weatherDetail.pm10 }} μg/m³</p>
    <p>오존(O₃): {{ weatherDetail.ozone }} μg/m³</p>
    <p>평균 풍속: {{ weatherDetail.windSpeed }}m/s</p>
    <p>최대 돌풍: {{ weatherDetail.windGust }}m/s</p>
    <p>시정거리: {{ (weatherDetail.visibility / 1000).toFixed(1) }}km</p>
    <p>시간당 비·눈 양: {{ weatherDetail.precipitation }}mm</p>
    <p>향후 3시간 강수 확률: {{ weatherDetail.precipitationProbability }}%</p>
    <p>시간당 적설량: {{ weatherDetail.snow }}mm</p>
  </template>
  <br />
  <RouterLink to="/">홈으로</RouterLink>
</template>

<style scoped>
a {
  padding: 16px;
  background-color: antiquewhite;
  color: black;
  text-decoration: none;
  border-radius: 8px;
}
</style>

<script setup>
import axios from 'axios'
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import SearchBar from '../components/SearchBar.vue'
import WeatherCard from '../components/WeatherCard.vue'

import { computed, watch, watchEffect, ref, onMounted } from 'vue'
import { useCityListStore } from '@/stores/cityListStore.js'
import { calculateRunningScore } from '@/utils/runningScore.js'

const searchQuery = ref('')
const selectedCityInfo = ref('')

const OWM_KEY = 'b06c8e2135d8c4a27b4e67195a0416a9'
const OWM_URL = `https://api.openweathermap.org/data/2.5/weather`
const AIR_POLLUTION_URL = 'https://api.openweathermap.org/data/2.5/air_pollution'
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast'

const cityListStore = useCityListStore()
const weatherList = ref([])
const isLoading = ref(false)
const isAddingCity = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    weatherList.value = await Promise.all(
      cityListStore.cityList.map((city) => fetchCityWeather(city)),
    )
  } catch (error) {
    console.error(error)
    errorMessage.value = '날씨 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
})

const fetchCityWeather = async (city, currentWeather) => {
  const weatherRequest = currentWeather
    ? Promise.resolve({ data: currentWeather })
    : axios.get(OWM_URL, {
        params: { lat: city.lat, lon: city.lon, appid: OWM_KEY, units: 'metric', lang: 'kr' },
      })
  const [weatherResponse, airPollutionResponse, forecastResponse] = await Promise.all([
    weatherRequest,
    axios.get(AIR_POLLUTION_URL, { params: { lat: city.lat, lon: city.lon, appid: OWM_KEY } }),
    axios.get(FORECAST_URL, {
      params: { lat: city.lat, lon: city.lon, appid: OWM_KEY, units: 'metric', lang: 'kr', cnt: 1 },
    }),
  ])
  const weather = weatherResponse.data
  const air = airPollutionResponse.data.list[0]
  const forecast = forecastResponse.data.list[0] ?? {}
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

  return {
    id: weather.id,
    name: city.name,
    temp: weather.main.temp,
    status: weather.weather[0].description,
    running: calculateRunningScore(runningInputs),
  }
}
const filteredWeatherList = computed(() => {
  const matchWeatherList = weatherList.value.filter((weather) =>
    weather.name.includes(searchQuery.value),
  ) // searchQuery와 일치하는 애만 return
  return matchWeatherList
})

const showAddCityButton = computed(
  () =>
    !isLoading.value &&
    !errorMessage.value &&
    searchQuery.value.trim() !== '' &&
    filteredWeatherList.value.length === 0,
)

const updateQuery = (childQuery) => {
  searchQuery.value = childQuery
}

const addCity = async () => {
  isAddingCity.value = true

  try {
    const result = await cityListStore.addCity(searchQuery.value)

    if (result.status === 'not-found') {
      alert('OpenWeatherMap에서 해당 도시를 찾지 못했습니다.')
      return
    }
    if (result.status === 'duplicate') {
      alert('이미 추가된 도시입니다.')
      return
    }

    weatherList.value.push(await fetchCityWeather(result.city, result.weather))
    searchQuery.value = ''
  } catch (error) {
    console.error(error)
    alert('도시를 추가하지 못했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    isAddingCity.value = false
  }
}

const subjectParticle = (word) =>
  (word.charCodeAt(word.length - 1) - 0xac00) % 28 === 0 ? '가' : '이'

const statusMessage = ref('카드를 클릭하거나 검색해보세요.')
watch(selectedCityInfo, (newCity, oldCity) => {
  if (newCity === '') {
    statusMessage.value = '카드를 클릭하거나 검색해보세요.'
  } else statusMessage.value = newCity + subjectParticle(newCity) + ' 선택되었습니다.'
  console.log(oldCity + '에서 ' + newCity + '(으)로 도시가 변경되었습니다.')
})

watchEffect(() => {
  console.log(`현재 검색어 ${searchQuery.value}와 일치하는 데이터를 가져옵니다...`)
})
</script>

<template>
  <BaseDashboardCard>
    <h2>도시 검색</h2>
    <SearchBar :query="searchQuery" @update-query="updateQuery" />
    <p>검색 중인 도시: {{ searchQuery }}</p>
    <button v-if="showAddCityButton" :disabled="isAddingCity" @click="addCity">
      {{ isAddingCity ? '도시 추가 중...' : '도시 추가' }}
    </button>
  </BaseDashboardCard>
  <BaseDashboardCard>
    <h2>지역별 날씨 현황</h2>
    <p v-if="isLoading">날씨 정보를 불러오는 중입니다...</p>
    <p v-else-if="errorMessage">{{ errorMessage }}</p>
    <template v-else>
      <WeatherCard
        @weatherCardClickEvent="(city_name) => (selectedCityInfo = city_name)"
        v-for="weather in filteredWeatherList"
        :key="weather.id"
        :id="weather.id"
        :name="weather.name"
        :temp="weather.temp"
        :status="weather.status"
        :running="weather.running"
      />
    </template>
  </BaseDashboardCard>
  <div id="selectedCityBar" style="text-align: center">{{ statusMessage }}</div>
</template>

<style scoped></style>

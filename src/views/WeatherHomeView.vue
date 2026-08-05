<script setup>
import axios from 'axios'
import { ElAlert, ElButton } from 'element-plus'
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import SearchBar from '../components/SearchBar.vue'
import WeatherCard from '../components/WeatherCard.vue'

import { computed, watch, watchEffect, ref, onBeforeUnmount, onMounted } from 'vue'
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
const typedRunning = ref('')
const typingFrames = ['ㄷ', '다', '달', '달ㄹ', '달리', '달리ㄱ', '달리기']
let typingStartTimer
let typingTimer

onMounted(async () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reducedMotion) {
    typedRunning.value = typingFrames.at(-1)
  } else {
    typingStartTimer = window.setTimeout(() => {
      let frameIndex = 0
      typingTimer = window.setInterval(() => {
        typedRunning.value = typingFrames[frameIndex]
        frameIndex += 1

        if (frameIndex === typingFrames.length) {
          window.clearInterval(typingTimer)
        }
      }, 160)
    }, 1000)
  }

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

onBeforeUnmount(() => {
  window.clearTimeout(typingStartTimer)
  window.clearInterval(typingTimer)
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
  <section class="hero-section">
    <div class="hero-copy">
      <p class="eyebrow"><span></span> LIVE RUNNING CONDITIONS</p>
      <h1>
        오늘, <span class="typed-running">{{ typedRunning }}</span> <span>좋은</span
        ><br />날씨인가요?
      </h1>
      <p class="hero-description">
        기온과 바람, 대기질을 한눈에 확인하고<br class="desktop-break" />
        가장 좋은 러닝 타이밍을 찾아보세요.
      </p>
      <div class="hero-chips">
        <span><i class="fa-solid fa-bolt"></i> 실시간 날씨</span>
        <span><i class="fa-solid fa-shield-heart"></i> 러닝 안전 지수</span>
      </div>
    </div>
    <div class="hero-orbit" aria-hidden="true">
      <div class="orbit-ring orbit-ring--outer"></div>
      <div class="orbit-ring orbit-ring--inner"></div>
      <div class="orbit-core"><i class="fa-solid fa-person-running"></i></div>
      <span class="orbit-dot orbit-dot--one"></span>
      <span class="orbit-dot orbit-dot--two"></span>
    </div>
  </section>

  <BaseDashboardCard class="search-panel">
    <div class="section-heading search-heading">
      <div>
        <span class="section-kicker"
          ><i class="fa-solid fa-location-crosshairs"></i> FIND YOUR CITY</span
        >
        <h2>어디에서 달리시나요?</h2>
      </div>
      <p>도시를 검색하면 현재 러닝 컨디션을 계산해 드려요.</p>
    </div>
    <div class="search-row">
      <SearchBar :query="searchQuery" @update-query="updateQuery" />
      <ElButton
        v-if="showAddCityButton"
        class="add-city-button"
        :loading="isAddingCity"
        @click="addCity"
      >
        <i v-if="!isAddingCity" class="fa-solid fa-plus"></i>
        {{ isAddingCity ? '도시 추가 중...' : '도시 추가' }}
      </ElButton>
    </div>
    <p class="search-status">
      <i class="fa-solid fa-wave-square"></i>
      {{ searchQuery ? `“${searchQuery}” 검색 중` : '도시 이름을 입력해 러닝 날씨를 찾아보세요.' }}
    </p>
  </BaseDashboardCard>

  <BaseDashboardCard class="weather-panel">
    <div class="section-heading">
      <div>
        <span class="section-kicker"><i class="fa-solid fa-satellite-dish"></i> WEATHER NOW</span>
        <h2>지역별 러닝 날씨</h2>
      </div>
      <span class="live-indicator"><i></i> LIVE</span>
    </div>

    <ElAlert
      v-if="isLoading"
      class="weather-state-alert"
      title="날씨 정보를 불러오는 중입니다..."
      type="info"
      :closable="false"
      show-icon
    />
    <ElAlert
      v-else-if="errorMessage"
      class="weather-state-alert weather-state-alert--error"
      :title="errorMessage"
      type="error"
      :closable="false"
      show-icon
    />
    <div v-else class="weather-grid">
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
    </div>
  </BaseDashboardCard>

  <div id="selectedCityBar" class="selected-city-bar">
    <i class="fa-solid fa-circle-check"></i> {{ statusMessage }}
  </div>
</template>

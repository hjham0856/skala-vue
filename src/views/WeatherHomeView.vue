<script setup>
import axios from 'axios'
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import SearchBar from '../components/SearchBar.vue'
import WeatherCard from '../components/WeatherCard.vue'

import { computed, watch, watchEffect, ref, onMounted } from 'vue'

const searchQuery = ref('')
const selectedCityInfo = ref('')

const OWM_KEY = 'b06c8e2135d8c4a27b4e67195a0416a9'
const OWM_URL = `https://api.openweathermap.org/data/2.5/weather`

// TODO: pinia로 도시 목록 관리하기
const cityLocations = [
  { name: '서울', lat: 37.5665, lon: 126.978 },
  { name: '부산', lat: 35.1796, lon: 129.0756 },
  { name: '대구', lat: 35.8714, lon: 128.6014 },
  { name: '인천', lat: 37.4563, lon: 126.7052 },
  { name: '광주', lat: 35.1595, lon: 126.8526 },
  { name: '대전', lat: 36.3504, lon: 127.3845 },
  { name: '울산', lat: 35.5384, lon: 129.3114 },
  { name: '제주', lat: 33.4996, lon: 126.5312 },
]
const weatherList = ref([])

// TODO: 요청 중/실패 상태 표시
onMounted(async () => {
  for (let i = 0; i < 8; i++) {
    let weatherResponse = await axios.get(OWM_URL, {
      params: {
        lat: cityLocations[i].lat,
        lon: cityLocations[i].lon,
        appid: OWM_KEY,
        units: 'metric',
        lang: 'kr',
      },
    })

    weatherList.value.push({
      id: weatherResponse.data.id,
      name: cityLocations[i].name,
      temp: weatherResponse.data.main.temp,
      status: weatherResponse.data.weather[0].description,
    })
  }
})
const filteredWeatherList = computed(() => {
  const matchWeatherList = weatherList.value.filter((weather) =>
    weather.name.includes(searchQuery.value),
  ) // searchQuery와 일치하는 애만 return
  return matchWeatherList
})

const updateQuery = (childQuery) => {
  searchQuery.value = childQuery
}

const statusMessage = ref('카드를 클릭하거나 검색해보세요.')
watch(selectedCityInfo, (newCity, oldCity) => {
  if (newCity === '') {
    statusMessage.value = '카드를 클릭하거나 검색해보세요.'
  } else statusMessage.value = newCity + '이/가 선택되었습니다.'
  console.log(oldCity + '에서 ' + newCity + '로 도시가 변경되었습니다.')
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
  </BaseDashboardCard>
  <BaseDashboardCard>
    <h2>지역별 날씨 현황</h2>
    <WeatherCard
      @weatherCardClickEvent="(city_name) => (selectedCityInfo = city_name)"
      v-for="weather in filteredWeatherList"
      :key="weather.id"
      :id="weather.id"
      :name="weather.name"
      :temp="weather.temp"
      :status="weather.status"
    />
  </BaseDashboardCard>
  <div id="selectedCityBar" style="text-align: center">{{ statusMessage }}</div>
</template>

<style scoped></style>

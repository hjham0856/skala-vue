<script setup>
import axios from 'axios'
import BaseDashboardCard from '../components/BaseDashboardCard.vue'
import SearchBar from '../components/SearchBar.vue'
import WeatherCard from '../components/WeatherCard.vue'

import { computed, watch, watchEffect, ref, onMounted } from 'vue'
import { useCityListStore } from '@/stores/cityListStore.js'

const searchQuery = ref('')
const selectedCityInfo = ref('')

const OWM_KEY = 'b06c8e2135d8c4a27b4e67195a0416a9'
const OWM_URL = `https://api.openweathermap.org/data/2.5/weather`

const cityListStore = useCityListStore()
const weatherList = ref([])

// TODO: 요청 중/실패 상태 표시
onMounted(async () => {
  for (let i = 0; i < 8; i++) {
    let weatherResponse = await axios.get(OWM_URL, {
      params: {
        lat: cityListStore.cityList[i].lat,
        lon: cityListStore.cityList[i].lon,
        appid: OWM_KEY,
        units: 'metric',
        lang: 'kr',
      },
    })

    weatherList.value.push({
      id: weatherResponse.data.id,
      name: cityListStore.cityList[i].name,
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

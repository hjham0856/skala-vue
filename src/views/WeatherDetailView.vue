<script setup>
import { useCityListStore } from '@/stores/cityListStore'
import { useConfigStore } from '@/stores/configStore'
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const configStore = useConfigStore()

// Card에서 받아오는게 아니라 여기서 api 호출하는 방식
const OWM_KEY = 'b06c8e2135d8c4a27b4e67195a0416a9'
const OWM_URL =
  `https://api.openweathermap.org/data/2.5/weather` +
  `?id=${route.params.cityId}` +
  `&appid=${OWM_KEY}` +
  `&units=metric` +
  `&lang=kr`

const weatherDetail = ref({})
const isLoading = ref(false)
const errorMessage = ref('')

const cityListStore = useCityListStore()
const getName = (cityId) => {
  for (let city of cityListStore.cityList) {
    if (city.id === cityId) {
      return city.name
    }
  }
  return '어딘가'
}

onMounted(async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const weatherResponse = await axios(OWM_URL)
    console.log(weatherResponse)

    weatherDetail.value = {
      id: weatherResponse.data.id,
      // TODO: 한국어 도시이름
      name: getName(weatherResponse.data.id),
      temp: weatherResponse.data.main.temp,
      feelsLike: weatherResponse.data.main.feels_like,
      status: weatherResponse.data.weather[0].description,
      humidity: weatherResponse.data.main.humidity,
    }
    console.log(weatherDetail.value)
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

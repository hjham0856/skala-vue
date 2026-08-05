import axios from 'axios'
import { ref } from 'vue'
import { defineStore } from 'pinia'

const OWM_KEY = 'b06c8e2135d8c4a27b4e67195a0416a9'
const GEOCODING_URL = 'https://api.openweathermap.org/geo/1.0/direct'
const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather'

export const useCityListStore = defineStore('cityList', () => {
  const cityList = ref([
    { id: 1835848, name: '서울', lat: 37.5665, lon: 126.978 },
    { id: 1838519, name: '부산', lat: 35.1796, lon: 129.0756 },
    { id: 1835329, name: '대구', lat: 35.8714, lon: 128.6014 },
    { id: 1843564, name: '인천', lat: 37.4563, lon: 126.7052 },
    { id: 1832973, name: '광주', lat: 35.1595, lon: 126.8526 },
    { id: 1835224, name: '대전', lat: 36.3504, lon: 127.3845 },
    { id: 1833747, name: '울산', lat: 35.5384, lon: 129.3114 },
    { id: 1846266, name: '제주', lat: 33.4996, lon: 126.5312 },
  ])

  const addCity = async (searchTerm) => {
    const query = searchTerm.trim()
    if (!query) return { status: 'not-found' }

    const geocodingResponse = await axios.get(GEOCODING_URL, {
      params: {
        q: query,
        limit: 1,
        appid: OWM_KEY,
      },
    })
    const location = geocodingResponse.data[0]

    if (!location) return { status: 'not-found' }

    const weatherResponse = await axios.get(WEATHER_URL, {
      params: {
        lat: location.lat,
        lon: location.lon,
        appid: OWM_KEY,
        units: 'metric',
        lang: 'kr',
      },
    })
    const city = {
      id: weatherResponse.data.id,
      name: `${query}(${location.name})`,
      lat: location.lat,
      lon: location.lon,
    }

    if (cityList.value.some((savedCity) => savedCity.id === city.id)) {
      return { status: 'duplicate' }
    }

    cityList.value.push(city)
    return { status: 'added', city, weather: weatherResponse.data }
  }

  return { cityList, addCity }
})

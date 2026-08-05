import axios from 'axios'
import { ref } from 'vue'
import { defineStore } from 'pinia'

const OWM_KEY = 'b06c8e2135d8c4a27b4e67195a0416a9'
const GEOCODING_URL = 'https://api.openweathermap.org/geo/1.0/direct'
const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather'

export const useCityListStore = defineStore('cityList', () => {
  const cityList = ref([
    { id: 1835848, name: '서울' },
    { id: 1838519, name: '부산' },
    { id: 1843564, name: '인천' },
    { id: 1846266, name: '제주' },
    { id: 2158177, name: '멜버른' },
    { id: 3333229, name: '에든버러' },
    { id: 2179537, name: '웰링턴' },
    { id: 3416900, name: '레이캬비크' },
    { id: 7302538, name: '케이프타운' },
    { id: 6693229, name: '부에노스아이레스' },
    { id: 3874787, name: '푼타아레나스' },
    { id: 1546102, name: '남극' },
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

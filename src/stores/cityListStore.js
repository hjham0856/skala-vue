import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCityListStore = defineStore('cityList', () => {
  const cityList = ref([
    { name: '서울', lat: 37.5665, lon: 126.978 },
    { name: '부산', lat: 35.1796, lon: 129.0756 },
    { name: '대구', lat: 35.8714, lon: 128.6014 },
    { name: '인천', lat: 37.4563, lon: 126.7052 },
    { name: '광주', lat: 35.1595, lon: 126.8526 },
    { name: '대전', lat: 36.3504, lon: 127.3845 },
    { name: '울산', lat: 35.5384, lon: 129.3114 },
    { name: '제주', lat: 33.4996, lon: 126.5312 },
  ])

  // TODO: 도시 추가?

  // TODO: 좌표 하드코딩 대신 geocoding으로 도시 이름으로 좌표 불러오기? computed?
  // https://openweathermap.org/api/geocoding-api?collection=other#direct 참고

  return { cityList }
})

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  id: Number,
  name: String,
  temp: Number,
  status: String,
  running: Object,
})
const emit = defineEmits(['weatherCardClickEvent'])

const clickEvent = () => emit('weatherCardClickEvent', props.name)

import { useConfigStore } from '@/stores/configStore'
const configStore = useConfigStore()

const displayTemp = computed(() => {
  const rawTemp = props.temp // 기본 원본 데이터는 섭씨 숫자
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32) // 화씨 변환 연산
  }
  return rawTemp // 'celsius'일 때는 원본 그대로 반환
})
</script>

<template>
  <div id="weatherCard" @click="clickEvent">
    <p>{{ name }}({{ status }})</p>
    <p>현재 기온: {{ displayTemp + configStore.unitSymbol }}</p>
    <p v-if="running">러닝 추천: {{ running.grade }} · {{ running.score }}점</p>
    <p v-if="running">{{ running.message }}</p>
    <button style="padding: 8px" @click.stop="router.push('/weather/' + id)">상세보기</button>
    <p v-if="temp >= 25">더움</p>
    <p v-else>선선함</p>
  </div>
</template>

<style scoped>
div {
  padding: 8px;
  margin: 8px;
  border: black 1px dashed;
}
</style>

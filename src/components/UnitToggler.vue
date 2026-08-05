<script setup>
import { useConfigStore } from '@/stores/configStore'
const configStore = useConfigStore()
</script>

<template>
  <button class="unit-button" aria-label="섭씨와 화씨 전환" @click="configStore.toggleUnit">
    <i class="fa-solid fa-temperature-half"></i>
    <span>{{ configStore.unitSymbol }}</span>
    <i class="fa-solid fa-repeat unit-swap"></i>
  </button>
</template>

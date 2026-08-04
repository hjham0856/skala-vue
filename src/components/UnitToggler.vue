<script setup>
import { useConfigStore } from '@/stores/configStore'
const configStore = useConfigStore()
</script>

<template>
  <button @click="configStore.toggleUnit">섭씨/화씨</button>
</template>

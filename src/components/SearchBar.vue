<script setup>
defineProps({
  query: String,
})

const emit = defineEmits(['update-query'])
</script>

<template>
  <input
    type="text"
    @input="emit('update-query', $event.target.value)"
    placeholder="검색할 도시 이름 입력"
  />
</template>

<style scoped></style>

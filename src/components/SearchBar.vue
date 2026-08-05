<script setup>
defineProps({
  query: String,
})

const emit = defineEmits(['update-query'])
</script>

<template>
  <label class="search-field">
    <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
    <input
      type="text"
      @input="emit('update-query', $event.target.value)"
      placeholder="도시 이름을 검색해 보세요"
      aria-label="도시 검색"
    />
    <span class="search-shortcut" aria-hidden="true">CITY</span>
  </label>
</template>

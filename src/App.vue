<script setup>
import UnitToggler from './components/UnitToggler.vue'
</script>

<template>
  <h1>RunnerWeather</h1>
  <nav class="navigation">
    <span class="router-link">
      <RouterLink to="/">Home</RouterLink> &nbsp; <RouterLink to="/about">About</RouterLink>
    </span>
    <span class="unit-toggler">
      <UnitToggler />
    </span>
  </nav>

  <RouterView />
</template>

<style scoped>
nav {
  padding: 8px;
  background-color: antiquewhite;
  display: flex;
}
.unit-toggler {
  margin-left: auto;
}
</style>

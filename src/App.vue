<script setup>
import UnitToggler from './components/UnitToggler.vue'
</script>

<template>
  <div class="app-shell">
    <header class="app-header glass-panel">
      <RouterLink class="brand" to="/" aria-label="RunnerWeather 홈">
        <span class="brand-mark"><i class="fa-solid fa-person-running"></i></span>
        <span class="brand-copy">
          <strong>RunnerWeather</strong>
          <small>RUN WITH THE SKY</small>
        </span>
      </RouterLink>

      <nav class="navigation" aria-label="주요 메뉴">
        <div class="nav-links">
          <RouterLink to="/"><i class="fa-solid fa-cloud-sun"></i><span>날씨</span></RouterLink>
          <RouterLink to="/about"><i class="fa-solid fa-circle-info"></i><span>소개</span></RouterLink>
        </div>
        <UnitToggler class="unit-toggler" />
      </nav>
    </header>

    <main class="page-content">
      <RouterView />
    </main>

    <footer class="app-footer">
      <span><i class="fa-solid fa-location-dot"></i> Your pace, your weather</span>
      <span>RunnerWeather</span>
    </footer>
  </div>
</template>

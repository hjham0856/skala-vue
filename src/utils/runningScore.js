const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))

const temperatureScore = (feelsLike) => {
  if (feelsLike >= 5 && feelsLike <= 15) return 100
  if ((feelsLike >= 0 && feelsLike < 5) || (feelsLike > 15 && feelsLike <= 20)) return 90
  if ((feelsLike >= -5 && feelsLike < 0) || (feelsLike > 20 && feelsLike <= 24)) return 75
  if ((feelsLike >= -10 && feelsLike < -5) || (feelsLike > 24 && feelsLike <= 28)) return 55
  if ((feelsLike >= -15 && feelsLike < -10) || (feelsLike > 28 && feelsLike <= 31)) return 30
  return feelsLike < -15 ? 0 : 15
}

const humidityScore = (humidity, temp) => {
  let score = 20
  if (humidity >= 30 && humidity <= 60) score = 100
  else if ((humidity >= 20 && humidity < 30) || (humidity > 60 && humidity <= 70)) score = 85
  else if (humidity > 70 && humidity <= 80) score = 65
  else if (humidity > 80 && humidity <= 90) score = 40

  return clamp(score - (temp >= 28 && humidity >= 80 ? 20 : 0))
}

const precipitationScore = (precipitation, probability) => {
  let score = 0
  if (precipitation === 0) score = 100
  else if (precipitation <= 0.5) score = 90
  else if (precipitation <= 2) score = 70
  else if (precipitation <= 5) score = 40
  else if (precipitation <= 10) score = 15

  const probabilityPenalty = probability < 30 ? 0 : probability < 60 ? 5 : probability < 80 ? 10 : 15
  return clamp(score - probabilityPenalty)
}

const windScore = (speed, gust) => {
  let score = 10
  if (speed <= 2) score = 95
  else if (speed <= 4) score = 100
  else if (speed <= 6) score = 85
  else if (speed <= 8) score = 65
  else if (speed <= 10) score = 40

  const gustPenalty = gust >= 15 ? 25 : gust >= 10 ? 10 : 0
  return clamp(score - gustPenalty)
}

const airQualityScore = (aqi) => ({ 1: 100, 2: 80, 3: 35, 4: 0, 5: 0 })[aqi] ?? 80

const visibilitySurfaceScore = ({ visibility, snow, icingPossible }) => {
  let score = 10
  if (visibility >= 10000) score = 100
  else if (visibility >= 5000) score = 90
  else if (visibility >= 1000) score = 70
  else if (visibility >= 500) score = 40

  if (snow > 0) score -= 20
  if (icingPossible) score -= 30
  return clamp(score)
}

const runningRecommendation = (score) => {
  if (score >= 85) return { grade: '매우 좋음', message: '달리기 좋은 날씨입니다.' }
  if (score >= 70) return { grade: '좋음', message: '무난하게 달리기 좋습니다.' }
  if (score >= 50) return { grade: '보통', message: '날씨 조건에 맞게 강도를 조절하세요.' }
  if (score >= 30) return { grade: '나쁨', message: '짧고 가벼운 러닝만 권장합니다.' }
  return { grade: '매우 나쁨', message: '실내 운동을 권장합니다.' }
}

export const calculateRunningScore = (weather) => {
  const precipitation = weather.rain + weather.snow
  const thunderstorm = weather.weatherCode >= 200 && weather.weatherCode < 300
  const heavyRain = weather.rain > 10
  const icingPossible = weather.temp <= 0 && (precipitation > 0 || weather.humidity >= 80)
  const severeHeat = weather.feelsLike > 31
  const heavySnow = weather.snow >= 5

  const scores = {
    temperature: temperatureScore(weather.feelsLike),
    humidity: humidityScore(weather.humidity, weather.temp),
    airQuality: airQualityScore(weather.aqi),
    precipitation: precipitationScore(precipitation, weather.precipitationProbability),
    wind: windScore(weather.windSpeed, weather.windGust),
    visibilitySurface: visibilitySurfaceScore({ visibility: weather.visibility, snow: weather.snow, icingPossible }),
  }

  const baseScore =
    scores.temperature * 0.3 +
    scores.humidity * 0.2 +
    scores.airQuality * 0.2 +
    scores.precipitation * 0.12 +
    scores.wind * 0.1 +
    scores.visibilitySurface * 0.08

  let scoreCap = 100
  if (thunderstorm || heavyRain) scoreCap = 0
  if (icingPossible || severeHeat || weather.visibility < 500) scoreCap = Math.min(scoreCap, 20)
  if (heavySnow || weather.windGust >= 20) scoreCap = Math.min(scoreCap, 10)

  const score = Math.round(Math.min(baseScore, scoreCap))
  const safetyWarnings = [
    thunderstorm && '낙뢰·뇌우',
    heavyRain && '강한 비',
    icingPossible && '도로 결빙 가능성',
    severeHeat && '심각한 열 스트레스',
    weather.visibility < 500 && '시정 500m 미만',
    heavySnow && '폭설 가능성',
    weather.windGust >= 20 && '돌풍 20m/s 이상',
  ].filter(Boolean)

  return {
    score,
    baseScore: Math.round(baseScore),
    scores,
    safetyWarnings,
    ...runningRecommendation(score),
  }
}

export const airQualityLabel = (aqi) => ({ 1: '좋음', 2: '보통', 3: '나쁨', 4: '매우 나쁨', 5: '매우 나쁨' })[aqi] ?? '정보 없음'

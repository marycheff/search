import { API_CONFIG } from "./config.js"

export async function getMovieFromKinopoisk(movieName) {
   const options = {
      method: "GET",
      headers: {
         accept: "application/json",
         "X-API-KEY": API_CONFIG.KINOPOISK_API_KEY,
      },
   }

   let apiUrl
   if (!isNaN(movieName)) {
      apiUrl = `${API_CONFIG.KINOPOISK_BASE_URL}/${encodeURIComponent(movieName)}`
   } else {
      apiUrl = `${API_CONFIG.KINOPOISK_BASE_URL}/search?page=1&limit=1&query=${encodeURIComponent(movieName)}`
   }

   const response = await fetch(apiUrl, options)
   if (!response.ok) {
      throw new Error("Ошибка при запросе к API Kinopoisk")
   }

   const data = await response.json()
   const movies = data.docs ? data.docs : [data]

   if (!movies || movies.length === 0) {
      throw new Error("Фильм не найден")
   }

   return movies[0]
}

export async function fetchKinoboxSources(movieData) {
   const apiURL = new URL(API_CONFIG.KINOBOX_API)

   if (movieData.kinopoisk) {
      apiURL.searchParams.set("kinopoisk", movieData.kinopoisk)
   }

   if (movieData.title) {
      apiURL.searchParams.set("title", movieData.title)
   }

   const request = await fetch(apiURL, { method: "GET" })
   if (!request.ok || request?.status !== 200) {
      throw new Error(`Запрос к Kinobox API завершился с ошибкой ${request.status}`)
   }

   let response = await request.json()
   if (typeof response !== "object" || !Array.isArray(response?.data) || response === null) {
      throw new Error(`Неверный формат ответа от API: "${typeof response}"`)
   }

   let playersData = response.data
   playersData = playersData.filter((player) => player?.iframeUrl && player?.success && player?.type)

   return playersData
}

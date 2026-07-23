import { API_CONFIG } from "./config.js"

// Поиск фильмов по названию или ID Кинопоиска.
// Если movieName — число, запрос идёт по ID, иначе по тексту.
export async function searchMovies(movieName, limit = 5) {
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
      apiUrl = `${API_CONFIG.KINOPOISK_BASE_URL}/search?page=1&limit=${limit}&query=${encodeURIComponent(movieName)}`
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

   return movies
}

// Быстрый запрос одного фильма (первый результат поиска)
export async function getMovieFromKinopoisk(movieName) {
   const movies = await searchMovies(movieName, 1)
   return movies[0]
}

// Запрашивает список плееров через Kinobox API по ID или названию
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
   if (typeof response !== "object" || response === null) {
      throw new Error(`Неверный формат ответа от API: "${typeof response}"`)
   }

   const rawPlayersData = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.data)
        ? response.data.data
        : null
   if (!rawPlayersData) {
      throw new Error(`Неверный формат ответа от API: "data" не является массивом`)
   }

   // Удаляет обратные кавычки по краям строки URL
   const normalizeUrl = (value) => {
      if (typeof value !== "string") return null
      const trimmed = value.trim()
      if (!trimmed) return null
      return trimmed.replace(/^`+/, "").replace(/`+$/, "").trim() || null
   }

   const playersData = rawPlayersData
      .map((player) => {
         const translations = Array.isArray(player?.translations)
            ? player.translations
                 .map((t) => ({ ...t, iframeUrl: normalizeUrl(t?.iframeUrl) }))
                 .filter((t) => t?.iframeUrl)
            : []

         return {
            ...player,
            iframeUrl: normalizeUrl(player?.iframeUrl),
            translations,
         }
      })
      .filter(
         (player) => player?.type && player?.success !== false && (player?.iframeUrl || player?.translations?.length),
      )

   return playersData
}

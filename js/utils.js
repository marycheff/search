import { STORAGE_KEYS } from "./config.js"

// Устанавливает заголовок страницы
export function updatePageTitle(movieName) {
   document.title = movieName
}

// Возвращает сохранённое название фильма
export function getStoredMovieName() {
   return localStorage.getItem(STORAGE_KEYS.MOVIE_NAME)
}

// Сохраняет название фильма
export function setStoredMovieName(movieName) {
   localStorage.setItem(STORAGE_KEYS.MOVIE_NAME, movieName)
}

// Возвращает настройку показа постера (по умолчанию true)
export function getShowPoster() {
	const val = localStorage.getItem(STORAGE_KEYS.SHOW_POSTER)
	return val === null ? true : val === "true"
}

// Сохраняет настройку показа постера
export function setShowPoster(value) {
	localStorage.setItem(STORAGE_KEYS.SHOW_POSTER, value ? "true" : "false")
}

// Возвращает настройку вертикальных вкладок плеера
export function getVerticalTabs() {
	const val = localStorage.getItem(STORAGE_KEYS.VERTICAL_TABS)
	return val === "true"
}

// Сохраняет настройку вертикальных вкладок
export function setVerticalTabs(value) {
	localStorage.setItem(STORAGE_KEYS.VERTICAL_TABS, value ? "true" : "false")
}

// Возвращает историю просмотров из localStorage
export function getWatchHistory() {
   try {
      const data = localStorage.getItem(STORAGE_KEYS.WATCH_HISTORY)
      return data ? JSON.parse(data) : []
   } catch {
      return []
   }
}

// Добавляет фильм в историю (без дубликатов, макс. 10 записей)
export function addToWatchHistory(movie) {
   let history = getWatchHistory()
   history = history.filter((item) => item.name !== movie.name)
   history.unshift({
      name: movie.name,
      year: movie.year,
      id: movie.id,
      logo: movie.logo?.previewUrl || null,
   })
   if (history.length > 10) history = history.slice(0, 10)
   localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(history))
   return history
}

// Очищает историю просмотров
export function clearWatchHistory() {
   localStorage.removeItem(STORAGE_KEYS.WATCH_HISTORY)
}

// Удаляет query-параметры из адресной строки
export function cleanURL() {
   const url = new URL(window.location)
   if (url.search) {
      window.history.replaceState({}, document.title, url.pathname)
   }
}

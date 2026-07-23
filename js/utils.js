import { STORAGE_KEYS } from "./config.js"

export function updatePageTitle(movieName) {
   document.title = movieName
}

export function getStoredMovieName() {
   return localStorage.getItem("movieName")
}

export function setStoredMovieName(movieName) {
   localStorage.setItem("movieName", movieName)
}

export function getShowPoster() {
	const val = localStorage.getItem(STORAGE_KEYS.SHOW_POSTER)
	return val === null ? true : val === "true"
}

export function setShowPoster(value) {
	localStorage.setItem(STORAGE_KEYS.SHOW_POSTER, value ? "true" : "false")
}

export function getVerticalTabs() {
	const val = localStorage.getItem(STORAGE_KEYS.VERTICAL_TABS)
	return val === "true"
}

export function setVerticalTabs(value) {
	localStorage.setItem(STORAGE_KEYS.VERTICAL_TABS, value ? "true" : "false")
}

export function getWatchHistory() {
   try {
      const data = localStorage.getItem(STORAGE_KEYS.WATCH_HISTORY)
      return data ? JSON.parse(data) : []
   } catch {
      return []
   }
}

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

export function clearWatchHistory() {
   localStorage.removeItem(STORAGE_KEYS.WATCH_HISTORY)
}

// Функция для очистки URL от параметров
export function cleanURL() {
   const url = new URL(window.location)
   if (url.search) {
      window.history.replaceState({}, document.title, url.pathname)
   }
}

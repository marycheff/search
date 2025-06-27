export function updatePageTitle(movieName) {
   document.title = movieName
}

export function getStoredMovieName() {
   return localStorage.getItem("movieName")
}

export function setStoredMovieName(movieName) {
   localStorage.setItem("movieName", movieName)
}

// Функция для очистки URL от параметров
export function cleanURL() {
   const url = new URL(window.location)

   if (url.search) {
      window.history.replaceState({}, document.title, url.pathname)
   }
}

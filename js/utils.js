export function updatePageTitle(movieName) {
   document.title = movieName
}

export function getStoredMovieName() {
   return localStorage.getItem("movieName")
}

export function setStoredMovieName(movieName) {
   localStorage.setItem("movieName", movieName)
}

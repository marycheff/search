import { getMovieFromKinopoisk, fetchKinoboxSources } from "./api.js"
import { createPlayerHTML, setupSourceButtons } from "./player.js"
import { updatePageTitle, getStoredMovieName, setStoredMovieName } from "./utils.js"
import { showSkeletonLoader } from "./loader.js"


document.addEventListener("DOMContentLoaded", function () {

   const movieNameInput = document.getElementById("movieName")
   const searchResultsElement = document.getElementById("searchResults")
   const movieSearchForm = document.getElementById("movieSearchForm")
   const storedMovieName = getStoredMovieName()

   if (storedMovieName) {
      movieNameInput.value = storedMovieName
      performMovieSearch(storedMovieName)
   }

   async function performMovieSearch(movieName) {
      try {
         searchResultsElement.innerHTML = showSkeletonLoader()

         const movie = await getMovieFromKinopoisk(movieName)

         updatePageTitle(movie.name)

         const movieData = {
            kinopoisk: movie.id,
            title: movie.name,
         }

         const sources = await fetchKinoboxSources(movieData)

         if (sources.length === 0) {
            searchResultsElement.innerHTML = `<h2>Плееры для фильма "${movieName}" не найдены.</h2>`
            return
         }

         const playerHTML = createPlayerHTML(sources, movie)
         searchResultsElement.innerHTML = playerHTML

         setupSourceButtons(sources)
      } catch (error) {
         console.error("Ошибка при поиске фильма:", error)

         if (error.message === "Фильм не найден") {
            searchResultsElement.innerHTML = `<h2>Фильм "${movieName}" не найден.</h2>`
         } else {
            searchResultsElement.innerHTML = `<p>Произошла ошибка при поиске: ${error.message}</p>`
         }
      }
   }

   movieSearchForm.addEventListener("submit", (event) => {
      event.preventDefault()
      const movieName = movieNameInput.value.trim()

      if (!movieName) {
         alert("Введите название фильма")
         return
      }

      setStoredMovieName(movieName)
      performMovieSearch(movieName)
   })
})

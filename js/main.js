import { fetchKinoboxSources, getMovieFromKinopoisk } from "./api.js"
import { showSkeletonLoader } from "./loader.js"
import { createPlayerHTML, setupSourceButtons } from "./player.js"
import { getStoredMovieName, setStoredMovieName, updatePageTitle } from "./utils.js"

document.addEventListener("DOMContentLoaded", function () {
   const movieNameInput = document.getElementById("movieName")
   const searchResultsElement = document.getElementById("searchResults")
   const movieSearchForm = document.getElementById("movieSearchForm")
   const emptyState = document.getElementById("emptyState")

   cleanURL()

   const storedMovieName = getStoredMovieName()

   if (storedMovieName) {
      movieNameInput.value = storedMovieName
      hideEmptyState()
      performMovieSearch(storedMovieName)
   }

   function showEmptyState() {
      if (emptyState) emptyState.style.display = "flex"
   }

   function hideEmptyState() {
      if (emptyState) emptyState.style.display = "none"
   }

   async function performMovieSearch(movieName) {
      try {
         hideEmptyState()
         searchResultsElement.innerHTML = showSkeletonLoader()

         const movie = await getMovieFromKinopoisk(movieName)

         updatePageTitle(movie.name)

         const movieData = {
            kinopoisk: movie.id,
            title: movie.name,
         }

         const sources = await fetchKinoboxSources(movieData)

         if (sources.length === 0) {
            searchResultsElement.innerHTML = `<div class="empty-state" style="display:flex"><h2 class="empty-title" style="color:var(--text-muted);">Плееры для фильма "${movieName}" не найдены.</h2></div>`
            return
         }

         const playerHTML = createPlayerHTML(sources, movie)
         searchResultsElement.innerHTML = playerHTML

         setupSourceButtons(sources)
      } catch (error) {
         console.error("Ошибка при поиске фильма:", error)

         if (error.message === "Фильм не найден") {
            searchResultsElement.innerHTML = `<div class="empty-state" style="display:flex"><h2 class="empty-title" style="color:var(--text-muted);">Фильм "${movieName}" не найден.</h2></div>`
         } else {
            searchResultsElement.innerHTML = `<div class="empty-state" style="display:flex;padding:40px 20px;"><p class="empty-desc" style="color:var(--red);">Произошла ошибка при поиске: ${error.message}</p></div>`
         }
      }
   }

   movieSearchForm.addEventListener("submit", handleFormSubmit)

   const submitButton =
      movieSearchForm.querySelector('button[type="submit"]') || movieSearchForm.querySelector('input[type="submit"]')
   if (submitButton) {
      submitButton.addEventListener("click", handleFormSubmit)
   }

   movieNameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
         handleFormSubmit(event)
      }
   })

   function handleFormSubmit(event) {
      event.preventDefault()
      event.stopPropagation()

      const movieName = movieNameInput.value.trim()

      if (!movieName) {
         alert("Введите название фильма")
         return false
      }

      setStoredMovieName(movieName)
      hideEmptyState()
      performMovieSearch(movieName)

      return false
   }

   function cleanURL() {
      const url = new URL(window.location)
      if (url.search) {
         window.history.replaceState({}, document.title, url.pathname)
      }
   }
})

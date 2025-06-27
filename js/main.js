import { fetchKinoboxSources, getMovieFromKinopoisk } from "./api.js"
import { showSkeletonLoader } from "./loader.js"
import { createPlayerHTML, setupSourceButtons } from "./player.js"
import { getStoredMovieName, setStoredMovieName, updatePageTitle } from "./utils.js"

document.addEventListener("DOMContentLoaded", function () {
   const movieNameInput = document.getElementById("movieName")
   const searchResultsElement = document.getElementById("searchResults")
   const movieSearchForm = document.getElementById("movieSearchForm")

   cleanURL()

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

   movieSearchForm.addEventListener("submit", handleFormSubmit)

   // Дополнительная защита - обработчик на кнопку
   const submitButton =
      movieSearchForm.querySelector('button[type="submit"]') || movieSearchForm.querySelector('input[type="submit"]')
   if (submitButton) {
      submitButton.addEventListener("click", handleFormSubmit)
   }

   // Обработчик нажатия Enter в поле ввода
   movieNameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
         handleFormSubmit(event)
      }
   })

   function handleFormSubmit(event) {
      // Предотвращаем стандартное поведение формы
      event.preventDefault()
      event.stopPropagation()

      const movieName = movieNameInput.value.trim()

      if (!movieName) {
         alert("Введите название фильма")
         return false
      }

      setStoredMovieName(movieName)
      performMovieSearch(movieName)

      return false
   }

   // Функция для очистки URL от параметров
   function cleanURL() {
      const url = new URL(window.location)

      // Если в URL есть параметры, очищаем их
      if (url.search) {
         // Заменяем текущий URL на чистый без параметров
         window.history.replaceState({}, document.title, url.pathname)
      }
   }
})

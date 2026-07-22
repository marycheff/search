import { fetchKinoboxSources, getMovieFromKinopoisk } from "./api.js"
import { showSkeletonLoader } from "./loader.js"
import { createPlayerHTML, setupSourceButtons } from "./player.js"
import { getStoredMovieName, setStoredMovieName, updatePageTitle, getWatchHistory, addToWatchHistory, clearWatchHistory, getShowPoster, setShowPoster } from "./utils.js"

document.addEventListener("DOMContentLoaded", function () {
   const movieNameInput = document.getElementById("movieName")
   const searchResultsElement = document.getElementById("searchResults")
   const movieSearchForm = document.getElementById("movieSearchForm")
   const emptyState = document.getElementById("emptyState")
   const historyButton = document.getElementById("historyButton")
   const historyDropdown = document.getElementById("historyDropdown")
   const historyList = document.getElementById("historyList")
   const clearHistoryBtn = document.getElementById("clearHistoryBtn")
   const searchClearBtn = document.getElementById("searchClear")
   const historyWrapper = document.querySelector(".history-wrapper")
   const settingsButton = document.getElementById("settingsButton")
   const settingsDropdown = document.getElementById("settingsDropdown")
   const posterToggle = document.getElementById("posterToggle")
   const settingsWrapper = document.querySelector(".settings-wrapper")

   cleanURL()
   initSearchClear()
   initHistory()
   initSettings()

   const storedMovieName = getStoredMovieName()

   if (storedMovieName) {
      movieNameInput.value = storedMovieName
      hideEmptyState()
      performMovieSearch(storedMovieName)
   }

   function initSearchClear() {
      function toggleClearBtn() {
         if (movieNameInput.value.trim()) {
            searchClearBtn.classList.add("visible")
         } else {
            searchClearBtn.classList.remove("visible")
         }
      }

      movieNameInput.addEventListener("input", toggleClearBtn)

      const searchWrapper = document.querySelector(".search-wrapper")
      if (searchWrapper) {
         searchWrapper.addEventListener("click", toggleClearBtn)
      }

      toggleClearBtn()

      searchClearBtn.addEventListener("click", function () {
         movieNameInput.value = ""
         searchClearBtn.classList.remove("visible")
         searchResultsElement.innerHTML = ""
         showEmptyState()
         movieNameInput.focus()
         setStoredMovieName("")
      })
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
         addToWatchHistory(movie)
         renderHistory()

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

   function renderHistory() {
      const history = getWatchHistory()
      historyList.innerHTML = ""
      historyDropdown.classList.toggle("has-items", history.length > 0)

      history.forEach((item) => {
         const el = document.createElement("button")
         el.className = "history-item"
         el.innerHTML = `
            <span class="history-item-name">${item.name}</span>
            <span class="history-item-year">${item.year}</span>
         `
         el.addEventListener("click", () => {
            movieNameInput.value = item.name
            setStoredMovieName(item.name)
            hideEmptyState()
            performMovieSearch(item.name)
            closeHistory()
         })
         historyList.appendChild(el)
      })
   }

   function openHistory() {
      historyDropdown.classList.add("open")
   }

   function closeHistory() {
      historyDropdown.classList.remove("open")
   }

   function toggleHistory() {
      if (historyDropdown.classList.contains("open")) {
         closeHistory()
      } else {
         settingsDropdown.classList.remove("open")
         renderHistory()
         openHistory()
      }
   }

   function initHistory() {
      historyButton.addEventListener("click", (e) => {
         e.stopPropagation()
         toggleHistory()
      })

      clearHistoryBtn.addEventListener("click", (e) => {
         e.stopPropagation()
         clearWatchHistory()
         renderHistory()
      })

      document.addEventListener("click", (e) => {
         if (!historyWrapper.contains(e.target)) {
            closeHistory()
         }
      })

      renderHistory()
   }

   function initSettings() {
      // Restore toggle state
      posterToggle.checked = getShowPoster()

      // Toggle settings dropdown
      settingsButton.addEventListener("click", (e) => {
         e.stopPropagation()
         closeHistory()
         settingsDropdown.classList.toggle("open")
      })

      // Poster toggle changes
      posterToggle.addEventListener("change", () => {
         const showPoster = posterToggle.checked
         setShowPoster(showPoster)

         // If there's an active search result with player, refresh it
         const playerContainer = document.querySelector(".player-container")
         if (playerContainer) {
            const movieName = movieNameInput.value.trim()
            if (movieName) {
               performMovieSearch(movieName)
            }
         }
      })

      // Close on outside click
      document.addEventListener("click", (e) => {
         if (settingsWrapper && !settingsWrapper.contains(e.target)) {
            settingsDropdown.classList.remove("open")
         }
      })
   }

   function cleanURL() {
      const url = new URL(window.location)
      if (url.search) {
         window.history.replaceState({}, document.title, url.pathname)
      }
   }
})

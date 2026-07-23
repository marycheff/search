import { showSkeletonLoader, showHeaderSkeleton, hideHeaderSkeleton } from "./loader.js"
import { createPlayerHTML, setupSourceButtons, renderMovieTitle } from "./player.js"
import { getStoredMovieName, setStoredMovieName, updatePageTitle, getWatchHistory, addToWatchHistory, clearWatchHistory, getShowPoster, setShowPoster, getVerticalTabs, setVerticalTabs } from "./utils.js"
import { searchMovies, fetchKinoboxSources } from "./api.js"

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
   const verticalTabsToggle = document.getElementById("verticalTabsToggle")
   const settingsWrapper = document.querySelector(".settings-wrapper")

   let currentMovies = null

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
         document.getElementById("headerMovieInfo").innerHTML = ""
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

   async function fetchSourcesForMovie(movie) {
      const movieData = { title: movie.name }
      if (movie.id) movieData.kinopoisk = movie.id
      if (movie.externalId?.kp) movieData.kinopoisk = movie.externalId.kp
      return await fetchKinoboxSources(movieData)
   }

   async function performMovieSearch(movieName) {
      try {
         hideEmptyState()
         document.getElementById("headerMovieInfo").innerHTML = ""
         showHeaderSkeleton()
         searchResultsElement.innerHTML = showSkeletonLoader()

         const movies = await searchMovies(movieName, 5)
         currentMovies = movies

         await selectMovie(movies, 0)
      } catch (error) {
         console.error("Ошибка при поиске фильма:", error)
         document.getElementById("headerMovieInfo").innerHTML = ""
         hideHeaderSkeleton()

         if (error.message === "Фильм не найден") {
            searchResultsElement.innerHTML = `<div class="empty-state" style="display:flex"><h2 class="empty-title" style="color:var(--text-muted);">Фильм "${movieName}" не найден.</h2></div>`
         } else {
            searchResultsElement.innerHTML = `<div class="empty-state" style="display:flex;padding:40px 20px;"><p class="empty-desc" style="color:var(--red);">Произошла ошибка при поиске: ${error.message}</p></div>`
         }
      }
   }

   const resultsButton = document.getElementById("resultsButton")
   const resultsDropdown = document.getElementById("resultsDropdown")
   const resultsList = document.getElementById("resultsList")

   async function selectMovie(movies, index) {
      const movie = movies[index]

      updatePageTitle(movie.name)
      addToWatchHistory(movie)
      renderHistory()

      renderMovieTitle(movie)

      searchResultsElement.innerHTML = showSkeletonLoader()

      const sources = await fetchSourcesForMovie(movie)

      if (sources.length === 0) {
         searchResultsElement.innerHTML = `<div class="empty-state" style="display:flex"><h2 class="empty-title" style="color:var(--text-muted);">Плееры для фильма "${movie.name}" не найдены.</h2></div>`
         return
      }

      searchResultsElement.innerHTML = createPlayerHTML(sources, movie)
      setupSourceButtons(sources)

      populateResultsDropdown(movies, index)
   }

   function populateResultsDropdown(movies, selectedIndex) {
      if (movies.length <= 1) {
         resultsButton.style.display = "none"
         return
      }

      resultsButton.style.display = ""
      resultsList.innerHTML = ""
      movies.forEach((m, i) => {
         if (i === selectedIndex) return
         const el = document.createElement("button")
         el.className = "result-item"
         el.dataset.index = i
         el.innerHTML = `<span class="result-item-name">${m.name}</span><span class="result-item-year">${m.year}</span>`
         el.addEventListener("click", () => {
            closeResultsDropdown()
            hideEmptyState()
            document.getElementById("headerMovieInfo").innerHTML = ""
            showHeaderSkeleton()
            searchResultsElement.innerHTML = showSkeletonLoader()
            selectMovie(currentMovies, i)
         })
         resultsList.appendChild(el)
      })
   }

   function openResultsDropdown() {
      resultsDropdown.classList.add("open")
   }

   function closeResultsDropdown() {
      resultsDropdown.classList.remove("open")
   }

    resultsButton.addEventListener("click", (e) => {
      e.stopPropagation()
      closeHistory()
      settingsDropdown.classList.remove("open")
      if (resultsDropdown.classList.contains("open")) {
         closeResultsDropdown()
      } else {
         openResultsDropdown()
      }
   })

   document.addEventListener("click", (e) => {
      const wrapper = document.querySelector(".results-wrapper")
      if (wrapper && !wrapper.contains(e.target)) {
         closeResultsDropdown()
      }
   })

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
         closeResultsDropdown()
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
      // Restore toggle states
      posterToggle.checked = getShowPoster()
      if (verticalTabsToggle) verticalTabsToggle.checked = getVerticalTabs()

      // Toggle settings dropdown
      settingsButton.addEventListener("click", (e) => {
         e.stopPropagation()
         closeHistory()
         closeResultsDropdown()
         settingsDropdown.classList.toggle("open")
      })

      // Poster toggle changes
      posterToggle.addEventListener("change", () => {
         const showPoster = posterToggle.checked
         setShowPoster(showPoster)

         const playerContainer = document.querySelector(".player-container")
         if (playerContainer) {
            const movieName = movieNameInput.value.trim()
            if (movieName) {
               performMovieSearch(movieName)
            }
         }
      })

      // Vertical tabs toggle changes
      if (verticalTabsToggle) {
         verticalTabsToggle.addEventListener("change", () => {
            setVerticalTabs(verticalTabsToggle.checked)

            const playerContainer = document.querySelector(".player-container")
            if (playerContainer) {
               const movieName = movieNameInput.value.trim()
               if (movieName) {
                  performMovieSearch(movieName)
               }
            }
         })
      }

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

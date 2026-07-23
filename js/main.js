import { showSkeletonLoader, showHeaderSkeleton, hideHeaderSkeleton } from "./loader.js"
import { createPlayerHTML, setupSourceButtons, renderMovieTitle } from "./player.js"
import { getStoredMovieName, setStoredMovieName, updatePageTitle, getWatchHistory, addToWatchHistory, clearWatchHistory, getShowPoster, setShowPoster, getVerticalTabs, setVerticalTabs, cleanURL } from "./utils.js"
import { searchMovies, fetchKinoboxSources } from "./api.js"

// При загрузке DOM инициализирует всё приложение: поиск, историю, настройки, обработчики событий
document.addEventListener("DOMContentLoaded", function () {
   // ── DOM-ссылки ──
   const movieNameInput = document.getElementById("movieName")
   const searchResultsElement = document.getElementById("searchResults")
   const movieSearchForm = document.getElementById("movieSearchForm")
   const headerMovieInfo = document.getElementById("headerMovieInfo")
   const emptyState = document.getElementById("emptyState")

   const historyButton = document.getElementById("historyButton")
   const historyDropdown = document.getElementById("historyDropdown")
   const historyList = document.getElementById("historyList")
   const clearHistoryBtn = document.getElementById("clearHistoryBtn")
   const historyWrapper = document.querySelector(".history-wrapper")

   const settingsButton = document.getElementById("settingsButton")
   const settingsDropdown = document.getElementById("settingsDropdown")
   const posterToggle = document.getElementById("posterToggle")
   const verticalTabsToggle = document.getElementById("verticalTabsToggle")
   const settingsWrapper = document.querySelector(".settings-wrapper")

   const searchClearBtn = document.getElementById("searchClear")

   const resultsButton = document.getElementById("resultsButton")
   const resultsDropdown = document.getElementById("resultsDropdown")
   const resultsList = document.getElementById("resultsList")

   // ── Состояние ──
   let currentMovies = null

   // ── Инициализация ──
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

   // ── Вспомогательные функции ──

    // Показывает состояние "пустой страницы" (заглушку при отсутствии поиска)
    function showEmptyState() {
      if (emptyState) emptyState.style.display = "flex"
   }

    // Скрывает состояние "пустой страницы"
    function hideEmptyState() {
      if (emptyState) emptyState.style.display = "none"
   }

    // Открывает выпадающий список результатов поиска
    function openResultsDropdown() {
      resultsDropdown.classList.add("open")
   }

    // Закрывает выпадающий список результатов поиска
    function closeResultsDropdown() {
      resultsDropdown.classList.remove("open")
   }

    // Открывает выпадающий список истории просмотров
    function openHistory() {
      historyDropdown.classList.add("open")
   }

    // Закрывает выпадающий список истории просмотров
    function closeHistory() {
      historyDropdown.classList.remove("open")
   }

    // Закрывает все открытые выпадающие списки (настройки, история, результаты)
    function closeAllDropdowns() {
      settingsDropdown.classList.remove("open")
      closeHistory()
      closeResultsDropdown()
   }

   // ── Основная логика ──

    // Получает список источников (плееров) для указанного фильма через API
    async function fetchSourcesForMovie(movie) {
      const movieData = { title: movie.name }
      if (movie.id) movieData.kinopoisk = movie.id
      if (movie.externalId?.kp) movieData.kinopoisk = movie.externalId.kp
      return await fetchKinoboxSources(movieData)
   }

    // Выбирает фильм по индексу из списка: обновляет заголовок, загружает плееры, заполняет список результатов
    async function selectMovie(movies, index) {
      const movie = movies[index]

      updatePageTitle(movie.name)
      addToWatchHistory(movie)
      renderHistory()

      renderMovieTitle(movie, headerMovieInfo)

      searchResultsElement.innerHTML = showSkeletonLoader()

      const sources = await fetchSourcesForMovie(movie)

      if (sources.length === 0) {
         searchResultsElement.innerHTML = `<div class="empty-state" style="display:flex"><h2 class="empty-title" style="color:var(--text-muted);">Плееры для фильма "${movie.name}" не найдены.</h2></div>`
         return
      }

      searchResultsElement.innerHTML = createPlayerHTML(movie)
      setupSourceButtons(sources)

      populateResultsDropdown(movies, index)
   }

    // Выполняет поиск фильма по названию, отображает скелетон-загрузку и автоматически выбирает первый результат
    async function performMovieSearch(movieName) {
      try {
         hideEmptyState()
         headerMovieInfo.innerHTML = ""
         showHeaderSkeleton()
         searchResultsElement.innerHTML = showSkeletonLoader()

         const movies = await searchMovies(movieName, 5)
         currentMovies = movies

         await selectMovie(movies, 0)
      } catch (error) {
         console.error("Ошибка при поиске фильма:", error)
         headerMovieInfo.innerHTML = ""
         hideHeaderSkeleton()

         if (error.message === "Фильм не найден") {
            searchResultsElement.innerHTML = `<div class="empty-state" style="display:flex"><h2 class="empty-title" style="color:var(--text-muted);">Фильм "${movieName}" не найден.</h2></div>`
         } else {
            searchResultsElement.innerHTML = `<div class="empty-state" style="display:flex;padding:40px 20px;"><p class="empty-desc" style="color:var(--red);">Произошла ошибка при поиске: ${error.message}</p></div>`
         }
      }
   }

    // Заполняет выпадающий список другими результатами поиска (кроме текущего выбранного)
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
            headerMovieInfo.innerHTML = ""
            showHeaderSkeleton()
            searchResultsElement.innerHTML = showSkeletonLoader()
            selectMovie(currentMovies, i)
         })
         resultsList.appendChild(el)
      })
   }

    // Обрабатывает отправку формы поиска: валидирует ввод, сохраняет запрос и запускает поиск
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

   // ── История просмотров ──

    // Отображает список последних просмотренных фильмов в выпадающем меню истории
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

    // Переключает видимость выпадающего списка истории (открыть / закрыть)
    function toggleHistory() {
      if (historyDropdown.classList.contains("open")) {
         closeHistory()
      } else {
         closeAllDropdowns()
         renderHistory()
         openHistory()
      }
   }

    // Инициализирует обработчики событий для кнопки истории, очистки и закрытия при клике вне меню
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

   // ── Очистка строки поиска ──

    // Инициализирует кнопку очистки поля ввода: показывает/скрывает её и очищает результаты поиска
    function initSearchClear() {
      function toggleClearBtn() {
         searchClearBtn.classList.toggle("visible", movieNameInput.value.trim() !== "")
      }

      movieNameInput.addEventListener("input", toggleClearBtn)
      toggleClearBtn()

      searchClearBtn.addEventListener("click", function () {
         movieNameInput.value = ""
         searchClearBtn.classList.remove("visible")
         searchResultsElement.innerHTML = ""
         headerMovieInfo.innerHTML = ""
         showEmptyState()
         movieNameInput.focus()
         setStoredMovieName("")
      })
   }

   // ── Настройки ──

    // Инициализирует выпадающее меню настроек: переключатели постера, вертикальных вкладок и повторный поиск при их изменении
    function initSettings() {
      posterToggle.checked = getShowPoster()
      if (verticalTabsToggle) verticalTabsToggle.checked = getVerticalTabs()

      settingsButton.addEventListener("click", (e) => {
         e.stopPropagation()
         closeAllDropdowns()
         settingsDropdown.classList.toggle("open")
      })

       // Выполняет повторный поиск текущего фильма при изменении настроек (если плеер уже открыт)
       function reSearchOnToggle() {
         const movieName = movieNameInput.value.trim()
         if (movieName && document.querySelector(".player-container")) {
            performMovieSearch(movieName)
         }
      }

      posterToggle.addEventListener("change", () => {
         setShowPoster(posterToggle.checked)
         reSearchOnToggle()
      })

      if (verticalTabsToggle) {
         verticalTabsToggle.addEventListener("change", () => {
            setVerticalTabs(verticalTabsToggle.checked)
            reSearchOnToggle()
         })
      }

      document.addEventListener("click", (e) => {
         if (settingsWrapper && !settingsWrapper.contains(e.target)) {
            settingsDropdown.classList.remove("open")
         }
      })
   }

   // ── Обработчики событий ──
   movieSearchForm.addEventListener("submit", handleFormSubmit)

   resultsButton.addEventListener("click", (e) => {
      e.stopPropagation()
      closeAllDropdowns()
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
})

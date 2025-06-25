document.addEventListener("DOMContentLoaded", function () {
   const movieNameInput = document.getElementById("movieName")
   const searchResultsElement = document.getElementById("searchResults")
   const storedMovieName = localStorage.getItem("movieName")
   const movieSearchForm = document.getElementById("movieSearchForm")

   // Конфигурация нового API
   const KINOBOX_API = "https://api.kinobox.tv/api/players"
   const KINOPOISK_API_KEY = "660XDJZ-J474ZP1-Q9E0PYY-2TBY1XY"

   if (storedMovieName) {
      movieNameInput.value = storedMovieName
      document.title = storedMovieName
      performMovieSearch(storedMovieName)
   }

   /**
    * Получение данных фильма из Kinopoisk API
    * @param {string} movieName - название фильма или ID
    * @returns {Promise<object>} данные фильма
    */
   async function getMovieFromKinopoisk(movieName) {
      const options = {
         method: "GET",
         headers: {
            accept: "application/json",
            "X-API-KEY": KINOPOISK_API_KEY,
         },
      }

      let apiUrl
      if (!isNaN(movieName)) {
         apiUrl = `https://api.kinopoisk.dev/v1.4/movie/${encodeURIComponent(movieName)}`
      } else {
         apiUrl = `https://api.kinopoisk.dev/v1.4/movie/search?page=1&limit=1&query=${encodeURIComponent(movieName)}`
      }

      const response = await fetch(apiUrl, options)
      if (!response.ok) {
         throw new Error("Ошибка при запросе к API Kinopoisk")
      }

      const data = await response.json()
      const movies = data.docs ? data.docs : [data]

      if (!movies || movies.length === 0) {
         throw new Error("Фильм не найден")
      }

      return movies[0]
   }

   /**
    * Получение источников плеера из нового Kinobox API
    * @param {object} movieData - данные фильма с kinopoisk ID
    * @returns {Promise<Array>} список доступных плееров
    */
   async function fetchKinoboxSources(movieData) {
      const apiURL = new URL(KINOBOX_API)

      // Добавляем ID Kinopoisk в параметры запроса
      if (movieData.kinopoisk) {
         apiURL.searchParams.set("kinopoisk", movieData.kinopoisk)
      }

      // Добавляем название фильма
      if (movieData.title) {
         apiURL.searchParams.set("title", movieData.title)
      }

      const request = await fetch(apiURL, { method: "GET" })
      if (!request.ok || request?.status !== 200) {
         throw new Error(`Запрос к Kinobox API завершился с ошибкой ${request.status}`)
      }

      let response = await request.json()
      if (typeof response !== "object" || !Array.isArray(response?.data) || response === null) {
         throw new Error(`Неверный формат ответа от API: "${typeof response}"`)
      }

      // Фильтруем плееры без полных данных
      let playersData = response.data
      playersData = playersData.filter((player) => player?.iframeUrl && player?.success && player?.type)

      return playersData
   }

   /**
    * Создание HTML для отображения плееров
    * @param {Array} sources - список источников плееров
    * @param {object} movie - данные фильма
    * @returns {string} HTML код
    */
   function createPlayerHTML(sources, movie) {
      let resultHTML = ""

      // Отображаем логотип или название фильма
      // if (movie.logo && movie.logo.url) {
      //    resultHTML += `
      // 	<div class="poster">
      // 	  <img src="${movie.logo.url}" alt="${movie.name} poster" />
      // 	</div>`
      // } else {
      //    resultHTML += `<h1>${movie.name} (${movie.year})</h1>`
      // }
      resultHTML += `<h1>${movie.name} (${movie.year})</h1>`

      // Создаем контейнеры для плеера и источников
      resultHTML += `
		 <div class="player-container">
			<div id="player-content" class="player-content">
			  <span>Выберите источник для просмотра</span>
			</div>
			<div id="player-sources" class="player-sources"></div>
		 </div>
	  `

      return resultHTML
   }

   /**
    * Создание кнопок источников и настройка их функциональности
    * @param {Array} sources - список источников плееров
    */
   function setupSourceButtons(sources) {
      const sourcesElement = document.getElementById("player-sources")
      const contentElement = document.getElementById("player-content")

      if (!sourcesElement || !contentElement) return

      // Получаем предпочитаемый источник из localStorage
      const preferredSource = localStorage.getItem("preferred-source")
      let preferredSourceIndex = sources.findIndex((source) => source.type === preferredSource)

      // Если источник не найден, выбираем первый
      if (preferredSourceIndex === -1) preferredSourceIndex = 0

      sources.forEach((source, index) => {
         const sourceButton = document.createElement("button")
         sourceButton.className = "source-button"
         sourceButton.innerText = source?.type

         // Выбираем предпочитаемый источник по умолчанию
         if (index === preferredSourceIndex) {
            sourceButton.classList.add("selected")
            selectSource(source, contentElement)
         }

         // Обработчик клика по кнопке источника
         sourceButton.addEventListener("click", () => {
            if (sourceButton.classList.contains("selected")) return

            // Переключаем выбранный источник
            sourcesElement.querySelectorAll(".source-button").forEach((btn) => btn.classList.remove("selected"))
            sourceButton.classList.add("selected")

            // Сохраняем выбранный источник как предпочитаемый
            localStorage.setItem("preferred-source", source.type)

            selectSource(source, contentElement)
         })

         sourcesElement.appendChild(sourceButton)
      })
   }

   /**
    * Выбор и отображение источника в плеере
    * @param {object} sourceData - данные источника
    * @param {HTMLElement} contentElement - элемент для отображения плеера
    */
   function selectSource(sourceData, contentElement) {
      const iframe = document.createElement("iframe")
      iframe.src = sourceData?.iframeUrl
      iframe.allowFullscreen = true
      iframe.style.width = "100%"
      // iframe.style.height = "500px"
      iframe.style.border = "none"

      contentElement.innerHTML = ""
      contentElement.appendChild(iframe)
   }

   /**
    * Основная функция поиска и отображения фильма
    * @param {string} movieName - название фильма
    */
   async function performMovieSearch(movieName) {
      try {
         // searchResultsElement.innerHTML = "<p>Поиск фильма...</p>"

         // Получаем данные фильма из Kinopoisk
         const movie = await getMovieFromKinopoisk(movieName)

         // Подготавливаем данные для запроса к Kinobox API
         const movieData = {
            kinopoisk: movie.id,
            title: movie.name,
         }

         // Получаем источники плееров
         // searchResultsElement.innerHTML = "<p>Загрузка плееров...</p>"
         const sources = await fetchKinoboxSources(movieData)

         if (sources.length === 0) {
            searchResultsElement.innerHTML = `<h2>Плееры для фильма "${movieName}" не найдены.</h2>`
            return
         }

         // Создаем HTML и отображаем плееры
         const playerHTML = createPlayerHTML(sources, movie)
         searchResultsElement.innerHTML = playerHTML

         // Настраиваем кнопки источников
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

   // Обработчик отправки формы поиска
   movieSearchForm.addEventListener("submit", (event) => {
      event.preventDefault()
      const movieName = movieNameInput.value.trim()

      if (!movieName) {
         alert("Введите название фильма")
         return
      }

      localStorage.setItem("movieName", movieName)
      document.title = movieName
      performMovieSearch(movieName)
   })
})

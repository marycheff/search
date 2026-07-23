import { STORAGE_KEYS } from "./config.js"
import { getShowPoster, getVerticalTabs } from "./utils.js"

// Создаёт HTML контейнера плеера (с учётом включённых вертикальных вкладок)
export function createPlayerHTML(movie) {
	const verticalClass = getVerticalTabs() ? " vertical" : ""

	return `
        <div class="player-container${verticalClass}">
            <div id="player-content" class="player-content">
                <span>Выберите источник для просмотра</span>
            </div>
            <div id="player-sources" class="player-sources"></div>
        </div>
    `
}

// Отображает название фильма (или постер с годом) в блоке #headerMovieInfo
export function renderMovieTitle(movie, container) {
	const headerInfo = container || document.getElementById("headerMovieInfo")
	if (!headerInfo) return

	const showPoster = getShowPoster()

	if (showPoster && movie.logo?.url) {
		headerInfo.innerHTML = `
		<div class="movie-logo-wrapper">
		<img class="movie-logo" src="${movie.logo.url}" alt="${movie.name}" />
		<span class="movie-year">${movie.year}</span>
				</div>
				`
	} else {
		headerInfo.innerHTML = `<span class="movie-title">${movie.name} <span style="color: var(--text-muted); font-weight: 400;">(${movie.year})</span></span>`
	}
}

// Создаёт кнопки источников, активирует предпочтённый (Turbo → сохранённый → первый)
export function setupSourceButtons(sources) {
	const sourcesElement = document.getElementById("player-sources")
	const contentElement = document.getElementById("player-content")

	if (!sourcesElement || !contentElement) return

	let preferredSourceIndex = sources.findIndex((source) => source.type === "Turbo")

	if (preferredSourceIndex === -1) {
		const preferredSource = localStorage.getItem(STORAGE_KEYS.PREFERRED_SOURCE)
		preferredSourceIndex = sources.findIndex((source) => source.type === preferredSource)
	}

	if (preferredSourceIndex === -1) preferredSourceIndex = 0

	sources.forEach((source, index) => {
		const sourceButton = document.createElement("button")
		sourceButton.className = "source-button"
		sourceButton.innerText = source?.type

		if (index === preferredSourceIndex) {
			sourceButton.classList.add("selected")
			selectSource(source, contentElement)
		}

		sourceButton.addEventListener("click", () => {
			if (sourceButton.classList.contains("selected")) return

			sourcesElement.querySelectorAll(".source-button").forEach((btn) => btn.classList.remove("selected"))
			sourceButton.classList.add("selected")

			localStorage.setItem(STORAGE_KEYS.PREFERRED_SOURCE, source.type)
			selectSource(source, contentElement)
		})

		sourcesElement.appendChild(sourceButton)
	})
}

// Загружает iframe выбранного источника в контейнер плеера
function selectSource(sourceData, contentElement) {
	const iframe = document.createElement("iframe")
	iframe.src = sourceData?.iframeUrl
	iframe.allowFullscreen = true
	iframe.style.width = "100%"
	iframe.style.border = "none"

	contentElement.innerHTML = ""
	contentElement.appendChild(iframe)
}

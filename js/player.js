import { STORAGE_KEYS } from "./config.js"

export function createPlayerHTML(sources, movie) {
   let resultHTML = `<h1>${movie.name} (${movie.year})</h1>`

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

export function setupSourceButtons(sources) {
   const sourcesElement = document.getElementById("player-sources")
   const contentElement = document.getElementById("player-content")

   if (!sourcesElement || !contentElement) return

   const preferredSource = localStorage.getItem(STORAGE_KEYS.PREFERRED_SOURCE)
   let preferredSourceIndex = sources.findIndex((source) => source.type === preferredSource)

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

function selectSource(sourceData, contentElement) {
   const iframe = document.createElement("iframe")
   iframe.src = sourceData?.iframeUrl
   iframe.allowFullscreen = true
   iframe.style.width = "100%"
   iframe.style.border = "none"

   contentElement.innerHTML = ""
   contentElement.appendChild(iframe)
}

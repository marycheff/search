document.addEventListener("DOMContentLoaded", function () {
  const movieNameInput = document.getElementById("movieName");
  const searchResultsElement = document.getElementById("searchResults");

  // Check if there is a stored movieName
  const storedMovieName = localStorage.getItem("movieName");

  if (storedMovieName) {
    // If stored, set the input value
    movieNameInput.value = storedMovieName;

    // Trigger the search function with the stored movieName
    performMovieSearch(storedMovieName);
  }

  const movieSearchForm = document.getElementById("movieSearchForm");

  movieSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const movieName = movieNameInput.value.trim();

    // Store movieName in localStorage
    localStorage.setItem("movieName", movieName);

    // Trigger the search function
    performMovieSearch(movieName);
  });

  function performMovieSearch(movieName) {
    const apiKey = "660XDJZ-J474ZP1-Q9E0PYY-2TBY1XY";
    const apiUrl = `https://api.kinopoisk.dev/v1.4/movie/search?query=${encodeURIComponent(
      movieName
    )}&limit=1`;

    fetch(apiUrl, {
      headers: {
        "X-API-KEY": apiKey,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Ошибка при запросе к API Kinopoisk");
        }
        return response.json();
      })
      .then((data) => {
        const movies = data.docs;
        if (!movies || movies.length === 0) {
          searchResultsElement.innerHTML = `<h2>Фильм "${movieName}" не найден.</h2>`;
          return;
        }

        const movie = movies[0];
        let resultHTML;
        if (movie.logo.url) {
          resultHTML = `
        <div class="poster">
          <img src="${movie.logo.url}" alt="${movie.name} poster">
        </div>`;
        } else {
          resultHTML = `<h1>${movie.name} (${movie.year})</h1>`;
        }

        let russia = false;
        movie.countries.forEach((element) => {
          if (element.name == "Россия") {
            russia = true;
          }
        });

        if (russia) {
          resultHTML += `
          <div id="single" class="kinobox_player"></div>`;
        } else {
          resultHTML += `
        <div class="wrapper">
          <iframe id="english" src="https://voidboost.tv/embed/ ${movie["id"]}?&td=20,425,643,328&tp=20,425,643,328&poster=1&poster_id=2&h=vbzettest.club" frameborder="0" allowfullscreen="true"></iframe>
          <div id="all" class="kinobox_player"></div>
        </div>
      `;
        }

        const kinoboxScript = document.createElement("script");
        kinoboxScript.src = "https://kinobox.tv/kinobox.min.js";
        document.body.appendChild(kinoboxScript);

        kinoboxScript.onload = function () {
          new Kinobox(".kinobox_player", {
            search: {
              kinopoisk: movie.id,
            },
            players: {},
          }).init();
        };
        searchResultsElement.innerHTML = resultHTML;
      })
      .catch((error) => {
        console.error(error);
        searchResultsElement.innerHTML =
          "<p>Ошибка при запросе к API Kinopoisk</p>";
      });
  }
});

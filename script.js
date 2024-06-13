document.addEventListener("DOMContentLoaded", function () {
  const movieNameInput = document.getElementById("movieName");
  const searchResultsElement = document.getElementById("searchResults");
  const storedMovieName = localStorage.getItem("movieName");
  const movieSearchForm = document.getElementById("movieSearchForm");

  if (storedMovieName) {
    movieNameInput.value = storedMovieName;
    performMovieSearch(storedMovieName);
  }

  function performMovieSearch(movieName) {
    const apiKey = "660XDJZ-J474ZP1-Q9E0PYY-2TBY1XY";
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-KEY": apiKey,
      },
    };
    let apiUrl;

    if (!isNaN(movieName)) {
      apiUrl = `https://api.kinopoisk.dev/v1.4/movie/${encodeURIComponent(
        movieName
      )}`;
    } else {
      apiUrl = `https://api.kinopoisk.dev/v1.4/movie/search?page=1&limit=10&query=${encodeURIComponent(
        movieName
      )}`;
    }

    fetch(apiUrl, options)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Ошибка при запросе к API Kinopoisk");
        }
        return response.json();
      })
      .then((data) => {
        const movies = data.docs ? data.docs : [data];
        if (!movies || movies.length === 0) {
          searchResultsElement.innerHTML = `<h2>Фильм "${movieName}" не найден.</h2>`;
          return;
        }

        const movie = movies[0];
        let movieId = movie["id"];
        let resultHTML;
        if (movie.logo && movie.logo.url) {
          resultHTML = `
            <div class="poster">
              <img src="${movie.logo.url}" alt="${movie.name} poster">
            </div>`;
        } else {
          resultHTML = `<h1>${movie.name} (${movie.year})</h1>`;
        }

        let russia = movie.countries.some(
          (country) => country.name === "Россия"
        );

        // ВРЕМЕННО
        russia = true;
        if (russia) {
          resultHTML += `
            <div id="single" class="kinobox_player"></div>`;
        } else {
          resultHTML += `
            <div class="wrapper">
              <iframe id="english" src="https://voidboost.fancdn.net/embed/${movieId}?&td=20,425,643,328&tp=20,425,643,328&poster=1&poster_id=2&h=vbzettest.club" frameborder="0" allowfullscreen="true"></iframe>
              <div id="all" class="kinobox_player"></div>
            </div>`;
        }

        const kinoboxScript = document.createElement("script");
        kinoboxScript.src = "https://kinobox.tv/kinobox.min.js";
        document.body.appendChild(kinoboxScript);

        kinoboxScript.onload = function () {
          new Kinobox(".kinobox_player", {
            search: {
              kinopoisk: movieId,
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

  movieSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const movieName = movieNameInput.value.trim();
    localStorage.setItem("movieName", movieName);
    performMovieSearch(movieName);
  });
});

const express = require("express");
const app = express();
const PORT = 3000;
const fs = require("fs").promises;
const fsCallback = require("fs");
const path = require("path");
const updateMovies = require("./helpers/updateMovies");
const checkMovie = require("./helpers/checkMovie");
const deleteMovie = require("./helpers/deleteMovie");

let movies;

app.use(express.json());

app.get("/movies", (req, res) => {
  res.json(movies);
});

app.get("/movies/:id", (req, res) => {
  const movieId = parseInt(req.params.id);
  const movie = movies.find((movie) => movie.id === movieId);

  if (movie) {
    res.json(movie);
  } else {
    res.status(404).json({ message: "movie not found" });
  }
});

app.post("/movies", (req, res) => {
  const [newMovie, errors] = checkMovie(req);

  if (errors.length) {
    return res
      .status(400)
      .json({ mesage: `Missing required fields: ${errors.join("; ")}` });
  }

  movies = updateMovies(movies, newMovie, null);
  res.status(201).json(newMovie);
});

app.put("/movies/:id", (req, res) => {
  const movieId = parseInt(req.params.id);
  const existingMovie = movies.find((movie) => movie.id == movieId);

  if (!existingMovie) {
    return res
      .status(400)
      .json({ message: `No such movie with id: ${movieId}` });
  }

  const [newMovie, errors] = checkMovie(req, existingMovie);

  if (errors.length) {
    return res
      .status(400)
      .json({ mesage: `Missing required fields: ${errors.join("; ")}` });
  }

  movies = updateMovies(movies, newMovie, true);
  res.status(201).json(newMovie);
});

app.delete("/movies/:id", (req, res) => {
  const movieId = parseInt(req.params.id);
  const movie = movies.find((u) => u.id === movieId);

  if (movie) {
    movies = deleteMovie(movies, movie);
    res.status(201).send(movie);
  } else {
    res.status(404).json({ message: "movie not found" });
  }
});

app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

const loadmoviesFromFile = async () => {
  try {
    const data = await fs.readFile(
      path.join(process.cwd(), "data", "movies-min.json"),
      "utf-8"
    );
    movies = JSON.parse(data);
    console.log("movies data successfully loaded.");
  } catch (err) {
    console.error("Error loading movies data:", err);
    throw err;
  }
};

const startServer = async () => {
  try {
    await loadmoviesFromFile();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Server failed to start:", err);
  }
};

startServer();

process.on("SIGINT", async () => {
  fsCallback.writeFile(
    path.join(__dirname, "data/movies.json"),
    JSON.stringify(movies),
    "utf-8",
    () => {
      process.exit();
    }
  );
});

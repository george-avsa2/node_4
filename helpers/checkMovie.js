const { v4: uuidv4 } = require("uuid");

function checkMovie(req, existingMovie) {
  let newMovie;

  if (existingMovie) {
    newMovie = { ...existingMovie, ...req.body };
  } else {
    newMovie = {
      id: uuidv4(),
      title: req?.body?.title,
      year: req?.body?.year,
      rating: req?.body?.rating || null,
      position: Number.parseInt(req?.body?.position) || null,
      gallery: req?.body?.gallery || null,
    };
  }

  const errors = [];

  if (!newMovie.title || typeof newMovie.title !== "string") {
    errors.push("title is missing or not string");
  }

  if (!newMovie.year || typeof newMovie.year !== "number") {
    errors.push("year is missing or not string");
  }

  if (
    !newMovie.position ||
    typeof newMovie.position !== "number" ||
    !Number.isInteger(newMovie.position) ||
    newMovie.position < 1
  ) {
    errors.push("position is missing or not integer");
  }

  return [newMovie, errors];
}

module.exports = checkMovie;

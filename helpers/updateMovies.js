function updateMovies(arr, newMovie, isExisting) {
  let tempMovies = [...arr];

  if (isExisting) {
    let index = -1;
    const movieBefore = arr.find((movie, i) => {
      if (movie.id === newMovie.id) {
        index = i;
      }
      return movie.id === newMovie.id;
    });

    if (index) {
      tempMovies = [
        ...arr.slice(0, index - 1),
        ...arr
          .slice(index, arr.length - 1)
          .map((movie) => ({ ...movie, position: movie.position })),
      ];
      console.log(
        JSON.stringify(tempMovies.map((movie) => movie.position)),
        tempMovies.length
      );
    } else {
      tempMovies = arr
        .slice(1, arr.length - 1)
        .map((movie) => ({ ...movie, position: movie.position - 1 }));
    }
  }

  return [
    ...tempMovies.slice(0, newMovie.position - 1),
    newMovie,
    ...tempMovies
      .slice(newMovie.position - 1, tempMovies.length)
      .map((movie) => ({
        ...movie,
        position: movie.position + 1,
      })),
  ];
}

module.exports = updateMovies;

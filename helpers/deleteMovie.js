function deleteMovie(movies, movieToDelete) {
  return movies.reduce((acc, movie) => {
    if (movie.id !== movieToDelete.id) {
      if (movie.position > movieToDelete.position) {
        acc.push({ ...movie, position: movie.position - 1 });
      } else {
        acc.push(movie);
      }
    }
    return acc;
  }, []);
}

module.exports = deleteMovie;

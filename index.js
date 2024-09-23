const express = require("express");
const app = express();
const PORT = 3000;
const fs = require("fs").promises;
const fsCallback = require("fs");
const path = require("path");
const updateMovies = require("./helpers/updateMovies");
const checkMovie = require("./helpers/checkMovie");
const deleteMovie = require("./helpers/deleteMovie");

require("dotenv").config();

const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);

const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

let movies;
let users;

const auth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.status(401).json({ message: "No token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "token expired" });
    req.user = user;
    next();
  });
};

app.use("/movies", auth);

app.use(express.json());

app.post("/api/auth/register", (req, res) => {
  const data = {
    id: uuidv4(),
    email: req?.body?.email || null,
    password: req?.body?.password || null,
    super: req?.body?.super || false,
  };

  const errors = [];

  if (!data.password) {
    errors.push("missing required field: password");
  }

  if (!data.email) {
    errors.push("Missing required field: email");
  }

  if (
    data.password &&
    (data.password?.length > 12 || data.password.length < 6)
  ) {
    errors.push("Password should be more than 5 and less than 13 symbols");
  }

  if (errors.length) {
    return res.status(400).json({ mesage: `: ${errors.join("; ")}` });
  }

  var hash = bcrypt.hashSync(data.password, salt);
  users.push({ email: data.email, hash });
  res.status(201).json({ message: "Manager created" });
});

app.post("/api/auth/login", (req, res) => {
  const data = {
    email: req?.body?.email || null,
    password: req?.body?.password || null,
  };

  const errors = [];

  if (!data.password) {
    errors.push("missing required field: password");
  }

  if (!data.email) {
    errors.push("Missing required field: email");
  }

  const manager = users?.find((manager) => manager.email === data.email);

  if (!manager) {
    return res.status(403).json({ message: "Wrong email" });
  }

  if (!bcrypt.compareSync(data.password, manager.hash)) {
    errors.push("Password incorrect");
  }

  if (errors.length) {
    return res.status(400).json({ mesage: `: ${errors.join("; ")}` });
  }

  var token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 5 * 60,
      data: {
        id: manager.id,
        email: manager.email,
        super: manager.super,
      },
    },
    process.env.JWT_SECRET
  );

  res.status(200).json({ token });
});

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
  if (req.user?.data?.super) {
    const [newMovie, errors] = checkMovie(req);

    if (errors.length) {
      return res
        .status(400)
        .json({ mesage: `Missing required fields: ${errors.join("; ")}` });
    }

    movies = updateMovies(movies, newMovie, null);
    res.status(201).json(newMovie);
  } else {
    res.status(403).json({ message: "Access denied" });
  }
});

app.put("/movies/:id", (req, res) => {
  if (req.user?.data?.super) {
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
  } else {
    res.status(404).json({ message: "movie not found" });
  }
});

app.delete("/movies/:id", (req, res) => {
  if (req.user?.data?.super) {
    const movieId = parseInt(req.params.id);
    const movie = movies.find((u) => u.id === movieId);

    if (movie) {
      movies = deleteMovie(movies, movie);
      res.status(201).send(movie);
    } else {
      res.status(404).json({ message: "movie not found" });
    }
  } else {
    res.status(404).json({ message: "movie not found" });
  }
});

app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

const loadFromFile = async (file) => {
  try {
    const data = await fs.readFile(
      path.join(process.cwd(), "data", file),
      "utf-8"
    );
    console.log(`Data from ${file} successfully loaded.`);
    return JSON.parse(data);
  } catch (err) {
    console.error("Error loading movies data:", err);
    throw err;
  }
};

const startServer = async () => {
  try {
    movies = await loadFromFile("movies.json");
    users = await loadFromFile("manager.json");
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
    path.join(__dirname, "data/manager.json"),
    JSON.stringify(users),
    "utf-8",
    () => {
      fsCallback.writeFile(
        path.join(__dirname, "data/movies.json"),
        JSON.stringify(movies),
        "utf-8",
        () => {
          process.exit();
        }
      );
    }
  );
});

require("dotenv").config();
const express = require("express");

const authRoutes = require("./routes/auth");
const notesRoutes = require("./routes/notes");

const app = express();

app.use(express.json());

app.get("/", function (req, res) {
  res.status(200).json({ message: "Notes API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);

app.use(function (req, res) {
  res.status(404).json({ error: "Route not found." });
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log("Server is running on port " + PORT);
});

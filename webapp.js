const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("express-flash");

const rutas_middleware = require("./routes/middleware");
const rutas_publicas = require("./routes/publicas");
const rutas_privadas = require("./routes/privadas");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(
  session({
    secret: "token-muy-secreto",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());
app.use(express.static("public"));

app.use(rutas_middleware);
app.use(rutas_publicas);
app.use(rutas_privadas);

app.listen(8080, function () {
  console.log("Servidor iniciado");
});

const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("express-flash");

var pool = mysql.createPool({
  connectionLimit: 20,
  host: "localhost",
  user: "root",
  password: "",
  database: "blog_viaje",
});

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

app.use('/admin/', (req, res, next) => {
  if (!req.session.usuario) {
    req.flash('mensaje', 'Debe iniciar sesión')
    res.redirect("/inicio")
  }
  else {
    next()
  }
})


app.get("/", function (req, res) {
  pool.getConnection(function (err, connection) {
    const query = `
      SELECT
      foto, titulo, resumen, fecha_hora, pseudonimo, votos
      FROM publicaciones
      INNER JOIN autores
      ON publicaciones.autor_id = autores.id
      ORDER BY fecha_hora DESC
      LIMIT 10
    `;
    connection.query(query, function (error, filas, campos) {
      res.render("index", { publicaciones: filas });
    });
    connection.release();
  });
});

app.get("/registro", function (req, res) {
  res.render("registro", { mensaje: req.flash("mensaje") });
});

app.post("/procesar_registro", function (req, res) {
  pool.getConnection(function (err, connection) {
    const email = req.body.email.toLowerCase().trim();
    const pseudonimo = req.body.pseudonimo.trim();
    const contrasena = req.body.contrasena;

    const queryEmail = `
    SELECT * FROM 
    autores 
    WHERE
    email = ${connection.escape(email)} 
    `;
    connection.query(queryEmail, function (error, filas, campos) {
      console.log(filas.length);
      if (filas.length > 0) {
        req.flash("mensaje", "Email Duplicado");
        res.redirect("/registro");
      } else {
        const queryPseudonimo = `
          SELECT * FROM 
          autores 
          WHERE
          pseudonimo = ${connection.escape(pseudonimo)} 
          `;
        connection.query(queryPseudonimo, function (error, filas, campos) {
          console.log(filas.length);
          if (filas.length > 0) {
            req.flash("mensaje", "Pseudonimo Duplicado");
            res.redirect("/registro");
          } else {
          const query = `
          INSERT INTO 
          autores
          (email,contrasena,pseudonimo)
          VALUES (
            ${connection.escape(email)},
            ${connection.escape(contrasena)},
            ${connection.escape(pseudonimo)}
          )
          `;
            connection.query(query, function (error, filas, campos) {
              console.log(req.body);
              req.flash("mensaje", "Usuario Registrado");
              res.redirect('/registro');
            });
          }
        });
      }
    });

    connection.release();
  });
});


app.get('/inicio', function (req, res) {
  res.render('inicio', { mensaje: req.flash('mensaje') })
})


app.post('/procesar_inicio', function (req, res) {
  pool.getConnection(function (err, connection) {
    const consulta = `
      SELECT *
      FROM autores
      WHERE
      email = ${connection.escape(req.body.email)} AND
      contrasena = ${connection.escape(req.body.contrasena)}
    `
    connection.query(consulta, function (error, filas, campos) {
      if (filas.length > 0) {
        req.session.usuario = filas[0]
        res.redirect('/admin/index')
      }
      else {
        req.flash('mensaje', 'Datos inválidos')
        res.redirect('/inicio')
      }

    })
    connection.release()
  })
})


app.get('/admin/index', function (req, res) {
  pool.getConnection(function (err,connection) { 
    query = `
    SELECT * FROM
    publicaciones
    WHERE 
    autor_id = ${connection.escape(req.session.usuario.id)}
    `
      connection.query(query, function (error, filas, campos) {
      res.render('admin/index', { usuario: req.session.usuario, mensaje: req.flash('mensaje'), publicaciones: filas })
    })
    connection.release()
   })
})

app.get('/admin/agregar', function (req, res) {
  res.render('admin/agregar', { mensaje: req.flash('mensaje') , usuario: req.session.usuario})
})

app.get('/procesar_cerrar_sesion', function (req, res) {
  req.session.destroy();
  res.redirect("/")
});



app.listen(8080, function () {
  console.log("Servidor iniciado");
});

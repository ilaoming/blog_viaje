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
    const query = `
      SELECT *
      FROM autores
      WHERE
      email = ${connection.escape(req.body.email)} AND
      contrasena = ${connection.escape(req.body.contrasena)}
    `
    connection.query(query, function (error, filas, campos) {
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

app.post('/admin/procesar_agregar', function (req, res) {
  pool.getConnection(function (err, connection) {
    const date = new Date()
    const fecha = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
    const query = `
      INSERT INTO
      publicaciones
      (titulo, resumen, contenido,foto, autor_id, fecha_hora)
      VALUES
      (
        ${connection.escape(req.body.titulo)},
        ${connection.escape(req.body.resumen)},
        ${connection.escape(req.body.contenido)},
        ${connection.escape(req.body.foto)},
        ${connection.escape(req.session.usuario.id)},
        ${connection.escape(fecha)}
      )
    `
    connection.query(query, function (error, filas, campos) {
      req.flash('mensaje', 'Publicación agregada')
      res.redirect("/admin/index")
    })
    connection.release()
  })
})

app.get('/admin/actualizar_publicacion', function (req, res) {
  pool.getConnection(function (err,connection) { 
    const query = `SELECT * FROM publicaciones WHERE id =${connection.escape(req.query.id)}`
    connection.query(query,function (error,filas,campo) {  
          const publicacion = filas[0]
          if (filas.length>0) {
          if(req.session.usuario.id == publicacion.autor_id){
            res.render('admin/actualizar_publicacion',{publicacion, mensaje: req.flash('mensaje') , usuario: req.session.usuario})        
          }else{
            const query_admin_index = `
            SELECT * FROM
            publicaciones
            WHERE 
            autor_id = ${connection.escape(req.session.usuario.id)}
            `
              connection.query(query_admin_index,function (error,filas,campo) { 
              req.flash('mensaje', 'Esta publicacion no le pertenece')
              res.render('admin/index', { usuario: req.session.usuario, mensaje: req.flash('mensaje'), publicaciones: filas })
             })
          }            
          } else {
            const query_admin_index = `
            SELECT * FROM
            publicaciones
            WHERE 
            autor_id = ${connection.escape(req.session.usuario.id)}
            `
              connection.query(query_admin_index,function (error,filas,campo) { 
              req.flash('mensaje', 'Publicacion no encontrada')
              res.render('admin/index', { usuario: req.session.usuario, mensaje : req.flash('mensaje'), publicaciones: filas })
             })
          }
          })
     connection.release()
 })
})

app.post('/admin/procesar_editar', (req, res) => {
  pool.getConnection((err, connection) => {
    if (
      req.body.titulo != "" &&
      req.body.resumen != "" &&
      req.body.contenido != "" &&
      req.body.foto != "" 
    ) {
      console.log(req.body);
      const consulta = `
      UPDATE publicaciones
      SET
      titulo = ${connection.escape(req.body.titulo)},
      resumen = ${connection.escape(req.body.resumen)},
      contenido = ${connection.escape(req.body.contenido)},
      contenido = ${connection.escape(req.body.foto)}
      WHERE
      id = ${connection.escape(req.body.id)}
    `
    connection.query(consulta, (error, filas, campos) => {
      if (filas && filas.changedRows > 0){
        req.flash('mensaje', 'Publicación editada')
      }
      res.redirect("/admin/index")
    })
    connection.release()
    }else{
      req.flash('mensaje', ' Publicación no editada,  Debe llenar todos los campos')
      res.redirect(`/admin/actualizar_publicacion?id=${req.body.id}`)
    }

  })
})



app.listen(8080, function () {
  console.log("Servidor iniciado");
});

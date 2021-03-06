const express = require("express");
const router = express.Router();
const mysql = require("mysql");
var path = require("path");

var pool = mysql.createPool({
  connectionLimit: 20,
  host: "localhost",
  user: "root",
  password: "",
  database: "blog_viaje",
});

router.get("/", function (req, res) {
  pool.getConnection(function (err, connection) {
    let query;
    let modificadorConsulta = "";
    let pagina = 0;
    let modificadorPagina = "";
    const busqueda = req.query.busqueda ? req.query.busqueda : "";
    if (busqueda != "") {
      modificadorConsulta = `
        WHERE
        titulo LIKE '%${busqueda}%' OR
        resumen LIKE '%${busqueda}%' OR
        contenido LIKE '%${busqueda}%'
      `;
      modificadorPagina = "";
    } else {
      pagina = req.query.pagina ? parseInt(req.query.pagina) : 0;
      if (pagina < 0) {
        pagina = 0;
      }
      modificadorPagina = `
      LIMIT 8 OFFSET ${pagina * 8}
      `;
    }
    query = `
    SELECT
    publicaciones.id id, titulo, resumen, foto, fecha_hora, pseudonimo, votos, avatar
    FROM publicaciones
    INNER JOIN autores
    ON publicaciones.autor_id = autores.id
    ${modificadorConsulta}
    ORDER BY fecha_hora DESC
    ${modificadorPagina}
    `;

    connection.query(query, function (error, filas, campos) {
      res.render("index", {
        mensaje: req.flash("mensaje"),
        publicaciones: filas,
        busqueda: busqueda,
        pagina: pagina,
      });
    });
    connection.release();
  });
});

router.get("/registro", function (req, res) {
  res.render("registro", { mensaje: req.flash("mensaje") });
});

router.post("/procesar_registro", function (req, res) {
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
              if (req.files && req.files.avatar) {
                const archivoAvatar = req.files.avatar;
                const id = filas.insertId;
                const nombreArchivo = `${id}${path.extname(
                  archivoAvatar.name
                )}`;
                archivoAvatar.mv(
                  `./public/avatars/${nombreArchivo}`,
                  (error) => {
                    const consultarAvatar = `
                        UPDATE 
                        autores
                        SET avatar = ${connection.escape(nombreArchivo)}
                        WHERE id = ${connection.escape(id)}  
                  `;
                    connection.query(
                      consultarAvatar,
                      function (error, filas, campos) {
                        req.flash("mensaje", "Usuario registrado con avatar");
                        res.redirect("/registro");
                      }
                    );
                  }
                );
              } else {
                req.flash("mensaje", "Usuario Registrado");
                res.redirect("/registro");
              }
            });
          }
        });
      }
    });

    connection.release();
  });
});

router.get("/inicio", function (req, res) {
  res.render("inicio", { mensaje: req.flash("mensaje") });
});

router.post("/procesar_inicio", function (req, res) {
  pool.getConnection(function (err, connection) {
    const query = `
      SELECT *
      FROM autores
      WHERE
      email = ${connection.escape(req.body.email)} AND
      contrasena = ${connection.escape(req.body.contrasena)}
    `;
    connection.query(query, function (error, filas, campos) {
      if (filas.length > 0) {
        req.session.usuario = filas[0];
        res.redirect("/admin/index");
      } else {
        req.flash("mensaje", "Datos inv??lidos");
        res.redirect("/inicio");
      }
    });
    connection.release();
  });
});

router.get("/detalles", function (req, res) {
  pool.getConnection(function (err, connection) {
    const query = `
    SELECT 
    titulo,contenido,foto,votos
    FROM publicaciones 
    WHERE id = ${connection.escape(req.query.id)}
    `;
    connection.query(query, function (error, filas, campo) {
      if (filas.length > 0) {
        res.render("detalles", { publicaciones: filas,id:req.query.id });
      } else {
        req.flash("mensaje", "Publicaci??n no encontrada");
        res.redirect("/");
      }
    });
    connection.release();
  });
});

router.get("/autores", function (req, res) {
  pool.getConnection((err, connection) => {
    const consulta = `
      SELECT autores.id id, pseudonimo, avatar, publicaciones.id publicacion_id, titulo
      FROM autores
      INNER JOIN
      publicaciones
      ON
      autores.id = publicaciones.autor_id
      ORDER BY autores.id DESC, publicaciones.fecha_hora DESC
    `
    connection.query(consulta, (error, filas, campos) => {
      autores = []
      ultimoAutorId = undefined
      filas.forEach(registro => {
        if (registro.id != ultimoAutorId){
          ultimoAutorId = registro.id
          autores.push({
            id: registro.id,
            pseudonimo: registro.pseudonimo,
            avatar: registro.avatar,
            publicaciones: []
          })
        }
        autores[autores.length-1].publicaciones.push({
          id: registro.publicacion_id,
          titulo: registro.titulo
        })
      });
      let mensaje = req.flash("mensaje")
      res.render('autores', { autores: autores, mensaje: mensaje})
    })
    connection.release()
  })
});

router.get('/detalles/votar',function (req,res) { 
  pool.getConnection(function (err,connection) { 
    const consulta = `
    SELECT * FROM 
    publicaciones 
    WHERE id = ${req.query.id} 
    `
    connection.query(consulta,function (error,filas,campos) { 
      if (filas.length>0) {
        const query = `
        UPDATE 
        publicaciones
        SET
        votos = votos + 1
        WHERE id = ${req.query.id} 
        `
        connection.query(query,function (error,filas,campos) { 
        res.redirect(`/detalles?id=${req.query.id}`)
        })
      } else {
        req.flash("mensaje", "Publicaci??n no encontrada");
        res.redirect("/");
      }
     })
     connection.release()
   })
 })
module.exports = router;

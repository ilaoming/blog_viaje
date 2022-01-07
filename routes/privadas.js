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

router.get("/admin/index", function (req, res) {
  pool.getConnection(function (err, connection) {
    query = `
    SELECT * FROM
    publicaciones
    WHERE 
    autor_id = ${connection.escape(req.session.usuario.id)}
    `;
    connection.query(query, function (error, filas, campos) {
      res.render("admin/index", {
        usuario: req.session.usuario,
        mensaje: req.flash("mensaje"),
        publicaciones: filas,
      });
    });
    connection.release();
  });
});

router.get("/admin/agregar", function (req, res) {
  res.render("admin/agregar", {
    mensaje: req.flash("mensaje"),
    usuario: req.session.usuario,
  });
});

router.get("/procesar_cerrar_sesion", function (req, res) {
  req.session.destroy();
  res.redirect("/");
});

router.post("/admin/procesar_agregar", function (req, res) {
  pool.getConnection(function (err, connection) {
    const date = new Date();
    const fecha = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`;
    const query = `
      INSERT INTO
      publicaciones
      (titulo, resumen, contenido, autor_id, fecha_hora)
      VALUES
      (
        ${connection.escape(req.body.titulo)},
        ${connection.escape(req.body.resumen)},
        ${connection.escape(req.body.contenido)},
        ${connection.escape(req.session.usuario.id)},
        ${connection.escape(fecha)}
      )
    `;
    connection.query(query, function (error, filas, campos) {
      if (req.files && req.files.foto) {
        const archivoPortada = req.files.foto
        const id = filas.insertId;
        const nombreArchivo = `${id}${path.extname(archivoPortada.name)}`;
        console.log(nombreArchivo);
        archivoPortada.mv(`./public/portadas/${nombreArchivo}`, (error) => {
          const consultarPortada = `
                UPDATE 
                publicaciones
                SET foto = ${connection.escape(nombreArchivo)}
                WHERE id = ${connection.escape(id)}  
          `;
          connection.query(consultarPortada, function (error, filas, campos) {
            req.flash("mensaje", "Publicacion registrada con portada");
            res.redirect("/admin/index");
          });
        });
      } else {
        req.flash("mensaje", "Publicación registrada");
        res.redirect("/admin/index");
      }
    });
    connection.release();
  });
});

router.get("/admin/actualizar_publicacion", function (req, res) {
  pool.getConnection(function (err, connection) {
    const query = `SELECT * FROM publicaciones WHERE id =${connection.escape(
      req.query.id
    )}`;
    connection.query(query, function (error, filas, campo) {
      const publicacion = filas[0];
      if (filas.length > 0) {
        if (req.session.usuario.id == publicacion.autor_id) {
          res.render("admin/actualizar_publicacion", {
            publicacion,
            mensaje: req.flash("mensaje"),
            usuario: req.session.usuario,
          });
        } else {
          req.flash("mensaje", "Esta publicacion no le pertenece");
          res.redirect("/admin/index");
        }
      } else {
        req.flash("mensaje", "Publicacion no encontrada");
        res.redirect("/admin/index");
      }
    });
    connection.release();
  });
});

router.post("/admin/procesar_actualizar", (req, res) => {
  pool.getConnection((err, connection) => {
    if (
      req.body.titulo != "" &&
      req.body.resumen != "" &&
      req.body.contenido != ""
    ) {
      console.log(req.body);
      const consulta = `
      UPDATE publicaciones
      SET
      titulo = ${connection.escape(req.body.titulo)},
      resumen = ${connection.escape(req.body.resumen)},
      contenido = ${connection.escape(req.body.contenido)}
      WHERE
      id = ${connection.escape(req.body.id)}
    `;
      connection.query(consulta, (error, filas, campos) => {
        if (req.files && req.files.foto) {
          const archivoPortada = req.files.foto
          const id = req.body.id
          const nombreArchivo = `${id}${path.extname(archivoPortada.name)}`;
          archivoPortada.mv(`./public/portadas/${nombreArchivo}`, (error) => {
            const consultarPortada = `
                  UPDATE 
                  publicaciones
                  SET 
                  foto = ${connection.escape(nombreArchivo)} 
                  WHERE 
                  id = ${connection.escape(id)}  
            `;
            connection.query(consultarPortada, function (error, filas, campos) {
              req.flash("mensaje", "Publicacion editada con portada");
              res.redirect("/admin/index");
            });
          });
        } else {
          req.flash("mensaje", "Publicación editada");
          res.redirect("/admin/index");
        }
      });
      connection.release();
    } else {
      req.flash(
        "mensaje",
        " Publicación no editada,  Debe llenar todos los campos"
      );
      res.redirect(`/admin/actualizar_publicacion?id=${req.body.id}`);
    }
  });
});

router.get("/admin/procesar_eliminar", function (req, res) {
  pool.getConnection(function (err, connection) {
    const query = `
    DELETE FROM
    publicaciones
    WHERE id = ${connection.escape(req.query.id)}
    AND
    autor_id = ${connection.escape(req.session.usuario.id)}
    `;
    connection.query(query, function (error, filas, campos) {
      req.flash("mensaje", "Publicacion eliminada");
      res.redirect("/admin/index");
    });
    connection.release();
  });
});

module.exports = router;

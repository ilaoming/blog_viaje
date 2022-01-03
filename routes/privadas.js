const express = require('express')
const router = express.Router()
const mysql = require('mysql')

var pool = mysql.createPool({
  connectionLimit: 20,
  host: "localhost",
  user: "root",
  password: "",
  database: "blog_viaje",
});

router.get('/admin/index', function (req, res) {
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

router.get('/admin/agregar', function (req, res) {
  res.render('admin/agregar', { mensaje: req.flash('mensaje') , usuario: req.session.usuario})
})

router.get('/procesar_cerrar_sesion', function (req, res) {
  req.session.destroy();
  res.redirect("/")
});

router.post('/admin/procesar_agregar', function (req, res) {
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

router.get('/admin/actualizar_publicacion', function (req, res) {
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

router.post('/admin/procesar_editar', (req, res) => {
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

module.exports = router
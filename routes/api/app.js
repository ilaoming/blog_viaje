const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const router = express.Router();

var pool = mysql.createPool({
  connectionLimit: 20,
  host: "localhost",
  user: "root",
  password: "",
  database: "blog_viaje",
});

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// /api/v1/publicaciones?busqueda=?
// GET /api/v1/publicaciones
// GET /api/v1/publicaciones?busqueda=<palabra>
router.get("/api/v1/publicaciones", function (req, res) {
  pool.getConnection(function (err, connection) {
    const busqueda = req.query.busqueda;
    let modificador = `
    WHERE
    titulo LIKE "%${busqueda}%" OR
    resumen LIKE "%${busqueda}%" OR
    contenido LIKE "%${busqueda}%"
    `;
    if (!busqueda) {
      modificador = "";
    }

    const query = `SELECT * FROM publicaciones ${modificador}`;

    connection.query(query, function (error, filas, campos) {
      if (filas.length > 0) {
        res.status(200)
        res.json({ data: filas });
      } else {
        res.status(404);
        res.send({
          erros: [
            `No se encontraron resultados para la busqueda : ${busqueda}`,
          ],
        });
      }
    });
    connection.release();
  });
});

// GET /api/v1/publicaciones/<id>
// Busqueda de publicaciones por id
router.get("/api/v1/publicaciones/:id", function (req, res) {
  pool.getConnection(function (err, connection) {
    const query = `
    SELECT * 
    FROM
    publicaciones
    WHERE 
    id = ${connection.escape(req.params.id)}
    `;

    connection.query(query, function (error, filas, campos) {
      if (filas.length > 0) {
        res.status(200)
        res.json({ data: filas[0] });
      } else {
        res.status(404);
        res.send({
          erros: [`No se encontro la publicacion : #${req.params.id}`],
        });
      }
    });
    connection.release();
  });
});

// GET /api/v1/autores
// Devuelve todos los autores
router.get("/api/v1/autores", function (req, res) {
  pool.getConnection(function (err, connection) {
    const query = `SELECT * FROM autores`;
    connection.query(query, function (error, filas, campos) {
      res.json({ data: filas });
    });
    connection.release();
  });
});

// GET /api/v1/autores/<id>
// Busqueda de autores por id
router.get("/api/v1/autores/:id", function (req, res) {
  pool.getConnection(function (err, connection) {
    const query = `
    SELECT * 
    FROM
    autores
    WHERE 
    id = ${connection.escape(req.params.id)}
    `;

    connection.query(query, function (error, filas, campos) {
      if (filas.length > 0) {
        res.status(200)
        res.json({ data: filas[0] });
      } else {
        res.status(404);
        res.send({
          erros: [`No se encontro el autor : #${req.params.id}`],
        });
      }
    });
    connection.release();
  });
});

// POST /api/v1/autores
// Valida si el email o pseudonimo estan duplicados y registra un autor
router.post("/api/v1/autores", function (req, res) {
  pool.getConnection(function (err, connection) {
    const email = req.body.email.toLowerCase().trim();
    const pseudonimo = req.body.pseudonimo.trim();
    const contrasena = req.body.contrasena;

    const queryEmail = `
    SELECT * FROM
    autores
    WHERE
    email = ${connection.escape(email)}
    OR
    pseudonimo = ${connection.escape(pseudonimo)}
    `;
    connection.query(queryEmail, function (error, filas, campos) {
      if (filas.length > 0) {
        const myData = Object.values(filas);
        if (myData[0].email == email) {
          res.status(400);
          res.send({
            erros: [`El Email : ${email} ya se enceuntra en uso`],
          });
        } else {
          res.status(400);
          res.send({
            erros: [`El Pseudonimo : ${pseudonimo} ya se enceuntra en uso`],
          });
        }
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
          const last_id = filas.insertId;
          const queryConsulta = `SELECT * FROM autores WHERE id=${last_id}`;
          connection.query(queryConsulta, function (error, filas, campos) {
            res.status(200)
            res.json({ data: filas[0] });
          });
        });
      }
    });
    connection.release();
  });
});

//POST /api/v1/publicaciones?email=<email>&contrasena=<contrasena>
//http://localhost:8080/api/v1/publicaciones?email=jesus.rios2609@gmail.com&contrasena=28sep1995
//Registra una publicacion si los datos de login son correctos
router.post("/api/v1/publicaciones", function (req, res) {
  pool.getConnection(function (err, connection) {
    const titulo = req.body.titulo;
    const resumen = req.body.resumen;
    const contenido = req.body.contenido;
    const email = req.query.email.toLowerCase().trim();
    const contrasena = req.query.contrasena;
    const queryLogin = `
      SELECT * FROM
      autores
      WHERE
      email = ${connection.escape(email)}
      AND
      contrasena = ${connection.escape(contrasena)}
      `;
    connection.query(queryLogin, function (error, filas, campos) {
      if (filas.length > 0) {
        const myData = Object.values(filas);
        const query = `
        INSERT INTO
        publicaciones
        (titulo,resumen,contenido,autor_id)
        VALUES (
        ${connection.escape(titulo)},
        ${connection.escape(resumen)},
        ${connection.escape(contenido)},
        ${connection.escape(myData[0].id)} 
        ) 
        `;
        connection.query(query, function (error, filas, campos) {
          const last_id = filas.insertId;
          const queryConsulta = `
          SELECT * FROM
          publicaciones
          WHERE id = ${last_id}
          `;
          connection.query(queryConsulta, function (error, filas, campos) {
            res.status(200)
            res.json({ data: filas[0] });
          });
        });
      } else {
        res.status(401);
        res.send({
          erros: [`Email o Contraseña incorrecto`],
        });
      }
    });
    connection.release();
  });
});

//DELETE /api/v1/publicaciones/<id>?email=<email>&contrasena=<contrasena>
router.delete("/api/v1/publicaciones/:id", function (req, res) {
  pool.getConnection(function (err,connection) { 
    const email = req.query.email.toLowerCase().trim();
    const contrasena = req.query.contrasena;
    const id = req.params.id

    const queryLogin = `
    SELECT * FROM 
    autores
    WHERE
    email = ${connection.escape(email)}
    AND
    contrasena = ${connection.escape(contrasena)}
    `
    connection.query(queryLogin,function (error,filas,campos) { 
      if (filas.length>0) {
        const myDataLogin = Object.values(filas);
        const queryPublicaciones = `
        SELECT *
        FROM
        publicaciones 
        WHERE id = ${connection.escape(id)}
        `
        connection.query(queryPublicaciones,function (error,filas,campos) { 
          if (filas.length > 0) {
            const myDataPublicacion = Object.values(filas);
            const queryDeletePublicaciones = `
            DELETE 
            FROM 
            publicaciones
            WHERE
            id = ${id}
            `
            if (myDataLogin[0].id == myDataPublicacion[0].autor_id) {
              connection.query(queryDeletePublicaciones,function (error,filas,campos) { 
                res.status(202)
                res.send({info : [`Publicacion codigo: ${id} eliminada`]})
               })
            } else {
              res.status(403);
              res.send({
                erros: [`Esta publicacion no le pertenece`],
               });
            }
          } else {
            res.status(404)
            res.send({erros:[
              `Publicacion codigo : ${id} no encontrada`
            ]})

          }
         })
      } else {
        res.status(401)
        res.send({
          erros: [`Email o Contraseña incorrecto`],
         });
      }

     })
     connection.release()
   })
});

module.exports = router;

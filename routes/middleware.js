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

router.use('/admin/', (req, res, next) => {
  if (!req.session.usuario) {
    req.flash('mensaje', 'Debe iniciar sesión')
    res.redirect("/inicio")
  }
  else {
    next()
  }
})


module.exports = router

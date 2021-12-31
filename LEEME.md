# Creado Index

# Creando la ruta

```Javascript
aplicacion.get('/', function (peticion, respuesta) {
  pool.getConnection(function(err, connection) {
    const consulta = `
      SELECT
      titulo, resumen, fecha_hora, pseudonimo, votos
      FROM publicaciones
      INNER JOIN autores
      ON publicaciones.autor_id = autores.id
      ORDER BY fecha_hora DESC
      LIMIT 5
    `
    connection.query(consulta, function (error, filas, campos) {
      respuesta.render('index', { publicaciones: filas })
    })
    connection.release()
  })
})
```

# Creando  las vistas parciales

- `/views/partials/encabezado_publico.ejs`
- `/views/partials/pie.ejs`

# Creando la vista general

```HTML
      <% publicaciones.forEach(publicacion => { %>
      <div class="col-sm-12">
        <div class="card fluid ">
          <h3 class="section"><a href="#">
              <%=publicacion.titulo%></a> <mark class="tag">
              <%=publicacion.votos%></mark></h3>
          <h6 class="section dark">
            <span class="icon-user"></span>
            <%=publicacion.pseudonimo%> -
            <span class="icon-calendar"></span>
            <%= publicacion.fecha_hora.getFullYear() %>/
            <%= publicacion.fecha_hora.getMonth()+1 %>/
            <%= publicacion.fecha_hora.getDate() %>
          </h6>
          <p>
            <%= publicacion.resumen %>
          </p>
        </div>
      </div>
      <% }) %>
```      

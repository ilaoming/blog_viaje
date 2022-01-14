-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 14-01-2022 a las 19:28:01
-- Versión del servidor: 10.4.22-MariaDB
-- Versión de PHP: 8.0.13

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `blog_viaje`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `autores`
--

CREATE TABLE `autores` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `pseudonimo` varchar(255) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `autores`
--

INSERT INTO `autores` (`id`, `email`, `contrasena`, `pseudonimo`, `avatar`) VALUES
(1, 'jesus.rios2609@gmail.com', '28sep1995', 'Laoming', '1.png'),
(2, 'marys.ovalle09@gmail.com', '28sep1995', 'Visionary', '2.png'),
(22, 'jose@mail.ru', '28sep1995', 'Joselito', '22.png'),
(23, 'usernew@mail.ru', '28sep1995', 'Aguacate', '23.png'),
(24, 'riosj4600@gmail.com', '28sep1995', 'perezoso22', '24.png'),
(25, 'joserojas@gmail.com', '123456', 'luis2215', '25.png'),
(38, 'jesus.rsa@gmail.com', 'asdasd', 'pedro', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `publicaciones`
--

CREATE TABLE `publicaciones` (
  `id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `resumen` varchar(255) NOT NULL,
  `contenido` varchar(255) NOT NULL,
  `foto` varchar(500) DEFAULT NULL,
  `votos` int(11) DEFAULT 0,
  `fecha_hora` timestamp NULL DEFAULT NULL,
  `autor_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Volcado de datos para la tabla `publicaciones`
--

INSERT INTO `publicaciones` (`id`, `titulo`, `resumen`, `contenido`, `foto`, `votos`, `fecha_hora`, `autor_id`) VALUES
(1, 'Costa rica 1', 'Descubriendo hermosasa zonas cuando viaje a Roma.', 'Contenido de Roma', '1.jpg', 0, '2018-09-10 01:08:27', 1),
(2, 'Grecia', 'Buen viaje a Grecia', 'Contenido', '2.jpg', 1, '2018-09-11 01:08:27', 1),
(3, 'Paris', 'Buen viaje a Paris', 'Contenido', '3.jpg', 1, '2018-09-12 01:08:27', 1),
(4, 'Costa rica', 'Buen viaje a Costa Rica', 'Contenido de Costa Rica', '4.jpg', 2, '2018-09-13 01:08:27', 2),
(5, 'Mar de Plata', 'Buen viaje a Mar de Plata', 'Contenido Mar de Plata', '5.jpg', 0, '2018-09-14 01:08:27', 2),
(6, 'Guadalajara', 'Buen viaje a Guadalajara', 'Contenido', '6.jpg', 0, '2018-09-15 01:08:27', 2),
(7, 'China', 'Buen viaje a China', 'Contenido', '7.jpg', 4, '2018-09-16 01:08:27', 2),
(17, 'Ecuador', 'Hola Ecuador', 'Contenido', '17.jpg', 2, '2022-01-04 05:00:00', 2),
(18, 'Australia', 'Buen viaje Australia', 'Contenido Australia', '18.jpg', 2, '2022-01-06 05:00:00', 23),
(20, 'Brasil', 'Nuestro viaje a Brasil', 'Contenido Brasil', '20.png', 1, '2022-01-06 05:00:00', 2),
(26, 'Mar mediterráneo', 'Mar mediterráneo', 'Mar mediterráneo', '26.jpg', 2, '2022-01-07 05:00:00', 2),
(27, 'Costa de marfil', 'Mi viaje a Costa de marfil ', 'Contenido Costa de marfil', '27.jpg', 2, '2022-01-07 05:00:00', 1),
(28, 'Japon', 'Mi viaje a Japón', 'Contenido Japón\r\n', '28.jpg', 3, '2022-01-07 05:00:00', 1),
(29, 'Filipinas', 'Resumen de mi viaje Filipinas', 'Contenido Filipinas', '29.jpg', 3, '2022-01-10 05:00:00', 24);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `autores`
--
ALTER TABLE `autores`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `publicaciones`
--
ALTER TABLE `publicaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_publicaciones_autores_idx` (`autor_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `autores`
--
ALTER TABLE `autores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT de la tabla `publicaciones`
--
ALTER TABLE `publicaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `publicaciones`
--
ALTER TABLE `publicaciones`
  ADD CONSTRAINT `fk_publicaciones_autores` FOREIGN KEY (`autor_id`) REFERENCES `autores` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

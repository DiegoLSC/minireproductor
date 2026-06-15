<?php
// index.php
require_once 'config/conexion.php';
require_once 'controllers/HomeController.php';

// Instanciamos el controlador
$controller = new HomeController($pdo);

// Ejecutamos la función principal que carga la página
$controller->index();
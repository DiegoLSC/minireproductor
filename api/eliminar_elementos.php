<?php
require_once '../config/conexion.php';
require_once '../controllers/ApiControlador.php';

$controlador = new ApiControlador($pdo);
$controlador->eliminar($_GET);
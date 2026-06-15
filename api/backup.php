<?php
// api/backup.php
require_once '../config/conexion.php';
require_once '../controllers/ApiControlador.php';

$controlador = new ApiControlador($pdo);
$controlador->gestionarBackup($_POST, $_GET);
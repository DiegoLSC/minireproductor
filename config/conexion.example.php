<?php
// config/conexion.example.php
// RENOMBRA ESTE ARCHIVO A conexion.php Y COLOCA TUS DATOS

$host = 'localhost';
$dbname = 'minireproductor';
$username = 'TU_USUARIO_AQUI'; 
$password = 'TU_CONTRASEÑA_AQUI'; 

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Error de conexión: " . $e->getMessage());
}
?>
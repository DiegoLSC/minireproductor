<?php
// api/obtener_logs.php
require_once '../config/conexion.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // Obtenemos los últimos 100 logs ordenados del más reciente al más antiguo
    $sql = "SELECT * FROM registro_logs ORDER BY fecha_hora DESC LIMIT 100";
    $stmt = $pdo->query($sql);
    $logs = $stmt->fetchAll();

    echo json_encode(['estado' => 'exito', 'datos' => $logs]);

} catch (PDOException $e) {
    echo json_encode(['estado' => 'error', 'mensaje' => $e->getMessage()]);
}
?>
<?php
// api/obtener_logs.php
require_once '../config/conexion.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // Definimos cuántos logs traer por cada página/clic
    $limite = 50; 
    
    // Obtenemos el offset (cuántas filas saltar). Si no viene, asumimos 0 (la primera página).
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

    // Preparamos la consulta con LIMIT y OFFSET
    $sql = "SELECT * FROM registro_logs ORDER BY fecha_hora DESC LIMIT :limite OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    
    // Bindeamos los parámetros como enteros para evitar inyecciones SQL
    $stmt->bindValue(':limite', $limite, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $logs = $stmt->fetchAll();

    // Averiguamos si hay más registros esperando para decirle al botón del Frontend si debe ocultarse
    $hay_mas = count($logs) == $limite;

    echo json_encode([
        'estado' => 'exito', 
        'datos' => $logs,
        'hay_mas' => $hay_mas
    ]);

} catch (PDOException $e) {
    echo json_encode(['estado' => 'error', 'mensaje' => $e->getMessage()]);
}
?>
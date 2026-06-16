<?php
// models/Logger.php

class Logger {
    /**
     * Registra una acción en la tabla de auditoría.
     * * @param PDO $pdo La conexión a la base de datos.
     * @param string $accion Acción realizada (INSERTAR, EDITAR, ELIMINAR).
     * @param string $modulo Tabla o sección afectada (canciones, artistas, etc).
     * @param int|null $registro_id El ID primario del registro afectado.
     * @param string $descripcion Detalle legible para el usuario.
     */
    public static function registrar($pdo, $accion, $modulo, $registro_id, $descripcion) {
        try {
            $sql = "INSERT INTO registro_logs (accion, modulo, registro_id, descripcion) 
                    VALUES (:accion, :modulo, :registro_id, :descripcion)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':accion'      => strtoupper($accion),
                ':modulo'      => strtolower($modulo),
                ':registro_id' => $registro_id,
                ':descripcion' => $descripcion
            ]);
        } catch (PDOException $e) {
            // Si falla el log, lo escribimos en el log de errores de PHP para no romper la app
            error_log("Error en el sistema de Auditoría (Logger): " . $e->getMessage());
        }
    }
}
?>
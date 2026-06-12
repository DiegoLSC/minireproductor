<?php
// api/backup.php
require_once '../config/conexion.php';

$accion = $_POST['accion'] ?? $_GET['accion'] ?? '';
$archivo_estado = '../backups/estado.json';
$archivo_zip = '../backups/NebulaPlayer_Backup.zip';
$archivo_db = '../backups/configuracion_y_datos.json';

try {
    switch ($accion) {
        case 'estado':
            if (file_exists($archivo_estado)) {
                echo file_get_contents($archivo_estado);
            } else {
                echo json_encode(["estado" => "inactivo"]);
            }
            break;

        case 'limpiar':
            if (file_exists($archivo_estado)) unlink($archivo_estado);
            echo json_encode(["status" => "limpiado"]);
            break;

        case 'iniciar':
            // 1. Configuraciones críticas para evitar que el script muera por Timeout
            ignore_user_abort(true);
            set_time_limit(0); 
            ini_set('memory_limit', '512M'); // Darle suficiente RAM a PHP para comprimir

            // 2. Avisar que empezamos
            file_put_contents($archivo_estado, json_encode(["estado" => "procesando"]));

            // 3. Exportar Base de Datos a JSON
            // Ajusta este array si tienes más tablas en tu base de datos
            $tablas = ['canciones', 'artistas', 'albumes', 'playlists', 'playlist_canciones', 'cancion_artistas', 'albumes_artistas'];
            $db_data = [];
            
            foreach($tablas as $tabla) {
                $stmt = $pdo->query("SELECT * FROM $tabla");
                $db_data[$tabla] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            file_put_contents($archivo_db, json_encode($db_data, JSON_PRETTY_PRINT));

            // 4. Crear el ZIP y agregar los archivos
            $zip = new ZipArchive();
            if ($zip->open($archivo_zip, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
                
                // Agregamos la base de datos
                $zip->addFile($archivo_db, 'configuracion_y_datos.json');
                
                // Agregamos toda la carpeta uploads
                $dir_uploads = '../uploads';
                if (is_dir($dir_uploads)) {
                    $archivos = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir_uploads), RecursiveIteratorIterator::LEAVES_ONLY);
                    
                    foreach ($archivos as $name => $file) {
                        if (!$file->isDir()) {
                            $ruta_fisica = $file->getRealPath();
                            $ruta_relativa = 'uploads/' . substr($ruta_fisica, strlen(realpath($dir_uploads)) + 1);
                            $zip->addFile($ruta_fisica, str_replace('\\', '/', $ruta_relativa));
                        }
                    }
                }
                $zip->close();
            } else {
                throw new Exception("No se pudo crear el archivo ZIP.");
            }

            // 5. Limpiar archivo JSON suelto y declarar éxito
            if (file_exists($archivo_db)) unlink($archivo_db);
            file_put_contents($archivo_estado, json_encode([
                "estado" => "completado",
                "archivo" => "backups/NebulaPlayer_Backup.zip"
            ]));
            
            break;
    }
} catch (Exception $e) {
    file_put_contents($archivo_estado, json_encode(["estado" => "error", "mensaje" => $e->getMessage()]));
}
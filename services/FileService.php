<?php
// services/FileService.php
// Responsabilidad: Única y exclusivamente interactuar con el sistema de archivos del servidor local.

class FileService {
    
    // Sube un archivo enviado desde un formulario (multipart/form-data)
    public function subirArchivo($file, $carpeta, $prefijo, $exts_validas = null) {
        if (empty($file['name'])) return null;
        
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($exts_validas && !in_array($ext, $exts_validas)) {
            throw new Exception("Formato de archivo inválido.");
        }
        
        // Generamos un nombre único para evitar colisiones
        $nombre = $prefijo . '_' . time() . '_' . rand(1000,9999) . '.' . $ext;
        $ruta = '../assets/uploads/' . $carpeta . '/' . $nombre;
        
        if (move_uploaded_file($file['tmp_name'], $ruta)) {
            return 'assets/uploads/' . $carpeta . '/' . $nombre;
        }
        throw new Exception("Error al subir el archivo al servidor.");
    }

    // Guarda datos puros (como el binario de una imagen descargada) en un archivo
    public function guardarArchivoFisico($datos, $carpeta, $prefijo) {
        $dir = '../assets/uploads/' . $carpeta;
        if (!is_dir($dir)) {
            @mkdir($dir, 0777, true); // Crea el directorio si no existe
        }
        
        $nombre = $prefijo . '_web_' . time() . '_' . rand(1000,9999) . '.jpg';
        $rutaFisica = $dir . '/' . $nombre;
        
        if (@file_put_contents($rutaFisica, $datos) === false) {
            throw new Exception("Error de permisos: PHP no puede guardar en la carpeta '$carpeta'.");
        }
        
        return 'assets/uploads/' . $carpeta . '/' . $nombre;
    }

    // Borra un archivo si existe, protegiendo los placeholders por defecto
    public function borrarArchivoFisico($ruta) {
        if ($ruta && strpos($ruta, 'default.jpg') === false && file_exists('../' . $ruta)) {
            unlink('../' . $ruta);
        }
    }
}
?>
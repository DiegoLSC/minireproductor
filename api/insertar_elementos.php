<?php
// api/insertar_elementos.php
require_once '../config/conexion.php';

$accion = $_POST['accion'] ?? '';

try {
    switch ($accion) {
        case 'crear_artista':
            $nombre = trim($_POST['nombre']);
            $ruta_foto = 'uploads/artistas/default.jpg';

            if (!empty($_FILES['foto']['name'])) {
                $ext = pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION);
                $nuevo_nombre = 'artist_' . time() . '.' . $ext;
                $ruta_destino = '../uploads/artistas/' . $nuevo_nombre;
                if (move_uploaded_file($_FILES['foto']['tmp_name'], $ruta_destino)) {
                    $ruta_foto = 'uploads/artistas/' . $nuevo_nombre;
                }
            }
            $stmt = $pdo->prepare("INSERT INTO artistas (nombre, foto) VALUES (?, ?)");
            $stmt->execute([$nombre, $ruta_foto]);
            break;

        case 'crear_album':
            $titulo = trim($_POST['titulo']);
            $anio = !empty($_POST['anio']) ? intval($_POST['anio']) : null;
            $ruta_caratula = 'uploads/caratulas/default.jpg';
            
            // 1. Recibimos el arreglo de múltiples artistas
            $artistas_seleccionados = $_POST['artista_ids'] ?? [];

            if (empty($artistas_seleccionados)) {
                throw new Exception("El álbum debe tener al menos un artista asignado.");
            }

            if (!empty($_FILES['caratula']['name'])) {
                $ext = pathinfo($_FILES['caratula']['name'], PATHINFO_EXTENSION);
                $nuevo_nombre = 'cover_' . time() . '.' . $ext;
                $ruta_destino = '../uploads/caratulas/' . $nuevo_nombre;
                if (move_uploaded_file($_FILES['caratula']['tmp_name'], $ruta_destino)) {
                    $ruta_caratula = 'uploads/caratulas/' . $nuevo_nombre;
                }
            }
            
            // 2. Insertamos el álbum (ya sin la columna artista_id)
            $stmt = $pdo->prepare("INSERT INTO albumes (titulo, caratula, anio) VALUES (?, ?, ?)");
            $stmt->execute([$titulo, $ruta_caratula, $anio]);
            
            // 3. Obtenemos el ID del álbum que se acaba de crear
            $album_id = $pdo->lastInsertId();

            // 4. Guardamos las relaciones en la tabla puente
            $stmtArtistas = $pdo->prepare("INSERT INTO albumes_artistas (album_id, artista_id) VALUES (?, ?)");
            foreach ($artistas_seleccionados as $art_id) {
                $stmtArtistas->execute([$album_id, intval($art_id)]);
            }
            break;

        case 'crear_playlist':
            $nombre = trim($_POST['nombre']);
            $descripcion = trim($_POST['descripcion']);
            $ruta_caratula = 'uploads/caratulas/default.jpg';

            if (!empty($_FILES['caratula']['name'])) {
                $ext = pathinfo($_FILES['caratula']['name'], PATHINFO_EXTENSION);
                $nuevo_nombre = 'playlist_' . time() . '.' . $ext;
                $ruta_destino = '../uploads/caratulas/' . $nuevo_nombre;
                if (move_uploaded_file($_FILES['caratula']['tmp_name'], $ruta_destino)) {
                    $ruta_caratula = 'uploads/caratulas/' . $nuevo_nombre;
                }
            }
            $stmt = $pdo->prepare("INSERT INTO playlists (nombre, descripcion, caratula) VALUES (?, ?, ?)");
            $stmt->execute([$nombre, $descripcion, $ruta_caratula]);
            break;

        case 'subir_cancion':
            $titulo = trim($_POST['titulo']);
            $album_id = (!empty($_POST['album_id']) && intval($_POST['album_id']) > 0) ? intval($_POST['album_id']) : null;
            $artistas_seleccionados = $_POST['artista_ids'] ?? [];
            
            // CAPTURAR LA DURACIÓN ENVIADA DESDE EL JAVASCRIPT (Por defecto 0 si no llega)
            $duracion = isset($_POST['duracion']) ? intval($_POST['duracion']) : 0;

            if (empty($artistas_seleccionados)) {
                throw new Exception("Debes asignar al menos un artista a la canción.");
            }
            if (empty($_FILES['archivo_mp3']['name'])) {
                throw new Exception("El archivo MP3 es obligatorio.");
            }

            $ext = pathinfo($_FILES['archivo_mp3']['name'], PATHINFO_EXTENSION);
            if (strtolower($ext) !== 'mp3') {
                throw new Exception("Solo se admiten archivos en formato MP3.");
            }

            $nuevo_nombre = 'track_' . time() . '.' . $ext;
            $ruta_audio = '../uploads/musica/' . $nuevo_nombre;

            if (move_uploaded_file($_FILES['archivo_mp3']['tmp_name'], $ruta_audio)) {
                $ruta_db = 'uploads/musica/' . $nuevo_nombre;
                
                // CORREGIDO: Ahora guardamos la variable $duracion real en lugar de dejar el 0 fijo
                $stmt = $pdo->prepare("INSERT INTO canciones (album_id, titulo, ruta_archivo, duracion) VALUES (?, ?, ?, ?)");
                $stmt->execute([$album_id, $titulo, $ruta_db, $duracion]);
                $cancion_id = $pdo->lastInsertId();

                $stmtArtistas = $pdo->prepare("INSERT INTO cancion_artistas (cancion_id, artist_id) VALUES (?, ?)");
                foreach ($artistas_seleccionados as $art_id) {
                    $stmtArtistas->execute([$cancion_id, intval($art_id)]);
                }
            } else {
                throw new Exception("Error al guardar el archivo de música en el servidor.");
            }
            break;

        case 'agregar_a_playlist':
            $playlist_id = intval($_POST['playlist_id']);
            $cancion_id = intval($_POST['cancion_id']);
            $stmt = $pdo->prepare("INSERT IGNORE INTO playlist_canciones (playlist_id, cancion_id) VALUES (?, ?)");
            $stmt->execute([$playlist_id, $cancion_id]);
            break;
            
        default:
            throw new Exception("Acción no válida.");
    }
    // Envía un código de estado 200 (OK) al navegador en vez de redireccionar
    http_response_code(200);
    echo json_encode(["status" => "success"]);
    exit;
} catch (Exception $e) {
    // http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    exit;
}
<?php
// api/editar_elementos.php
require_once '../config/conexion.php';

$accion = $_POST['accion'] ?? '';

try {
    switch ($accion) {
        case 'editar_artista':
            $id = intval($_POST['id']);
            $nombre = trim($_POST['nombre']);

            if (!empty($_FILES['foto']['name'])) {
                $ext = pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION);
                $nuevo_nombre = 'artist_' . time() . '.' . $ext;
                $ruta_destino = '../uploads/artistas/' . $nuevo_nombre;
                if (move_uploaded_file($_FILES['foto']['tmp_name'], $ruta_destino)) {
                    $ruta_foto = 'uploads/artistas/' . $nuevo_nombre;
                    $stmt = $pdo->prepare("UPDATE artistas SET nombre = ?, foto = ? WHERE id = ?");
                    $stmt->execute([$nombre, $ruta_foto, $id]);
                }
            } else {
                $stmt = $pdo->prepare("UPDATE artistas SET nombre = ? WHERE id = ?");
                $stmt->execute([$nombre, $id]);
            }
            break;

        case 'editar_album':
            $id = intval($_POST['id']);
            $titulo = trim($_POST['titulo']);
            $anio = !empty($_POST['anio']) ? intval($_POST['anio']) : null;
            
            // 1. Recibimos el arreglo de múltiples artistas
            $artistas_seleccionados = $_POST['artista_ids'] ?? [];

            if (empty($artistas_seleccionados)) {
                throw new Exception("El álbum debe tener al menos un artista asignado.");
            }

            // 2. Actualizamos los datos básicos del álbum (OJO: ya quitamos el artista_id de aquí)
            if (!empty($_FILES['caratula']['name'])) {
                $ext = pathinfo($_FILES['caratula']['name'], PATHINFO_EXTENSION);
                $nuevo_nombre = 'cover_' . time() . '.' . $ext;
                $ruta_destino = '../uploads/caratulas/' . $nuevo_nombre;
                if (move_uploaded_file($_FILES['caratula']['tmp_name'], $ruta_destino)) {
                    $ruta_caratula = 'uploads/caratulas/' . $nuevo_nombre;
                    $stmt = $pdo->prepare("UPDATE albumes SET titulo = ?, caratula = ?, anio = ? WHERE id = ?");
                    $stmt->execute([$titulo, $ruta_caratula, $anio, $id]);
                }
            } else {
                $stmt = $pdo->prepare("UPDATE albumes SET titulo = ?, anio = ? WHERE id = ?");
                $stmt->execute([$titulo, $anio, $id]);
            }

            // 3. Lógica para la tabla puente (Múltiples Artistas)
            // Primero, borramos las relaciones viejas de este álbum
            $pdo->prepare("DELETE FROM albumes_artistas WHERE album_id = ?")->execute([$id]);
            
            // Luego, insertamos todos los artistas que el usuario dejó en el modal
            $stmtArtistas = $pdo->prepare("INSERT INTO albumes_artistas (album_id, artista_id) VALUES (?, ?)");
            foreach ($artistas_seleccionados as $art_id) {
                $stmtArtistas->execute([$id, intval($art_id)]);
            }
            
            break;

        case 'editar_playlist':
            $id = intval($_POST['id']);
            $nombre = trim($_POST['nombre']);
            $descripcion = trim($_POST['descripcion']);

            if (!empty($_FILES['caratula']['name'])) {
                $ext = pathinfo($_FILES['caratula']['name'], PATHINFO_EXTENSION);
                $nuevo_nombre = 'playlist_' . time() . '.' . $ext;
                $ruta_destino = '../uploads/caratulas/' . $nuevo_nombre;
                if (move_uploaded_file($_FILES['caratula']['tmp_name'], $ruta_destino)) {
                    $ruta_caratula = 'uploads/caratulas/' . $nuevo_nombre;
                    $stmt = $pdo->prepare("UPDATE playlists SET nombre = ?, descripcion = ?, caratula = ? WHERE id = ?");
                    $stmt->execute([$nombre, $descripcion, $ruta_caratula, $id]);
                }
            } else {
                $stmt = $pdo->prepare("UPDATE playlists SET nombre = ?, descripcion = ? WHERE id = ?");
                $stmt->execute([$nombre, $descripcion, $id]);
            }
            break;

        case 'editar_cancion':
            $id = intval($_POST['id']);
            $titulo = trim($_POST['titulo']);
            
            // CORRECCIÓN DE LA CLAVE FORÁNEA:
            $album_id = (!empty($_POST['album_id']) && intval($_POST['album_id']) > 0) ? intval($_POST['album_id']) : null;
            
            $artistas_seleccionados = $_POST['artista_ids'] ?? [];

            if (empty($artistas_seleccionados)) {
                throw new Exception("La canción debe tener al menos un artista asignado.");
            }

            $stmt = $pdo->prepare("UPDATE canciones SET titulo = ?, album_id = ? WHERE id = ?");
            $stmt->execute([$titulo, $album_id, $id]);

            $pdo->prepare("DELETE FROM cancion_artistas WHERE cancion_id = ?")->execute([$id]);
            $stmtArtistas = $pdo->prepare("INSERT INTO cancion_artistas (cancion_id, artist_id) VALUES (?, ?)");
            foreach ($artistas_seleccionados as $art_id) {
                $stmtArtistas->execute([$id, intval($art_id)]);
            }
            break;
    }
    // Envía un código de estado 200 (OK) al navegador en vez de redireccionar
    http_response_code(200);
    echo json_encode(["status" => "success"]);
    exit;
} catch (Exception $e) {
    //http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    exit;
}
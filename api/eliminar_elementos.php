<?php
// api/eliminar_elementos.php
require_once '../config/conexion.php';

$tabla = $_GET['tabla'] ?? '';
$id = intval($_GET['id'] ?? 0);

try {
    switch ($tabla) {
        case 'cancion':
            $stmt = $pdo->prepare("SELECT ruta_archivo FROM canciones WHERE id = ?");
            $stmt->execute([$id]);
            $cancion = $stmt->fetch();
            
            // 1. Eliminar archivo físico
            if ($cancion && $cancion['ruta_archivo'] && file_exists('../' . $cancion['ruta_archivo'])) {
                unlink('../' . $cancion['ruta_archivo']);
            }
            
            // 2. Liberar vínculos en tablas puente ANTES de borrar la canción
            $pdo->prepare("DELETE FROM cancion_artistas WHERE cancion_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM playlist_canciones WHERE cancion_id = ?")->execute([$id]);
            
            // 3. Borrar la canción
            $pdo->prepare("DELETE FROM canciones WHERE id = ?")->execute([$id]);
            break;

        case 'artista':
            $stmt = $pdo->prepare("SELECT foto FROM artistas WHERE id = ?");
            $stmt->execute([$id]);
            $artista = $stmt->fetch();
            
            // 1. Eliminar foto física
            if ($artista && $artista['foto'] && strpos($artista['foto'], 'default.jpg') === false && file_exists('../' . $artista['foto'])) {
                unlink('../' . $artista['foto']);
            }
            
            // 2. Liberar vínculos en tablas puente
            $pdo->prepare("DELETE FROM cancion_artistas WHERE artist_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM albumes_artistas WHERE artista_id = ?")->execute([$id]);
            
            // 3. Borrar el artista
            $pdo->prepare("DELETE FROM artistas WHERE id = ?")->execute([$id]);
            break;

        case 'album':
            $stmt = $pdo->prepare("SELECT caratula FROM albumes WHERE id = ?");
            $stmt->execute([$id]);
            $album = $stmt->fetch();
            
            // 1. Eliminar carátula física
            if ($album && $album['caratula'] && strpos($album['caratula'], 'default.jpg') === false && file_exists('../' . $album['caratula'])) {
                unlink('../' . $album['caratula']);
            }
            
            // 2. Rescatar las canciones: Si borramos el álbum, las canciones se vuelven "Singles"
            $pdo->prepare("UPDATE canciones SET album_id = NULL WHERE album_id = ?")->execute([$id]);
            
            // 3. Liberar vínculos en la tabla puente
            $pdo->prepare("DELETE FROM albumes_artistas WHERE album_id = ?")->execute([$id]);
            
            // 4. Borrar el álbum
            $pdo->prepare("DELETE FROM albumes WHERE id = ?")->execute([$id]);
            break;

        case 'playlist':
            // 1. ELIMINACIÓN EN CASCADA MANUAL
            $stmtIntermedia = $pdo->prepare("DELETE FROM playlist_canciones WHERE playlist_id = ?");
            $stmtIntermedia->execute([$id]);

            // 2. Borrar la playlist
            $stmtPrincipal = $pdo->prepare("DELETE FROM playlists WHERE id = ?");
            $stmtPrincipal->execute([$id]);
            break;

        case 'quitar_de_playlist':
            $playlist_id = intval($_GET['playlist_id']);
            $cancion_id = intval($_GET['cancion_id']);
            $pdo->prepare("DELETE FROM playlist_canciones WHERE playlist_id = ? AND cancion_id = ?")->execute([$playlist_id, $cancion_id]);
            break;
    }
    
    // Envía un código de estado 200 (OK) al navegador
    http_response_code(200);
    echo json_encode(["status" => "success"]);
    exit;
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    exit;
}
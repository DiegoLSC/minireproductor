<?php
// models/EditorBD.php
require_once __DIR__ . '/Logger.php';

class EditorBD {
    private $pdo;
    
    public function __construct($pdo) { 
        $this->pdo = $pdo; 
    }

    /* ================= ARTISTAS ================= */
    public function crearArtista($nombre, $foto) {
        $this->pdo->prepare("INSERT INTO artistas (nombre, foto) VALUES (?, ?)")->execute([$nombre, $foto]);
        $id = $this->pdo->lastInsertId();
        Logger::registrar($this->pdo, 'INSERTAR', 'artistas', $id, "Se creó el artista '$nombre'.");
        return ['id' => $id, 'nombre' => $nombre, 'foto' => $foto];
    }
    
    public function editarArtista($id, $nombre, $foto) {
        if ($foto) {
            $this->pdo->prepare("UPDATE artistas SET nombre=?, foto=? WHERE id=?")->execute([$nombre, $foto, $id]);
        } else {
            $this->pdo->prepare("UPDATE artistas SET nombre=? WHERE id=?")->execute([$nombre, $id]);
            $stmt = $this->pdo->prepare("SELECT foto FROM artistas WHERE id=?");
            $stmt->execute([$id]);
            $foto = $stmt->fetchColumn();
        }
        Logger::registrar($this->pdo, 'EDITAR', 'artistas', $id, "Se editó el artista '$nombre'.");
        return ['id' => $id, 'nombre' => $nombre, 'foto' => $foto];
    }
    
    public function eliminarArtista($id) {
        $stmt = $this->pdo->prepare("SELECT foto, nombre FROM artistas WHERE id=?"); 
        $stmt->execute([$id]); 
        $data = $stmt->fetch();
        $foto = $data['foto'] ?? null;
        $nombre = $data['nombre'] ?? 'Desconocido';

        $this->pdo->prepare("UPDATE artistas SET estado = 0 WHERE id=?")->execute([$id]);
        Logger::registrar($this->pdo, 'ELIMINAR', 'artistas', $id, "Se eliminó lógicamente al artista '$nombre'.");
        return $foto; 
    }

    /* ================= ÁLBUMES ================= */
    public function crearAlbum($titulo, $anio, $caratula, $arts) {
        $this->pdo->prepare("INSERT INTO albumes (titulo, caratula, anio) VALUES (?, ?, ?)")->execute([$titulo, $caratula, $anio]);
        $id = $this->pdo->lastInsertId();
        
        $stmt = $this->pdo->prepare("INSERT INTO albumes_artistas (album_id, artista_id) VALUES (?, ?)");
        foreach($arts as $a) {
            $stmt->execute([$id, intval($a)]);
        }
        
        Logger::registrar($this->pdo, 'INSERTAR', 'albumes', $id, "Se creó el álbum '$titulo' del año $anio.");
        return $this->obtenerDetallesAlbum($id);
    }
    
    public function editarAlbum($id, $titulo, $anio, $caratula, $arts) {
        if($caratula) {
            $this->pdo->prepare("UPDATE albumes SET titulo=?, caratula=?, anio=? WHERE id=?")->execute([$titulo, $caratula, $anio, $id]);
        } else {
            $this->pdo->prepare("UPDATE albumes SET titulo=?, anio=? WHERE id=?")->execute([$titulo, $anio, $id]);
        }
        
        $this->pdo->prepare("DELETE FROM albumes_artistas WHERE album_id=?")->execute([$id]);
        $stmt = $this->pdo->prepare("INSERT INTO albumes_artistas (album_id, artista_id) VALUES (?, ?)");
        foreach($arts as $a) {
            $stmt->execute([$id, intval($a)]);
        }
        
        Logger::registrar($this->pdo, 'EDITAR', 'albumes', $id, "Se editó el álbum '$titulo'.");
        return $this->obtenerDetallesAlbum($id);
    }

    private function obtenerDetallesAlbum($id) {
        $query = "SELECT a.id, a.titulo, a.caratula, a.anio, 
                  GROUP_CONCAT(art.nombre SEPARATOR ', ') AS artistas_nombres, 
                  GROUP_CONCAT(art.id SEPARATOR ',') AS artistas_ids 
                  FROM albumes a 
                  LEFT JOIN albumes_artistas aa ON a.id = aa.album_id 
                  LEFT JOIN artistas art ON aa.artista_id = art.id 
                  WHERE a.id = ? GROUP BY a.id";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public function eliminarAlbum($id) {
        $stmt = $this->pdo->prepare("SELECT caratula, titulo FROM albumes WHERE id=?"); 
        $stmt->execute([$id]); 
        $data = $stmt->fetch();
        $caratula = $data['caratula'] ?? null;
        $titulo = $data['titulo'] ?? 'Desconocido';

        $this->pdo->prepare("UPDATE albumes SET estado = 0 WHERE id=?")->execute([$id]);
        Logger::registrar($this->pdo, 'ELIMINAR', 'albumes', $id, "Se eliminó lógicamente el álbum '$titulo'.");
        return $caratula;
    }

    /* ================= PLAYLISTS ================= */
    public function crearPlaylist($nombre, $desc, $caratula) {
        $this->pdo->prepare("INSERT INTO playlists (nombre, descripcion, caratula) VALUES (?, ?, ?)")->execute([$nombre, $desc, $caratula]);
        $id = $this->pdo->lastInsertId();
        Logger::registrar($this->pdo, 'INSERTAR', 'playlists', $id, "Se creó la playlist '$nombre'.");
        return ['id' => $id, 'nombre' => $nombre, 'descripcion' => $desc, 'caratula' => $caratula];
    }
    
    public function editarPlaylist($id, $nombre, $desc, $caratula) {
        if($caratula) {
            $this->pdo->prepare("UPDATE playlists SET nombre=?, descripcion=?, caratula=? WHERE id=?")->execute([$nombre, $desc, $caratula, $id]);
        } else {
            $this->pdo->prepare("UPDATE playlists SET nombre=?, descripcion=? WHERE id=?")->execute([$nombre, $desc, $id]);
        }
        Logger::registrar($this->pdo, 'EDITAR', 'playlists', $id, "Se editó la playlist '$nombre'.");
        return ['id' => $id, 'nombre' => $nombre, 'descripcion' => $desc, 'caratula' => $caratula];
    }
    
    public function eliminarPlaylist($id) {
        $stmt = $this->pdo->prepare("SELECT nombre FROM playlists WHERE id=?"); 
        $stmt->execute([$id]); 
        $nombre = $stmt->fetchColumn() ?: 'Desconocida';

        $this->pdo->prepare("UPDATE playlists SET estado = 0 WHERE id=?")->execute([$id]);
        Logger::registrar($this->pdo, 'ELIMINAR', 'playlists', $id, "Se eliminó lógicamente la playlist '$nombre'.");
    }
    
    public function agregarAPlaylist($pl_id, $can_id) {
        $check = $this->pdo->prepare("SELECT COUNT(*) FROM playlist_canciones WHERE playlist_id = ? AND cancion_id = ?");
        $check->execute([$pl_id, $can_id]);
        if ($check->fetchColumn() > 0) throw new Exception("duplicada"); 

        $stmtCan = $this->pdo->prepare("SELECT titulo FROM canciones WHERE id = ?");
        $stmtCan->execute([$can_id]);
        $titulo_cancion = $stmtCan->fetchColumn() ?: "Canción Desconocida";

        $stmtPl = $this->pdo->prepare("SELECT nombre FROM playlists WHERE id = ?");
        $stmtPl->execute([$pl_id]);
        $nombre_playlist = $stmtPl->fetchColumn() ?: "Playlist Desconocida";

        $this->pdo->prepare("INSERT INTO playlist_canciones (playlist_id, cancion_id) VALUES (?, ?)")->execute([$pl_id, $can_id]);
        Logger::registrar($this->pdo, 'EDITAR', 'playlist_canciones', $pl_id, "Se vinculó la pista '$titulo_cancion' a la playlist '$nombre_playlist'.");
    }
    
    public function quitarDePlaylist($pl_id, $can_id) {
        $stmtCan = $this->pdo->prepare("SELECT titulo FROM canciones WHERE id = ?");
        $stmtCan->execute([$can_id]);
        $titulo_cancion = $stmtCan->fetchColumn() ?: "Canción Desconocida";

        $stmtPl = $this->pdo->prepare("SELECT nombre FROM playlists WHERE id = ?");
        $stmtPl->execute([$pl_id]);
        $nombre_playlist = $stmtPl->fetchColumn() ?: "Playlist Desconocida";

        $this->pdo->prepare("DELETE FROM playlist_canciones WHERE playlist_id=? AND cancion_id=?")->execute([$pl_id, $can_id]);
        Logger::registrar($this->pdo, 'EDITAR', 'playlist_canciones', $pl_id, "Se desvinculó la pista '$titulo_cancion' de la playlist '$nombre_playlist'.");
    }

    /* ================= CANCIONES Y ITUNES ================= */
    public function subirCancion($titulo, $alb_id, $ruta, $duracion, $arts, $caratula = null) {
        $this->pdo->prepare("INSERT INTO canciones (album_id, titulo, ruta_archivo, duracion, caratula) VALUES (?, ?, ?, ?, ?)")->execute([$alb_id, $titulo, $ruta, $duracion, $caratula]);
        $id = $this->pdo->lastInsertId();
        
        $stmt = $this->pdo->prepare("INSERT INTO cancion_artistas (cancion_id, artist_id) VALUES (?, ?)");
        foreach($arts as $a) {
            $stmt->execute([$id, intval($a)]);
        }
        
        Logger::registrar($this->pdo, 'INSERTAR', 'canciones', $id, "Se subió la canción '$titulo'.");
        return $this->obtenerDetallesCancion($id);
    }
    
    public function editarCancion($id, $titulo, $alb_id, $ruta, $duracion, $arts) {
        // Lógica inteligente: Si se asigna un álbum, limpiamos la carátula individual 
        // para que la base de datos herede automáticamente la carátula del Álbum.
        $set_caratula = $alb_id ? ", caratula=NULL" : "";

        if($ruta) {
            $this->pdo->prepare("UPDATE canciones SET titulo=?, album_id=?, ruta_archivo=?, duracion=? $set_caratula WHERE id=?")->execute([$titulo, $alb_id, $ruta, $duracion, $id]);
        } else {
            $this->pdo->prepare("UPDATE canciones SET titulo=?, album_id=? $set_caratula WHERE id=?")->execute([$titulo, $alb_id, $id]);
        }
        
        $this->pdo->prepare("DELETE FROM cancion_artistas WHERE cancion_id=?")->execute([$id]);
        $stmt = $this->pdo->prepare("INSERT INTO cancion_artistas (cancion_id, artist_id) VALUES (?, ?)");
        foreach($arts as $a) {
            $stmt->execute([$id, intval($a)]);
        }
        
        Logger::registrar($this->pdo, 'EDITAR', 'canciones', $id, "Se editó la canción '$titulo'.");
        return $this->obtenerDetallesCancion($id);
    }

    public function obtenerDetallesCancion($id) {
        $query = "SELECT c.id, c.titulo, c.ruta_archivo, c.album_id, c.fecha_subida, c.duracion,
                  IFNULL(alb.titulo, 'Single / Sencillo') AS album,
                  IFNULL(c.caratula, IFNULL(alb.caratula, 'assets/uploads/caratulas/default.jpg')) AS caratula,
                  (SELECT GROUP_CONCAT(art.nombre SEPARATOR ', ') FROM cancion_artistas ca INNER JOIN artistas art ON ca.artist_id = art.id WHERE ca.cancion_id = c.id) AS artistas_nombres,
                  (SELECT GROUP_CONCAT(art.id SEPARATOR ',') FROM cancion_artistas ca INNER JOIN artistas art ON ca.artist_id = art.id WHERE ca.cancion_id = c.id) AS artistas_ids,
                  IFNULL((SELECT GROUP_CONCAT(pl.nombre SEPARATOR ', ') FROM playlist_canciones plc INNER JOIN playlists pl ON plc.playlist_id = pl.id WHERE plc.cancion_id = c.id), '') AS playlists_nombres
                  FROM canciones c LEFT JOIN albumes alb ON c.album_id = alb.id WHERE c.id = ?";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public function eliminarCancion($id) {
        $stmt = $this->pdo->prepare("SELECT ruta_archivo, titulo FROM canciones WHERE id=?"); 
        $stmt->execute([$id]); 
        $data = $stmt->fetch();
        
        $this->pdo->prepare("UPDATE canciones SET estado = 0 WHERE id=?")->execute([$id]);
        Logger::registrar($this->pdo, 'ELIMINAR', 'canciones', $id, "Se eliminó lógicamente la canción '{$data['titulo']}'.");
        return $data['ruta_archivo'] ?? null;
    }

    // Funciones Helper para el escáner de iTunes
    public function obtenerNombresArtistasPorIds($ids) {
        if (empty($ids)) return "";
        $in = str_repeat('?,', count($ids) - 1) . '?';
        $stmt = $this->pdo->prepare("SELECT nombre FROM artistas WHERE id IN ($in)");
        $stmt->execute($ids);
        $nombres = $stmt->fetchAll(PDO::FETCH_COLUMN);
        return implode(' ', $nombres);
    }

    public function obtenerCancionesSinCaratula() {
        $query = "SELECT c.id, c.titulo, 
                  (SELECT GROUP_CONCAT(artist_id) FROM cancion_artistas WHERE cancion_id = c.id) as artista_ids
                  FROM canciones c 
                  WHERE c.album_id IS NULL AND (c.caratula IS NULL OR c.caratula = '') AND c.estado = 1";
        return $this->pdo->query($query)->fetchAll(PDO::FETCH_ASSOC);
    }

    public function actualizarCaratulaCancion($id, $caratula) {
        $this->pdo->prepare("UPDATE canciones SET caratula = ? WHERE id = ?")->execute([$caratula, $id]);
    }

    /* ================= BACKUP ================= */
    public function exportarBaseDatos() {
        $tablas = ['canciones', 'artistas', 'albumes', 'playlists', 'playlist_canciones', 'cancion_artistas', 'albumes_artistas'];
        $db_data = [];
        foreach($tablas as $tabla) {
            $stmt = $this->pdo->query("SELECT * FROM $tabla");
            $db_data[$tabla] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        Logger::registrar($this->pdo, 'EXPORTAR', 'sistema', null, "Se generó un backup de toda la base de datos.");
        return $db_data;
    }

    public function validarArtistaUnico($nombre, $id_ignorar = 0) {
        // Busca si el nombre ya existe, excluyendo el ID actual (útil para cuando editas)
        $sql = "SELECT id FROM artistas WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(:nombre)) AND id != :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':nombre' => $nombre,
            ':id' => $id_ignorar
        ]);
        
        if ($stmt->fetch()) {
            throw new Exception("El artista '" . trim($nombre) . "' ya existe en el catálogo.");
        }
    }
}
?>
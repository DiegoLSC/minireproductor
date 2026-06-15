<?php
// models/EditorBD.php

class EditorBD {
    private $pdo;
    
    public function __construct($pdo) { 
        $this->pdo = $pdo; 
    }

    /* ================= ARTISTAS ================= */
    public function crearArtista($nombre, $foto) {
        $this->pdo->prepare("INSERT INTO artistas (nombre, foto) VALUES (?, ?)")->execute([$nombre, $foto]);
    }
    public function editarArtista($id, $nombre, $foto) {
        if ($foto) $this->pdo->prepare("UPDATE artistas SET nombre=?, foto=? WHERE id=?")->execute([$nombre, $foto, $id]);
        else $this->pdo->prepare("UPDATE artistas SET nombre=? WHERE id=?")->execute([$nombre, $id]);
    }
    public function eliminarArtista($id) {
        $ruta = $this->pdo->prepare("SELECT foto FROM artistas WHERE id=?"); $ruta->execute([$id]); $foto = $ruta->fetchColumn();
        $this->pdo->prepare("DELETE FROM cancion_artistas WHERE artist_id=?")->execute([$id]);
        $this->pdo->prepare("DELETE FROM albumes_artistas WHERE artista_id=?")->execute([$id]);
        $this->pdo->prepare("DELETE FROM artistas WHERE id=?")->execute([$id]);
        return $foto; // Retorna la ruta física para que el controlador borre el archivo
    }

    /* ================= ÁLBUMES ================= */
    public function crearAlbum($titulo, $anio, $caratula, $arts) {
        $this->pdo->prepare("INSERT INTO albumes (titulo, caratula, anio) VALUES (?, ?, ?)")->execute([$titulo, $caratula, $anio]);
        $id = $this->pdo->lastInsertId();
        $stmt = $this->pdo->prepare("INSERT INTO albumes_artistas (album_id, artista_id) VALUES (?, ?)");
        foreach($arts as $a) $stmt->execute([$id, intval($a)]);
    }
    public function editarAlbum($id, $titulo, $anio, $caratula, $arts) {
        if($caratula) $this->pdo->prepare("UPDATE albumes SET titulo=?, caratula=?, anio=? WHERE id=?")->execute([$titulo, $caratula, $anio, $id]);
        else $this->pdo->prepare("UPDATE albumes SET titulo=?, anio=? WHERE id=?")->execute([$titulo, $anio, $id]);
        $this->pdo->prepare("DELETE FROM albumes_artistas WHERE album_id=?")->execute([$id]);
        $stmt = $this->pdo->prepare("INSERT INTO albumes_artistas (album_id, artista_id) VALUES (?, ?)");
        foreach($arts as $a) $stmt->execute([$id, intval($a)]);
    }
    public function eliminarAlbum($id) {
        $ruta = $this->pdo->prepare("SELECT caratula FROM albumes WHERE id=?"); $ruta->execute([$id]); $caratula = $ruta->fetchColumn();
        $this->pdo->prepare("UPDATE canciones SET album_id=NULL WHERE album_id=?")->execute([$id]);
        $this->pdo->prepare("DELETE FROM albumes_artistas WHERE album_id=?")->execute([$id]);
        $this->pdo->prepare("DELETE FROM albumes WHERE id=?")->execute([$id]);
        return $caratula;
    }

    /* ================= PLAYLISTS ================= */
    public function crearPlaylist($nombre, $desc, $caratula) {
        $this->pdo->prepare("INSERT INTO playlists (nombre, descripcion, caratula) VALUES (?, ?, ?)")->execute([$nombre, $desc, $caratula]);
    }
    public function editarPlaylist($id, $nombre, $desc, $caratula) {
        if($caratula) $this->pdo->prepare("UPDATE playlists SET nombre=?, descripcion=?, caratula=? WHERE id=?")->execute([$nombre, $desc, $caratula, $id]);
        else $this->pdo->prepare("UPDATE playlists SET nombre=?, descripcion=? WHERE id=?")->execute([$nombre, $desc, $id]);
    }
    public function eliminarPlaylist($id) {
        $this->pdo->prepare("DELETE FROM playlist_canciones WHERE playlist_id=?")->execute([$id]);
        $this->pdo->prepare("DELETE FROM playlists WHERE id=?")->execute([$id]);
    }
    public function agregarAPlaylist($pl_id, $can_id) {
        $this->pdo->prepare("INSERT IGNORE INTO playlist_canciones (playlist_id, cancion_id) VALUES (?, ?)")->execute([$pl_id, $can_id]);
    }
    public function quitarDePlaylist($pl_id, $can_id) {
        $this->pdo->prepare("DELETE FROM playlist_canciones WHERE playlist_id=? AND cancion_id=?")->execute([$pl_id, $can_id]);
    }

    /* ================= CANCIONES ================= */
    public function subirCancion($titulo, $alb_id, $ruta, $duracion, $arts) {
        $this->pdo->prepare("INSERT INTO canciones (album_id, titulo, ruta_archivo, duracion) VALUES (?, ?, ?, ?)")->execute([$alb_id, $titulo, $ruta, $duracion]);
        $id = $this->pdo->lastInsertId();
        $stmt = $this->pdo->prepare("INSERT INTO cancion_artistas (cancion_id, artist_id) VALUES (?, ?)");
        foreach($arts as $a) $stmt->execute([$id, intval($a)]);
    }
    public function editarCancion($id, $titulo, $alb_id, $ruta, $duracion, $arts) {
        if($ruta) $this->pdo->prepare("UPDATE canciones SET titulo=?, album_id=?, ruta_archivo=?, duracion=? WHERE id=?")->execute([$titulo, $alb_id, $ruta, $duracion, $id]);
        else $this->pdo->prepare("UPDATE canciones SET titulo=?, album_id=? WHERE id=?")->execute([$titulo, $alb_id, $id]);
        
        $this->pdo->prepare("DELETE FROM cancion_artistas WHERE cancion_id=?")->execute([$id]);
        $stmt = $this->pdo->prepare("INSERT INTO cancion_artistas (cancion_id, artist_id) VALUES (?, ?)");
        foreach($arts as $a) $stmt->execute([$id, intval($a)]);
    }
    public function eliminarCancion($id) {
        $ruta = $this->pdo->prepare("SELECT ruta_archivo FROM canciones WHERE id=?"); $ruta->execute([$id]); $archivo = $ruta->fetchColumn();
        $this->pdo->prepare("DELETE FROM cancion_artistas WHERE cancion_id=?")->execute([$id]);
        $this->pdo->prepare("DELETE FROM playlist_canciones WHERE cancion_id=?")->execute([$id]);
        $this->pdo->prepare("DELETE FROM canciones WHERE id=?")->execute([$id]);
        return $archivo;
    }

    /* ================= BACKUP ================= */
    public function exportarBaseDatos() {
        $tablas = ['canciones', 'artistas', 'albumes', 'playlists', 'playlist_canciones', 'cancion_artistas', 'albumes_artistas'];
        $db_data = [];
        foreach($tablas as $tabla) {
            $stmt = $this->pdo->query("SELECT * FROM $tabla");
            $db_data[$tabla] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        return $db_data;
    }
}
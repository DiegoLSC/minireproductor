<?php
// models/Catalogo.php

class Catalogo {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function obtenerArtistas() {
        return $this->pdo->query("SELECT id, nombre, foto FROM artistas ORDER BY nombre ASC")->fetchAll(PDO::FETCH_ASSOC);
    }

    public function obtenerPlaylists() {
        return $this->pdo->query("SELECT id, nombre, descripcion FROM playlists ORDER BY nombre ASC")->fetchAll(PDO::FETCH_ASSOC);
    }

    public function obtenerAlbumes() {
        $query = "
            SELECT 
                a.id, a.titulo, a.caratula, a.anio,
                GROUP_CONCAT(art.nombre SEPARATOR ', ') AS artistas_nombres,
                GROUP_CONCAT(art.id SEPARATOR ',') AS artistas_ids
            FROM albumes a
            LEFT JOIN albumes_artistas aa ON a.id = aa.album_id
            LEFT JOIN artistas art ON aa.artista_id = art.id
            GROUP BY a.id
            ORDER BY a.titulo ASC
        ";
        return $this->pdo->query($query)->fetchAll(PDO::FETCH_ASSOC);
    }
}
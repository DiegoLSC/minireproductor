<?php
// models/Cancion.php

class Cancion {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function obtenerTodas($orden = 'DESC') {
        // Asegurarnos de que el orden sea seguro
        $orden = ($orden === 'ASC') ? 'ASC' : 'DESC';

        $query = "
            SELECT 
                c.id, c.titulo, c.ruta_archivo, c.album_id, c.fecha_subida, c.duracion,
                IFNULL(alb.titulo, 'Single / Sencillo') AS album, 
                IFNULL(alb.caratula, 'assets/uploads/caratulas/default.jpg') AS caratula,
                
                (SELECT GROUP_CONCAT(art.nombre SEPARATOR ', ') 
                 FROM cancion_artistas ca 
                 INNER JOIN artistas art ON ca.artist_id = art.id AND art.estado = 1 
                 WHERE ca.cancion_id = c.id) AS artistas_nombres,
                 
                (SELECT GROUP_CONCAT(art.id SEPARATOR ',') 
                 FROM cancion_artistas ca 
                 INNER JOIN artistas art ON ca.artist_id = art.id AND art.estado = 1 
                 WHERE ca.cancion_id = c.id) AS artistas_ids,
                 
                IFNULL((SELECT GROUP_CONCAT(pl.nombre SEPARATOR ', ') 
                        FROM playlist_canciones plc 
                        INNER JOIN playlists pl ON plc.playlist_id = pl.id AND pl.estado = 1 
                        WHERE plc.cancion_id = c.id), '') AS playlists_nombres
                        
            FROM canciones c
            LEFT JOIN albumes alb ON c.album_id = alb.id AND alb.estado = 1
            WHERE c.estado = 1
            ORDER BY c.fecha_subida $orden
        ";

        return $this->pdo->query($query)->fetchAll(PDO::FETCH_ASSOC);
    }
}
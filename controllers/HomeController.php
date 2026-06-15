<?php
// controllers/HomeController.php

require_once 'models/Cancion.php';
require_once 'models/Catalogo.php';

class HomeController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function index() {
        // 1. Instanciar los modelos
        $modeloCancion = new Cancion($this->pdo);
        $modeloCatalogo = new Catalogo($this->pdo);

        // 2. Capturar parámetros de la URL (el orden)
        $orden = (isset($_GET['orden']) && $_GET['orden'] === 'asc') ? 'ASC' : 'DESC';

        // 3. Obtener todos los datos necesarios
        $canciones = $modeloCancion->obtenerTodas($orden);
        $artistas = $modeloCatalogo->obtenerArtistas();
        $playlists = $modeloCatalogo->obtenerPlaylists();
        $albumes = $modeloCatalogo->obtenerAlbumes();

        // 4. Cargar las vistas (esto armará el HTML completo)
        require_once 'views/layout/header.php';
        require_once 'views/home.php';
        require_once 'views/layout/footer.php';
    }
}
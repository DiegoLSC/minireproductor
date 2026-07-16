<?php
// services/DeezerService.php
// Responsabilidad: Gestionar peticiones HTTP externas hacia la API de Deezer y orquestar las portadas.

class DeezerService {
    private $fileService;

    // Inyectamos el servicio de archivos en el constructor
    public function __construct($fileService) {
        $this->fileService = $fileService;
    }

    // Motor HTTP mediante cURL
    public function peticionGet($url) {
        if (!function_exists('curl_init')) {
            throw new Exception("La extensión cURL no está habilitada en PHP.");
        }
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        ]);
        $respuesta = curl_exec($ch);
        
        if ($respuesta === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("Error de cURL: ".$error);
        }
        
        $codigo = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($codigo != 200) {
            throw new Exception("Deezer respondió con HTTP ".$codigo);
        }
        return $respuesta;
    }

    // Descarga la imagen y le pide al FileService que la guarde
    public function descargarImagenDesdeUrl($url, $carpeta, $prefijo) {
        if (empty($url)) return null;
        $imgData = false;

        // Intento 1: cURL Seguro
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $imgData = @curl_exec($ch);
            curl_close($ch);
        }

        // Intento 2: Fallback (file_get_contents)
        if (!$imgData) {
            $opciones = ["ssl" => ["verify_peer" => false, "verify_peer_name" => false]];
            $contexto = stream_context_create($opciones);
            $imgData = @file_get_contents($url, false, $contexto);
        }

        if (!$imgData) throw new Exception("No se pudo descargar la imagen de Deezer.");

        // Delegamos el almacenamiento físico
        return $this->fileService->guardarArchivoFisico($imgData, $carpeta, $prefijo);
    }

    // Lógica de búsqueda cruzada inteligente
    public function buscarCaratulaEnDeezer($titulo, $artistas, $entidad = 'track') {
        $titulo_limpio = trim(preg_replace('/\(.*?\)|\[.*?\]|- .*/', '', $titulo));
        $artista_limpio = trim(explode(',', $artistas)[0]);
        
        if ($entidad === 'artist') {
            $query = urlencode($titulo_limpio);
            $url = "https://api.deezer.com/search/artist?q={$query}&limit=1";
        } elseif ($entidad === 'album') {
            $query = urlencode('album:"' . $titulo_limpio . '" artist:"' . $artista_limpio . '"');
            $url = "https://api.deezer.com/search/album?q={$query}&limit=1";
        } else {
            $query = urlencode('track:"' . $titulo_limpio . '" artist:"' . $artista_limpio . '"');
            $url = "https://api.deezer.com/search/track?q={$query}&limit=1";
        }

        $res = $this->peticionGet($url);
        $data = json_decode($res, true);

        // Plan B: Buscar solo por título si falla el cruce exacto
        if (empty($data['data']) && $entidad !== 'artist') {
            $query = urlencode($titulo_limpio);
            $urlFallback = "https://api.deezer.com/search/{$entidad}?q={$query}&limit=1";
            $res = $this->peticionGet($urlFallback);
            $data = json_decode($res, true);
        }

        if (!empty($data['data'])) {
            if ($entidad === 'artist' && isset($data['data'][0]['picture_xl'])) {
                return $this->descargarImagenDesdeUrl($data['data'][0]['picture_xl'], 'artistas', 'art');
            } elseif ($entidad === 'album' && isset($data['data'][0]['cover_xl'])) {
                return $this->descargarImagenDesdeUrl($data['data'][0]['cover_xl'], 'caratulas', 'cov');
            } elseif ($entidad === 'track' && isset($data['data'][0]['album']['cover_xl'])) {
                return $this->descargarImagenDesdeUrl($data['data'][0]['album']['cover_xl'], 'caratulas', 'cov');
            }
        }
        return null;
    }
}
?>
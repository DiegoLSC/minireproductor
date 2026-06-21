// assets/js/audioEngine.js

const audio = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const progressBar = document.getElementById('progress-bar');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
const shuffleBtn = document.getElementById('shuffle-btn');

let listaDeReproduccion = [];
let listaDeReproduccionOriginal = []; // Guarda la cola intacta sin aleatorio
let indiceActual = -1;

// Recuperar el estado de aleatorio de la sesión anterior
let modoAleatorio = localStorage.getItem('nebula_shuffle') === 'true';
window.modoRepetirActivo = false; 

// ==========================================
// PERSISTENCIA: NÚCLEO DE RECUPERACIÓN DE SESIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const botonShuffleNativo = document.getElementById('shuffle-btn');
    if (modoAleatorio && botonShuffleNativo) {
        botonShuffleNativo.className = "btn text-success fs-5 p-0 lh-1";
        console.log("[AudioEngine] Modo Aleatorio restaurado y activo (Visual: Verde)");
    }

    // CLAVE: Al volver a entrar a la página, recuperamos la cola exacta del LocalStorage
    const listaGuardada = localStorage.getItem('nebula_lista_reproduccion');
    const originalGuardada = localStorage.getItem('nebula_lista_original');
    const indiceGuardado = localStorage.getItem('nebula_indice_actual');

    if (listaGuardada && originalGuardada && indiceGuardado !== null) {
        listaDeReproduccion = JSON.parse(listaGuardada);
        listaDeReproduccionOriginal = JSON.parse(originalGuardada);
        indiceActual = parseInt(indiceGuardado);
        console.log(`[AudioEngine] Cola persistente restaurada (${listaDeReproduccion.length} canciones en memoria).`);
        
        // Si el panel lateral estaba abierto por algún motivo, dibujarlo de inmediato
        if (document.getElementById('colaPanel') && document.getElementById('colaPanel').classList.contains('activo')) {
            renderizarColaVisual();
        }
    }
});

// Función asistente para guardar el estado exacto de la cola en cada cambio
function guardarEstadoCola() {
    localStorage.setItem('nebula_lista_reproduccion', JSON.stringify(listaDeReproduccion));
    localStorage.setItem('nebula_lista_original', JSON.stringify(listaDeReproduccionOriginal));
    localStorage.setItem('nebula_indice_actual', indiceActual);
}

function actualizarColaReproduccion() {
    const cancionGuardada = window.rutaEnReproduccion || localStorage.getItem('nebula_track_ruta');

    listaDeReproduccion = [];
    if (typeof filasFiltradasGlobal !== 'undefined') {
        filasFiltradasGlobal.forEach((fila) => {
            listaDeReproduccion.push({
                ruta: fila.getAttribute('data-ruta'),
                titulo: fila.getAttribute('data-titulo'),
                artista: fila.getAttribute('data-artista'),
                caratula: fila.getAttribute('data-caratula')
            });
        });
    }

    // Tomamos una "foto" de la cola original en el instante en que se crea
    listaDeReproduccionOriginal = [...listaDeReproduccion];

    if (cancionGuardada) {
        indiceActual = listaDeReproduccion.findIndex(c => c.ruta === cancionGuardada);
        if (modoAleatorio && indiceActual !== -1) {
            mezclarColaActual();
        }
    } else {
        indiceActual = -1;
    }
    
    guardarEstadoCola(); // Almacenamos el cambio inicial
}

function reproducirDesdeFila(elementoFila) {
    actualizarColaReproduccion();
    const rutaBusca = elementoFila.getAttribute('data-ruta');
    indiceActual = listaDeReproduccion.findIndex(cancion => cancion.ruta === rutaBusca);
    
    if (indiceActual !== -1) {
        if (modoAleatorio) mezclarColaActual();
        const track = listaDeReproduccion[indiceActual];
        reproducirCancion(track.ruta, track.titulo, track.artista, track.caratula);
    }
    
    guardarEstadoCola(); // Almacenamos tras cambiar canción base
}

function reproducirCancion(ruta, titulo, artist, caratula, autoPlay = true) {
    localStorage.setItem('nebula_track_ruta', ruta);
    localStorage.setItem('nebula_track_titulo', titulo);
    localStorage.setItem('nebula_track_artista', artist);
    localStorage.setItem('nebula_track_caratula', caratula);

    audio.src = ruta;
    window.rutaEnReproduccion = ruta; 
    document.getElementById('current-title').innerText = titulo;
    document.getElementById('current-artist').innerText = artist;
    
    const coverImg = document.getElementById('current-cover');
    const iconContainer = document.getElementById('player-icon-container');
    
    if (!caratula || caratula.includes('default.jpg') || caratula.trim() === '') {
        coverImg.classList.add('d-none');
        iconContainer.classList.remove('d-none');
    } else {
        coverImg.src = caratula;
        coverImg.classList.remove('d-none');
        iconContainer.classList.add('d-none');
    }

    document.querySelectorAll('.target-row').forEach(fila => {
        fila.classList.remove('bg-dark-subtle', 'border-start', 'border-danger');
        const textoTitulo = fila.querySelector('.title-col span');
        if (textoTitulo) textoTitulo.classList.remove('text-success');
    });

    const filaActiva = Array.from(document.querySelectorAll('.target-row')).find(f => f.getAttribute('data-ruta') === ruta);
    if (filaActiva) {
        filaActiva.classList.add('bg-dark-subtle', 'border-start', 'border-danger');
        const textoTituloActivo = filaActiva.querySelector('.title-col span');
        if (textoTituloActivo) textoTituloActivo.classList.add('text-success');
    }

    if (autoPlay) {
        audio.play().catch(e => console.log("Auto-play bloqueado por el navegador", e));
        playBtn.innerHTML = '<i class="bi bi-pause-fill fs-3 text-black"></i>';
    } else {
        playBtn.innerHTML = '<i class="bi bi-play-fill fs-3 text-black"></i>';
    }
    
    if (document.getElementById('colaPanel').classList.contains('activo')) renderizarColaVisual();
    if (typeof actualizarPantallaBloqueo === 'function') actualizarPantallaBloqueo(titulo, artist, 'NebulaPlayer', caratula);
}

function togglePlay() {
    if (!audio.src) return;
    if (audio.paused) {
        audio.play();
        playBtn.innerHTML = '<i class="bi bi-pause-fill fs-3 text-black"></i>';
    } else {
        audio.pause();
        playBtn.innerHTML = '<i class="bi bi-play-fill fs-3 text-black"></i>';
    }
}

function siguienteCancion() {
    if (listaDeReproduccion.length === 0) actualizarColaReproduccion();
    if (listaDeReproduccion.length === 0) return;

    indiceActual++;
    if (indiceActual >= listaDeReproduccion.length) indiceActual = 0; 
    const track = listaDeReproduccion[indiceActual];
    reproducirCancion(track.ruta, track.titulo, track.artista, track.caratula);
    
    guardarEstadoCola(); // Almacenamos el nuevo índice actual
}

function cancionAnterior() {
    if (listaDeReproduccion.length === 0) actualizarColaReproduccion();
    if (listaDeReproduccion.length === 0) return;

    indiceActual--;
    if (indiceActual < 0) indiceActual = listaDeReproduccion.length - 1;
    const track = listaDeReproduccion[indiceActual];
    reproducirCancion(track.ruta, track.titulo, track.artista, track.caratula);
    
    guardarEstadoCola(); // Almacenamos el nuevo índice actual
}

function mezclarColaActual() {
    if (indiceActual === -1 || listaDeReproduccion.length <= 1) return;

    const cancionActual = listaDeReproduccion[indiceActual];
    const restoDeCanciones = listaDeReproduccion.filter((_, index) => index !== indiceActual);

    for (let i = restoDeCanciones.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [restoDeCanciones[i], restoDeCanciones[j]] = [restoDeCanciones[j], restoDeCanciones[i]];
    }

    listaDeReproduccion = [cancionActual, ...restoDeCanciones];
    indiceActual = 0;
    
    guardarEstadoCola();
}

function toggleShuffle() {
    modoAleatorio = !modoAleatorio;
    localStorage.setItem('nebula_shuffle', modoAleatorio); 

    if (modoAleatorio) {
        shuffleBtn.className = "btn text-success fs-5 p-0 lh-1";
        if (indiceActual !== -1) {
            mezclarColaActual(); 
            if (document.getElementById('colaPanel').classList.contains('activo')) renderizarColaVisual();
        }
    } else {
        shuffleBtn.className = "btn text-secondary fs-5 p-0 lh-1";
        if (indiceActual !== -1) {
            const rutaActual = listaDeReproduccion[indiceActual].ruta;
            
            if (listaDeReproduccionOriginal.length > 0) {
                listaDeReproduccion = [...listaDeReproduccionOriginal];
            } else {
                actualizarColaReproduccion(); 
            }

            indiceActual = listaDeReproduccion.findIndex(c => c.ruta === rutaActual);
            if (document.getElementById('colaPanel').classList.contains('activo')) renderizarColaVisual();
        }
    }
    
    guardarEstadoCola(); // Almacenamos el cambio del modo shuffle en la lista
}

function ajustarTiempo(valorPorcentaje) {
    if (!audio.duration) return;
    audio.currentTime = (valorPorcentaje / 100) * audio.duration;
}

audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        const porcentaje = (audio.currentTime / audio.duration) * 100;
        progressBar.value = porcentaje;
        timeCurrent.innerText = formatearTiempo(audio.currentTime);
        localStorage.setItem('nebula_track_tiempo', audio.currentTime);
    }
});

audio.addEventListener('loadedmetadata', () => { timeTotal.innerText = formatearTiempo(audio.duration); });
audio.onended = function() { window.modoRepetirActivo ? (audio.currentTime = 0, audio.play()) : siguienteCancion(); };

// GESTIÓN DEL PANEL DE COLA VISUAL
function togglePanelCola() {
    const panel = document.getElementById('colaPanel');
    const botonCola = document.getElementById('btn-abrir-cola');
    panel.classList.toggle('activo');
    if (panel.classList.contains('activo')) {
        botonCola.className = "btn text-success p-0 fs-5 lh-1";
        
        if (listaDeReproduccion.length === 0) actualizarColaReproduccion();
        
        renderizarColaVisual();
        inicializarDragAndDropCola(); 
    } else botonCola.className = "btn text-secondary p-0 fs-5 lh-1";
}

function renderizarColaVisual() {
    const ahoraTitulo = document.getElementById('current-title').innerText;
    const ahoraArtista = document.getElementById('current-artist').innerText;
    document.getElementById('cola-now-title').innerText = `${ahoraTitulo} — ${ahoraArtista}`;
    const contenedorLista = document.getElementById('lista-cola-dinamica');
    contenedorLista.innerHTML = "";

    if (listaDeReproduccion.length === 0 || indiceActual === -1) {
        contenedorLista.innerHTML = `<li class="list-group-item bg-transparent text-secondary border-0 small text-center py-4"><i class="bi bi-music-note-list d-block fs-3 mb-2 opacity-50"></i>La cola está vacía.</li>`;
        return;
    }

    let posicionEnCola = 1;
    for (let i = indiceActual + 1; i < listaDeReproduccion.length; i++) {
        const track = listaDeReproduccion[i];
        const indexOrigen = i; 
        
        const li = document.createElement('li');
        li.setAttribute('data-index', indexOrigen);
        li.className = "list-group-item bg-black border-0 border-bottom border-secondary border-opacity-10 d-flex align-items-center justify-content-between p-2.5 text-white small song-row-cola hover-bg-dark";
        li.style.cursor = "pointer"; 
        
        li.innerHTML = `
            <div class="d-flex align-items-center flex-grow-1 pe-2 text-truncate" style="max-width: 200px;">
                <i class="bi bi-grip-vertical text-secondary me-2 drag-handle" style="cursor: grab; font-size: 1.2rem;" onclick="event.stopPropagation();"></i>
                <span class="text-secondary fw-bold me-3 opacity-50" style="min-width: 15px;">${posicionEnCola}</span>
                <div class="text-truncate">
                    <span class="fw-semibold d-block text-truncate text-white" title="${track.titulo}">${track.titulo}</span>
                    <span class="text-secondary small d-block text-truncate" title="${track.artista}">${track.artista}</span>
                </div>
            </div>
            <div class="d-flex gap-1">
                <button type="button" class="btn btn-transparent btn-sm p-1 text-danger opacity-75 hover-opacity-100 btn-eliminar-cola" onclick="quitarDeColaTemporal(${indexOrigen}); event.stopPropagation();"><i class="bi bi-x-lg"></i></button>
            </div>
        `;
        contenedorLista.appendChild(li);
        posicionEnCola++;
    }
    if (contenedorLista.innerHTML === "") contenedorLista.innerHTML = `<li class="list-group-item bg-transparent text-secondary border-0 small text-center py-4"><i class="bi bi-check-circle d-block fs-4 mb-2 text-danger opacity-50"></i>No hay más canciones en espera.</li>`;
}

function quitarDeColaTemporal(indexEliminar) {
    listaDeReproduccion.splice(indexEliminar, 1);
    guardarEstadoCola(); // Almacenamos tras eliminar un track de la cola
    renderizarColaVisual();
}

function inicializarDragAndDropCola() {
    const contenedorLista = document.getElementById('lista-cola-dinamica');
    if (!contenedorLista) return;

    if (window.sortableCola) {
        window.sortableCola.destroy();
    }

    window.sortableCola = new Sortable(contenedorLista, {
        handle: '.drag-handle',
        animation: 150,        
        ghostClass: 'bg-secondary', 
        delay: 100,            
        delayOnTouchOnly: true, 
        touchStartThreshold: 5, 
        onEnd: function (evt) {
            if (evt.oldIndex === evt.newIndex) return;
            const indexRealAntiguo = evt.oldIndex + indiceActual + 1;
            const indexRealNuevo = evt.newIndex + indiceActual + 1;

            const cancionMovida = listaDeReproduccion.splice(indexRealAntiguo, 1)[0];
            cancionMovida.isManual = true; 
            listaDeReproduccion.splice(indexRealNuevo, 0, cancionMovida);

            if (listaDeReproduccionOriginal.length > 0) {
                const indexOrigAntiguo = listaDeReproduccionOriginal.findIndex(c => c.ruta === cancionMovida.ruta);
                if (indexOrigAntiguo !== -1) {
                    listaDeReproduccionOriginal.splice(indexOrigAntiguo, 1);
                }
                
                const vecinoArriba = listaDeReproduccion[indexRealNuevo - 1];
                let indexOrigNuevo = 0;
                if (vecinoArriba) {
                    indexOrigNuevo = listaDeReproduccionOriginal.findIndex(c => c.ruta === vecinoArriba.ruta) + 1;
                }
                listaDeReproduccionOriginal.splice(indexOrigNuevo, 0, cancionMovida);
            }

            guardarEstadoCola(); // Almacenamos el orden reajustado por el drag-and-drop
            renderizarColaVisual();
        }
    });
}

function irACancionActual() {
    if (!window.rutaEnReproduccion) return; 

    const indexVisual = filasFiltradasGlobal.findIndex(fila => fila.getAttribute('data-ruta') === window.rutaEnReproduccion);

    if (indexVisual !== -1) {
        const paginaDestino = Math.floor(indexVisual / cancionesPorPagina) + 1;
        
        if (paginaActual !== paginaDestino) {
            cambiarPagina(paginaDestino);
        }

        setTimeout(() => {
            const filaObjetivo = filasFiltradasGlobal[indexVisual];
            if (filaObjetivo) {
                filaObjetivo.scrollIntoView({ behavior: 'smooth', block: 'center' });
                filaObjetivo.style.transition = "background-color 0.4s ease";
                filaObjetivo.style.backgroundColor = "rgba(239, 68, 68, 0.4)"; 
                setTimeout(() => { filaObjetivo.style.backgroundColor = ""; }, 1200);
            }
        }, 150); 
    } else {
        alert("La canción que está sonando no se encuentra en tu búsqueda actual.");
    }
}

function reproducirDesdeCola(indice) {
    if (indice >= 0 && indice < listaDeReproduccion.length) {
        indiceActual = indice; 
        const track = listaDeReproduccion[indiceActual];
        reproducirCancion(track.ruta, track.titulo, track.artista, track.caratula);
        guardarEstadoCola(); // Guardamos el nuevo índice tras saltar desde la cola
    }
}

// ==========================================
// SISTEMA DE ENCOLADO MANUAL (Añadir a la cola)
// ==========================================
function agregarAColaManual(rutaBuscada) {
    if (listaDeReproduccion.length === 0) {
        actualizarColaReproduccion();
    }

    const fila = document.querySelector(`.target-row[data-ruta="${rutaBuscada}"]`);
    if (!fila) return;

    const nuevoTrack = {
        ruta: fila.getAttribute('data-ruta'),
        titulo: fila.getAttribute('data-titulo'),
        artista: fila.getAttribute('data-artista'),
        caratula: fila.getAttribute('data-caratula'),
        isManual: true 
    };

    const indexFuturo = listaDeReproduccion.findIndex((c, i) => i > indiceActual && c.ruta === rutaBuscada);
    if (indexFuturo !== -1) listaDeReproduccion.splice(indexFuturo, 1);

    let posicionInsertar = indiceActual + 1;
    while (posicionInsertar < listaDeReproduccion.length && listaDeReproduccion[posicionInsertar].isManual) {
        posicionInsertar++;
    }

    listaDeReproduccion.splice(posicionInsertar, 0, nuevoTrack);

    if (listaDeReproduccionOriginal.length > 0) {
        const indexOriginalBorrar = listaDeReproduccionOriginal.findIndex((c, i) => i > indiceActual && c.ruta === rutaBuscada);
        if (indexOriginalBorrar !== -1) listaDeReproduccionOriginal.splice(indexOriginalBorrar, 1);

        let posOrig = listaDeReproduccionOriginal.findIndex(c => c.ruta === listaDeReproduccion[indiceActual]?.ruta) + 1;
        if(posOrig > 0) {
            while (posOrig < listaDeReproduccionOriginal.length && listaDeReproduccionOriginal[posOrig].isManual) posOrig++;
            listaDeReproduccionOriginal.splice(posOrig, 0, nuevoTrack);
        }
    }

    if (!audio.src || audio.src === window.location.href || (!window.rutaEnReproduccion && indiceActual === -1)) {
        indiceActual = 0;
        reproducirCancion(nuevoTrack.ruta, nuevoTrack.titulo, nuevoTrack.artista, nuevoTrack.caratula, false);
    }

    guardarEstadoCola(); // Almacenamos tras inyectar la canción manual

    if (document.getElementById('colaPanel') && document.getElementById('colaPanel').classList.contains('activo')) {
        renderizarColaVisual();
    }

    mostrarNotificacionCola(`"${nuevoTrack.titulo}" se reproducirá a continuación`);

    const menusAbiertos = document.querySelectorAll('.dropdown-menu.show');
    menusAbiertos.forEach(menu => {
        menu.classList.remove('show');
        const botonToggle = menu.previousElementSibling;
        if (botonToggle) {
            botonToggle.classList.remove('show');
            botonToggle.setAttribute('aria-expanded', 'false');
            if (typeof bootstrap !== 'undefined') {
                const bsDropdown = bootstrap.Dropdown.getInstance(botonToggle);
                if (bsDropdown) bsDropdown.hide();
            }
        }
    });
}

function mostrarNotificacionCola(mensaje) {
    let toast = document.getElementById('toast-cola');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-cola';
        toast.className = 'position-fixed bottom-0 start-50 translate-middle-x px-4 py-2 rounded-pill shadow-lg text-white fw-bold d-flex align-items-center gap-2';
        toast.style.backgroundColor = '#141414';
        toast.style.border = '1px solid #dc2626';
        toast.style.zIndex = '9999';
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        toast.style.transform = 'translate(-50%, 20px)'; 
        toast.style.marginBottom = '110px'; 
        document.body.appendChild(toast);
    }
    
    toast.innerHTML = `<i class="bi bi-music-note-list text-danger fs-5"></i> <span>${mensaje}</span>`;
    toast.style.display = 'flex';
    
    void toast.offsetWidth;
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, 0)';
    
    clearTimeout(window.toastColaTimer);
    window.toastColaTimer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, 20px)';
        setTimeout(() => toast.style.display = 'none', 300);
    }, 2500);
}
// assets/js/audioEngine.js

const audio = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const progressBar = document.getElementById('progress-bar');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
const shuffleBtn = document.getElementById('shuffle-btn');

let listaDeReproduccion = [];
let indiceActual = -1;
let modoAleatorio = false;
window.modoRepetirActivo = false; 

function actualizarColaReproduccion() {
    listaDeReproduccion = [];
    filasFiltradasGlobal.forEach((fila) => {
        listaDeReproduccion.push({
            ruta: fila.getAttribute('data-ruta'),
            titulo: fila.getAttribute('data-titulo'),
            artista: fila.getAttribute('data-artista'),
            caratula: fila.getAttribute('data-caratula')
        });
    });
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
}

function reproducirCancion(ruta, titulo, artist, caratula) {
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

    audio.play();
    playBtn.innerHTML = '<i class="bi bi-pause-fill fs-3 text-black"></i>';
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
}

function cancionAnterior() {
    if (listaDeReproduccion.length === 0) actualizarColaReproduccion();
    if (listaDeReproduccion.length === 0) return;

    indiceActual--;
    if (indiceActual < 0) indiceActual = listaDeReproduccion.length - 1;
    const track = listaDeReproduccion[indiceActual];
    reproducirCancion(track.ruta, track.titulo, track.artista, track.caratula);
}

function mezclarColaActual() {
    const inicio = indiceActual + 1;
    for (let i = listaDeReproduccion.length - 1; i > inicio; i--) {
        const j = Math.floor(Math.random() * (i - inicio + 1)) + inicio;
        [listaDeReproduccion[i], listaDeReproduccion[j]] = [listaDeReproduccion[j], listaDeReproduccion[i]];
    }
}

function toggleShuffle() {
    modoAleatorio = !modoAleatorio;
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
            actualizarColaReproduccion(); 
            indiceActual = listaDeReproduccion.findIndex(c => c.ruta === rutaActual);
            if (document.getElementById('colaPanel').classList.contains('activo')) renderizarColaVisual();
        }
    }
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
        li.className = "list-group-item bg-black border-0 border-bottom border-secondary border-opacity-10 d-flex align-items-center justify-content-between p-2.5 text-white small song-row-cola";
        li.innerHTML = `
            <div class="d-flex align-items-center flex-grow-1 pe-2 text-truncate" style="max-width: 200px;">
                <i class="bi bi-grip-vertical text-secondary me-2 drag-handle" style="cursor: grab; font-size: 1.2rem;"></i>
                <span class="text-secondary fw-bold me-3 opacity-50" style="min-width: 15px;">${posicionEnCola}</span>
                <div class="text-truncate">
                    <span class="fw-semibold d-block text-truncate text-white" title="${track.titulo}">${track.titulo}</span>
                    <span class="text-secondary small d-block text-truncate" title="${track.artista}">${track.artista}</span>
                </div>
            </div>
            <div class="d-flex gap-1">
                <button type="button" class="btn btn-transparent btn-sm p-1 text-danger opacity-75 hover-opacity-100" onclick="quitarDeColaTemporal(${indexOrigen}); event.stopPropagation();"><i class="bi bi-x-lg"></i></button>
            </div>
        `;
        contenedorLista.appendChild(li);
        posicionEnCola++;
    }
    if (contenedorLista.innerHTML === "") contenedorLista.innerHTML = `<li class="list-group-item bg-transparent text-secondary border-0 small text-center py-4"><i class="bi bi-check-circle d-block fs-4 mb-2 text-danger opacity-50"></i>No hay más canciones en espera.</li>`;
}

function quitarDeColaTemporal(indexEliminar) {
    listaDeReproduccion.splice(indexEliminar, 1);
    renderizarColaVisual();
}

function inicializarDragAndDropCola() {
    const contenedorLista = document.getElementById('lista-cola-dinamica');
    if (!contenedorLista || sortableCola) return; 

    sortableCola = new Sortable(contenedorLista, {
        handle: '.drag-handle',
        animation: 150,        
        ghostClass: 'bg-secondary', 
        delay: 150,            
        delayOnTouchOnly: true, 
        touchStartThreshold: 5, 
        onEnd: function (evt) {
            if (evt.oldIndex === evt.newIndex) return;
            const indexRealAntiguo = evt.oldIndex + indiceActual + 1;
            const indexRealNuevo = evt.newIndex + indiceActual + 1;
            const cancionMovida = listaDeReproduccion.splice(indexRealAntiguo, 1)[0];
            listaDeReproduccion.splice(indexRealNuevo, 0, cancionMovida);
            renderizarColaVisual();
        }
    });
}


// AUN CON ERROR
function irACancionActual() {
    if (!window.rutaEnReproduccion) return; 

    // 1. Buscamos el índice visual (para la tabla)
    const indexVisual = filasFiltradasGlobal.findIndex(fila => fila.getAttribute('data-ruta') === window.rutaEnReproduccion);

    if (indexVisual !== -1) {
        const paginaDestino = Math.floor(indexVisual / cancionesPorPagina) + 1;
        
        // 2. Si no estamos en la página correcta, cambiamos de página
        if (paginaActual !== paginaDestino) {
            cambiarPagina(paginaDestino);
        }

        // 3. Ejecutamos el scroll y forzamos la sincronización del puntero
        setTimeout(() => {
            const filaObjetivo = filasFiltradasGlobal[indexVisual];
            if (filaObjetivo) {
                // Sincronización forzada: Buscamos dónde está la ruta en la lista real de reproducción
                const nuevoIndice = listaDeReproduccion.findIndex(t => t.ruta === window.rutaEnReproduccion);
                if (nuevoIndice !== -1) {
                    indiceActual = nuevoIndice; // <--- AQUÍ ESTÁ EL ANCLAJE
                }

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
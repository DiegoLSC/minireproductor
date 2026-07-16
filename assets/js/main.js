// ==========================================
// main.js - ORQUESTADOR Y MOTOR DE TEMAS
// Responsabilidad: Arranque centralizado de la app, gestión de temas y atajos globales.
// ==========================================

const mapasDeColorTemas = {
    carmesi:  { base: '#dc2626', rgb: '220, 38, 38', hover: '#b91c1c', brillante: '#ef4444', pastel: '#fca5a5' },
    emerald:  { base: '#16a34a', rgb: '22, 163, 74', hover: '#15803d', brillante: '#22c55e', pastel: '#86efac' },
    ocean:    { base: '#2563eb', rgb: '37, 99, 235', hover: '#1d4ed8', brillante: '#3b82f6', pastel: '#93c5fd' },
    amethyst: { base: '#9333ea', rgb: '147, 51, 234', hover: '#7e22ce', brillante: '#a855f7', pastel: '#d8b4fe' },
    amber:    { base: '#d97706', rgb: '217, 119, 6', hover: '#b45309', brillante: '#f59e0b', pastel: '#fde68a' }
};

function cambiarTemaColor(nombreTema) {
    const paleta = mapasDeColorTemas[nombreTema];
    if (!paleta) return;
    
    const root = document.documentElement;
    root.style.setProperty('--sistema-carmesí', paleta.base);
    root.style.setProperty('--sistema-carmesí-rgb', paleta.rgb);
    root.style.setProperty('--carmesí-hover', paleta.hover);
    root.style.setProperty('--carmesí-brillante', paleta.brillante);
    root.style.setProperty('--carmesí-pastel', paleta.pastel);
    
    localStorage.setItem('nebula_tema_color', nombreTema);
    document.querySelectorAll('.color-dot').forEach(burbuja => {
        burbuja.classList.toggle('active', burbuja.getAttribute('data-color') === nombreTema);
    });
}

// ÚNICO PUNTO DE ENTRADA (BOOTSTRAP DEL SISTEMA)
document.addEventListener('DOMContentLoaded', () => {
    // 1. Aplicar tema inicial
    const temaPersistido = localStorage.getItem('nebula_tema_color') || 'carmesi';
    cambiarTemaColor(temaPersistido);

    // 2. Inicializar Módulos 
    if (typeof inicializarUI === 'function') inicializarUI();
    if (typeof inicializarAudio === 'function') inicializarAudio();
    if (typeof inicializarLogs === 'function') inicializarLogs();

    // 3. Ocultar pantalla de carga
    const loader = document.getElementById('pantalla-carga');
    if (loader) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.style.opacity = '0';
                loader.addEventListener('transitionend', () => {
                    loader.style.visibility = 'hidden';
                }, { once: true });
            }, 500);
        });
    }
});

// ATAJOS DE TECLADO GLOBALES
document.addEventListener('keydown', function(event) {
    const elementoActivo = document.activeElement.tagName;
    if (elementoActivo === 'INPUT' || elementoActivo === 'TEXTAREA' || elementoActivo === 'SELECT') return;

    if (event.shiftKey && event.code === 'KeyN') {
        event.preventDefault();
        document.getElementById('next-btn')?.click();
    } else if (event.shiftKey && event.code === 'KeyP') {
        event.preventDefault();
        document.getElementById('prev-btn')?.click();
    } else if (event.code === 'Space') {
        event.preventDefault();
        document.getElementById('play-btn')?.click();
    } else if (event.code === 'KeyM') {
        event.preventDefault();
        if(typeof toggleMute === 'function') toggleMute();
    }
});
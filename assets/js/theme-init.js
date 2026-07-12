(function() {
    const mapasDeColorTemas = {
        carmesi:  { base: '#dc2626', rgb: '220, 38, 38', hover: '#b91c1c', brillante: '#ef4444', pastel: '#fca5a5' },
        emerald:  { base: '#16a34a', rgb: '22, 163, 74', hover: '#15803d', brillante: '#22c55e', pastel: '#86efac' },
        ocean:    { base: '#2563eb', rgb: '37, 99, 235', hover: '#1d4ed8', brillante: '#3b82f6', pastel: '#93c5fd' },
        amethyst: { base: '#9333ea', rgb: '147, 51, 234', hover: '#7e22ce', brillante: '#a855f7', pastel: '#d8b4fe' },
        amber:    { base: '#d97706', rgb: '217, 119, 6', hover: '#b45309', brillante: '#f59e0b', pastel: '#fde68a' }
    };

    const temaPersistido = localStorage.getItem('nebula_tema_color') || 'carmesi';
    const paleta = mapasDeColorTemas[temaPersistido];

    if (paleta) {
        const root = document.documentElement;
        root.style.setProperty('--sistema-carmesí', paleta.base);
        root.style.setProperty('--sistema-carmesí-rgb', paleta.rgb);
        root.style.setProperty('--carmesí-hover', paleta.hover);
        root.style.setProperty('--carmesí-brillante', paleta.brillante);
        root.style.setProperty('--carmesí-pastel', paleta.pastel);
    }
})();
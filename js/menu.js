/* ==========================================================
   Templvm — menú de navegación en celular

   Bootstrap ya abre y cierra el menú hamburguesa. Esto agrega:
   - La tecla Escape lo cierra y devuelve el foco al botón del menú.
   - Al tocar un enlace a una sección de la misma página (por ejemplo
     "La Orden" estando en el inicio), el menú se cierra para no tapar
     el contenido.
   - La etiqueta del botón dice "Abrir menú" o "Cerrar menú" según el estado.
   ========================================================== */
(function () {
  'use strict';

  const menu = document.getElementById('navMenu');
  const boton = document.querySelector('[data-bs-target="#navMenu"]');
  const bs = window.bootstrap;
  if (!menu || !boton || !bs || !bs.Collapse) return;

  function colapso() {
    return bs.Collapse.getOrCreateInstance(menu, { toggle: false });
  }

  document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape' || !menu.classList.contains('show')) return;
    // Si el panel del carrito está abierto, Escape le corresponde a él
    if (document.querySelector('.offcanvas.show')) return;
    colapso().hide();
    boton.focus();
  });

  menu.addEventListener('click', (evento) => {
    const enlace = evento.target.closest('a[href]');
    if (!enlace || !menu.classList.contains('show')) return;
    const destino = new URL(enlace.href, window.location.href);
    if (destino.pathname === window.location.pathname && destino.hash) {
      colapso().hide();
    }
  });

  menu.addEventListener('shown.bs.collapse', () => boton.setAttribute('aria-label', 'Cerrar menú'));
  menu.addEventListener('hidden.bs.collapse', () => boton.setAttribute('aria-label', 'Abrir menú'));
})();

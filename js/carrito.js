/* ==========================================================
   Templvm — carrito de compras (demostración)

   - El catálogo de abajo usa los mismos productos y precios de tienda.html.
   - El carrito se guarda en localStorage, así que se mantiene al cambiar
     de página o al recargar (si el navegador lo permite).
   - El panel del carrito es un offcanvas de Bootstrap y el aviso al
     agregar es un toast de Bootstrap; ambos se crean desde aquí para no
     repetir el mismo HTML en las cinco páginas.
   - "Finalizar compra" es una simulación: no hay pagos ni formularios.
   ========================================================== */
(function () {
  'use strict';

  const CLAVE_ALMACEN = 'templvm-carrito';
  const MAX_UNIDADES = 10;
  const ESPERA_PROCESO_MS = 700;

  const CRUZ_SVG =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' +
    '<path d="M10 0h4v7.2c1.6-1 3.4-1.6 5.4-1.6.6 0 1.2.5 1.2 1.2v3.6c0 .7-.6 1.2-1.2 1.2-2 0-3.8.6-5.4 1.6V24h-4v-10.8c-1.6-1-3.4-1.6-5.4-1.6-.6 0-1.2-.5-1.2-1.2V6.8c0-.7.6-1.2 1.2-1.2 2 0 3.8.6 5.4 1.6V0z"/>' +
    '</svg>';

  // Mismos productos y precios (en pesos colombianos) que muestra tienda.html
  const PRODUCTOS = [
    { id: 'cruz-plata', nombre: 'Cruz templaria en plata', precio: 89000, icono: 'cruz' },
    { id: 'escudo-heraldico', nombre: 'Escudo heráldico templario', precio: 145000, icono: 'bi-shield-fill' },
    { id: 'libro-historia', nombre: 'Historia de la Orden del Temple', precio: 52000, icono: 'bi-book-half' },
    { id: 'mapa-fortalezas', nombre: 'Mapa de fortalezas templarias', precio: 38000, icono: 'bi-map-fill' },
    { id: 'anillo-sello', nombre: 'Anillo sello templario', precio: 76000, icono: 'bi-gem' },
    { id: 'llave-logia', nombre: 'Llave de la logia', precio: 29000, icono: 'bi-key-fill' }
  ];

  const catalogo = new Map(PRODUCTOS.map((producto) => [producto.id, producto]));
  const enTienda = document.querySelector('[data-agregar]') !== null;
  const bs = window.bootstrap;
  const hayBootstrap = Boolean(bs && bs.Offcanvas && bs.Toast);
  const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Estado y almacenamiento ---------- */

  let lineas = leerCarrito();
  let vista = 'lista'; // 'lista' | 'confirmacion'
  let procesando = false;
  let ultimoDisparador = null;

  function leerCarrito() {
    let datos;
    try {
      datos = JSON.parse(localStorage.getItem(CLAVE_ALMACEN) || '[]');
    } catch (error) {
      return [];
    }
    if (!Array.isArray(datos)) return [];

    // Se descartan productos que ya no existen y cantidades inválidas
    const limpias = [];
    datos.forEach((item) => {
      if (!item || !catalogo.has(item.id)) return;
      const cantidad = Math.floor(Number(item.cantidad));
      if (!(cantidad > 0)) return;
      const existente = limpias.find((linea) => linea.id === item.id);
      if (existente) {
        existente.cantidad = Math.min(existente.cantidad + cantidad, MAX_UNIDADES);
      } else {
        limpias.push({ id: item.id, cantidad: Math.min(cantidad, MAX_UNIDADES) });
      }
    });
    return limpias;
  }

  function guardarCarrito() {
    try {
      localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(lineas));
    } catch (error) {
      // Navegación privada o almacenamiento bloqueado: el carrito sigue
      // funcionando mientras la página esté abierta, solo que no se guarda.
    }
  }

  /* ---------- Cálculos y formato ---------- */

  function formatoPrecio(valor) {
    return '$' + String(valor).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function textoPiezas(cantidad) {
    return cantidad === 1 ? '1 pieza' : cantidad + ' piezas';
  }

  function textoUnidades(cantidad) {
    return cantidad === 1 ? '1 unidad' : cantidad + ' unidades';
  }

  function totalPiezas() {
    return lineas.reduce((suma, linea) => suma + linea.cantidad, 0);
  }

  function totalPesos() {
    return lineas.reduce((suma, linea) => suma + linea.cantidad * catalogo.get(linea.id).precio, 0);
  }

  function escapar(texto) {
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function iconoHTML(producto) {
    return producto.icono === 'cruz' ? CRUZ_SVG : '<i class="bi ' + producto.icono + '" aria-hidden="true"></i>';
  }

  /* ---------- Estructura del panel y del aviso ---------- */

  function crearPanel() {
    const panel = document.createElement('div');
    panel.className = 'offcanvas offcanvas-end offcanvas-carrito';
    panel.id = 'carrito';
    panel.tabIndex = -1;
    panel.setAttribute('aria-labelledby', 'carritoTitulo');
    panel.innerHTML = `
      <div class="offcanvas-header">
        <h2 class="offcanvas-title" id="carritoTitulo"><i class="bi bi-bag" aria-hidden="true"></i> Tu carrito</h2>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Cerrar carrito"></button>
      </div>
      <div class="offcanvas-body" data-carrito-cuerpo></div>
      <div class="carrito-pie" data-carrito-pie hidden>
        <dl class="carrito-totales">
          <div><dt>Subtotal (<span data-carrito-piezas></span>)</dt><dd data-carrito-subtotal></dd></div>
          <div><dt>Envío</dt><dd>No aplica en la demostración</dd></div>
          <div class="carrito-total"><dt>Total</dt><dd data-carrito-total></dd></div>
        </dl>
        <p class="carrito-aviso">
          <i class="bi bi-info-circle" aria-hidden="true"></i>
          <span>Esta tienda es una demostración: no se realizan cobros ni se piden datos de tarjeta.</span>
        </p>
        <button type="button" class="btn btn-templo w-100" data-carrito-finalizar>Finalizar compra</button>
      </div>
      <p class="visually-hidden" aria-live="polite" aria-atomic="true" data-carrito-anuncio></p>`;
    document.body.appendChild(panel);
    return panel;
  }

  function crearAviso() {
    const contenedor = document.createElement('div');
    contenedor.className = 'toast-container position-fixed bottom-0 end-0 p-3 toast-carrito-contenedor';
    contenedor.innerHTML = `
      <div class="toast toast-carrito" data-bs-delay="5000">
        <div class="toast-body">
          <i class="bi bi-check2-circle" aria-hidden="true"></i>
          <span data-aviso-texto></span>
        </div>
        <div class="toast-acciones">
          <button type="button" class="btn btn-outline-templo btn-sm" data-aviso-ver>Ver carrito</button>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Cerrar aviso"></button>
        </div>
      </div>`;
    document.body.appendChild(contenedor);
    return contenedor.querySelector('.toast');
  }

  // Región que lee el lector de pantalla cuando se agrega algo desde la página
  const anuncioPagina = document.createElement('p');
  anuncioPagina.className = 'visually-hidden';
  anuncioPagina.setAttribute('aria-live', 'polite');
  anuncioPagina.setAttribute('aria-atomic', 'true');
  document.body.appendChild(anuncioPagina);

  const panel = crearPanel();
  const cuerpo = panel.querySelector('[data-carrito-cuerpo]');
  const pie = panel.querySelector('[data-carrito-pie]');
  const botonFinalizar = panel.querySelector('[data-carrito-finalizar]');
  const anuncioPanel = panel.querySelector('[data-carrito-anuncio]');
  const aviso = crearAviso();
  const avisoTexto = aviso.querySelector('[data-aviso-texto]');

  const offcanvas = hayBootstrap ? bs.Offcanvas.getOrCreateInstance(panel) : null;
  const toast = hayBootstrap ? bs.Toast.getOrCreateInstance(aviso) : null;

  function anunciar(region, texto) {
    // Se vacía primero para que el mismo mensaje se vuelva a leer si se repite
    region.textContent = '';
    window.setTimeout(() => {
      region.textContent = texto;
    }, 60);
  }

  /* ---------- Plantillas ---------- */

  function plantillaVacio() {
    const accion = enTienda
      ? '<button type="button" class="btn btn-templo" data-bs-dismiss="offcanvas">Seguir viendo el catálogo</button>'
      : '<a class="btn btn-templo" href="tienda.html">Ir a la tienda</a>';
    return `
      <div class="carrito-vacio">
        <div class="carrito-vacio-icono" aria-hidden="true">${CRUZ_SVG}</div>
        <p class="carrito-vacio-titulo">Tu carrito está vacío</p>
        <p>Agrega réplicas, libros o joyas desde la tienda y aparecerán aquí.</p>
        ${accion}
      </div>`;
  }

  function crearItem(linea) {
    const producto = catalogo.get(linea.id);
    const nombre = escapar(producto.nombre);
    const enMinimo = linea.cantidad <= 1;
    const enMaximo = linea.cantidad >= MAX_UNIDADES;

    const item = document.createElement('li');
    item.className = 'carrito-item';
    item.dataset.id = producto.id;
    item.innerHTML = `
      <div class="carrito-item-icono" aria-hidden="true">${iconoHTML(producto)}</div>
      <div class="carrito-item-info">
        <div class="carrito-item-cabecera">
          <p class="carrito-item-nombre">${nombre}</p>
          <p class="carrito-item-subtotal"><span class="visually-hidden">Subtotal: </span>${formatoPrecio(producto.precio * linea.cantidad)}</p>
        </div>
        <p class="carrito-item-precio">${formatoPrecio(producto.precio)} por unidad</p>
        <div class="carrito-item-controles">
          <div class="carrito-cantidad" role="group" aria-label="Cantidad de ${nombre}">
            <button type="button" class="btn-cantidad" data-accion="restar" aria-label="Restar una unidad" aria-disabled="${enMinimo}">
              <i class="bi bi-dash-lg" aria-hidden="true"></i>
            </button>
            <span class="carrito-cantidad-valor">${linea.cantidad}</span>
            <button type="button" class="btn-cantidad" data-accion="sumar" aria-label="Sumar una unidad" aria-disabled="${enMaximo}">
              <i class="bi bi-plus-lg" aria-hidden="true"></i>
            </button>
          </div>
          <button type="button" class="btn-quitar" data-accion="quitar">
            <i class="bi bi-trash3" aria-hidden="true"></i> Quitar<span class="visually-hidden"> ${nombre} del carrito</span>
          </button>
        </div>
        ${enMaximo ? '<p class="carrito-aviso-limite">Máximo ' + MAX_UNIDADES + ' unidades por pieza en esta demostración.</p>' : ''}
      </div>`;
    return item;
  }

  function plantillaConfirmacion(resumen, total) {
    const filas = resumen
      .map((linea) => {
        const producto = catalogo.get(linea.id);
        return `<li><span>${linea.cantidad} × ${escapar(producto.nombre)}</span><span>${formatoPrecio(producto.precio * linea.cantidad)}</span></li>`;
      })
      .join('');
    return `
      <div class="carrito-confirmacion">
        <div class="carrito-confirmacion-icono" aria-hidden="true"><i class="bi bi-check2-circle"></i></div>
        <h3 class="carrito-confirmacion-titulo" tabindex="-1">Pedido de demostración completado</h3>
        <p>Así terminaría una compra real. Templvm es un proyecto académico: no se hizo ningún cobro ni se guardaron datos personales.</p>
        <ul class="carrito-resumen">
          ${filas}
          <li class="carrito-resumen-total"><span>Total</span><span>${formatoPrecio(total)}</span></li>
        </ul>
        <button type="button" class="btn btn-templo" data-bs-dismiss="offcanvas">Cerrar</button>
      </div>`;
  }

  /* ---------- Pintar el estado ---------- */

  function actualizarContadores() {
    const piezas = totalPiezas();
    document.querySelectorAll('[data-carrito-contador]').forEach((contador) => {
      contador.textContent = String(piezas);
      contador.classList.toggle('tiene-piezas', piezas > 0);
    });
    document.querySelectorAll('[data-carrito-abrir]').forEach((boton) => {
      boton.setAttribute('aria-label', piezas ? 'Carrito: ' + textoPiezas(piezas) : 'Carrito vacío');
    });
  }

  function renderizar() {
    actualizarContadores();
    if (vista === 'confirmacion') return;

    if (!lineas.length) {
      cuerpo.innerHTML = plantillaVacio();
      pie.hidden = true;
      return;
    }

    const lista = document.createElement('ul');
    lista.className = 'carrito-lista';
    lista.setAttribute('aria-label', 'Productos en el carrito');
    lineas.forEach((linea) => lista.appendChild(crearItem(linea)));
    cuerpo.replaceChildren(lista);

    pie.hidden = false;
    pie.querySelector('[data-carrito-piezas]').textContent = textoPiezas(totalPiezas());
    pie.querySelector('[data-carrito-subtotal]').textContent = formatoPrecio(totalPesos());
    pie.querySelector('[data-carrito-total]').textContent = formatoPrecio(totalPesos());
  }

  function enfocarControl(id, accion) {
    const control = cuerpo.querySelector('.carrito-item[data-id="' + id + '"] [data-accion="' + accion + '"]');
    if (control) control.focus();
  }

  function animarContador() {
    if (movimientoReducido.matches) return;
    document.querySelectorAll('[data-carrito-contador]').forEach((contador) => {
      if (typeof contador.animate !== 'function') return;
      contador.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }],
        { duration: 320, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
      );
    });
  }

  function mostrarAviso(texto) {
    avisoTexto.textContent = texto;
    if (toast) toast.show();
  }

  /* ---------- Acciones ---------- */

  function agregar(id) {
    const producto = catalogo.get(id);
    if (!producto) return;

    let linea = lineas.find((item) => item.id === id);
    if (linea && linea.cantidad >= MAX_UNIDADES) {
      const limite = 'Ya tienes ' + MAX_UNIDADES + ' unidades de «' + producto.nombre + '», el máximo por pieza en esta demostración.';
      mostrarAviso(limite);
      anunciar(anuncioPagina, limite);
      return;
    }

    if (linea) {
      linea.cantidad += 1;
    } else {
      linea = { id: id, cantidad: 1 };
      lineas.push(linea);
    }
    guardarCarrito();
    renderizar();
    animarContador();

    const mensaje = linea.cantidad === 1
      ? 'Agregaste «' + producto.nombre + '» al carrito.'
      : 'Agregaste otra unidad de «' + producto.nombre + '». Ahora tienes ' + linea.cantidad + '.';
    mostrarAviso(mensaje);
    anunciar(anuncioPagina, mensaje + ' El carrito tiene ' + textoPiezas(totalPiezas()) + '.');
  }

  function cambiarCantidad(id, diferencia, accion) {
    const linea = lineas.find((item) => item.id === id);
    if (!linea) return;
    const nueva = Math.min(Math.max(linea.cantidad + diferencia, 1), MAX_UNIDADES);
    if (nueva === linea.cantidad) return;

    linea.cantidad = nueva;
    guardarCarrito();
    renderizar();
    enfocarControl(id, accion);
    anunciar(
      anuncioPanel,
      catalogo.get(id).nombre + ': ' + textoUnidades(nueva) + '. Total del carrito: ' + formatoPrecio(totalPesos()) + '.'
    );
  }

  function quitar(id) {
    const indice = lineas.findIndex((item) => item.id === id);
    if (indice === -1) return;
    const nombre = catalogo.get(id).nombre;

    lineas.splice(indice, 1);
    guardarCarrito();
    renderizar();

    if (lineas.length) {
      // El foco pasa al producto que quedó en ese lugar (o al anterior si era el último)
      const siguiente = lineas[Math.min(indice, lineas.length - 1)];
      enfocarControl(siguiente.id, 'quitar');
      anunciar(anuncioPanel, 'Quitaste «' + nombre + '» del carrito. Quedan ' + textoPiezas(totalPiezas()) + '.');
    } else {
      const accionVacio = cuerpo.querySelector('.carrito-vacio .btn');
      if (accionVacio) accionVacio.focus();
      anunciar(anuncioPanel, 'Quitaste «' + nombre + '» del carrito. El carrito está vacío.');
    }
  }

  function finalizarCompra() {
    if (procesando || !lineas.length) return;
    procesando = true;

    const etiquetaOriginal = botonFinalizar.innerHTML;
    botonFinalizar.setAttribute('aria-disabled', 'true');
    botonFinalizar.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Procesando pedido…';
    anunciar(anuncioPanel, 'Procesando el pedido de demostración.');

    window.setTimeout(() => {
      const resumen = lineas.map((linea) => ({ id: linea.id, cantidad: linea.cantidad }));
      const total = totalPesos();

      lineas = [];
      guardarCarrito();
      vista = 'confirmacion';
      pie.hidden = true;
      cuerpo.innerHTML = plantillaConfirmacion(resumen, total);
      actualizarContadores();

      botonFinalizar.innerHTML = etiquetaOriginal;
      botonFinalizar.removeAttribute('aria-disabled');
      procesando = false;

      const titulo = cuerpo.querySelector('.carrito-confirmacion-titulo');
      if (titulo && panel.classList.contains('show')) titulo.focus();
      anunciar(anuncioPanel, 'Pedido de demostración completado por ' + formatoPrecio(total) + '. No se hizo ningún cobro.');
    }, ESPERA_PROCESO_MS);
  }

  function abrirPanel(disparador) {
    if (!offcanvas) return;
    ultimoDisparador = disparador || null;

    // Si el menú móvil está abierto, se cierra para no dejarlo detrás del panel
    const menu = document.getElementById('navMenu');
    if (menu && menu.classList.contains('show') && bs.Collapse) {
      bs.Collapse.getOrCreateInstance(menu, { toggle: false }).hide();
    }
    if (toast) toast.hide();
    offcanvas.show();
  }

  function esVisible(elemento) {
    return Boolean(elemento && document.contains(elemento) && elemento.getClientRects().length);
  }

  /* ---------- Eventos ---------- */

  // Botones "Agregar" de la tienda: empiezan deshabilitados en el HTML
  document.querySelectorAll('[data-agregar]').forEach((boton) => {
    const id = boton.dataset.agregar;
    if (!catalogo.has(id)) return;
    boton.disabled = false;
    boton.addEventListener('click', () => agregar(id));
  });

  // Botón del carrito en la navegación (todas las páginas)
  document.querySelectorAll('[data-carrito-abrir]').forEach((boton) => {
    boton.addEventListener('click', () => abrirPanel(boton));
  });

  aviso.querySelector('[data-aviso-ver]').addEventListener('click', () => abrirPanel(null));

  cuerpo.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-accion]');
    if (!boton || boton.getAttribute('aria-disabled') === 'true') return;
    const item = boton.closest('.carrito-item');
    if (!item) return;
    const id = item.dataset.id;
    const accion = boton.dataset.accion;

    if (accion === 'sumar') cambiarCantidad(id, 1, accion);
    else if (accion === 'restar') cambiarCantidad(id, -1, accion);
    else if (accion === 'quitar') quitar(id);
  });

  botonFinalizar.addEventListener('click', () => {
    if (botonFinalizar.getAttribute('aria-disabled') === 'true') return;
    finalizarCompra();
  });

  panel.addEventListener('show.bs.offcanvas', () => {
    document.querySelectorAll('[data-carrito-abrir]').forEach((boton) => boton.setAttribute('aria-expanded', 'true'));
  });

  panel.addEventListener('hidden.bs.offcanvas', () => {
    document.querySelectorAll('[data-carrito-abrir]').forEach((boton) => boton.setAttribute('aria-expanded', 'false'));

    // Después de una compra, la próxima vez el panel muestra el carrito (vacío)
    if (vista === 'confirmacion' && !procesando) {
      vista = 'lista';
      renderizar();
    }

    // El foco vuelve a quien abrió el panel; si ya no se ve (el aviso), al botón del carrito
    const destino = esVisible(ultimoDisparador) ? ultimoDisparador : document.querySelector('[data-carrito-abrir]');
    if (destino) destino.focus();
    ultimoDisparador = null;
  });

  // Si el carrito cambia en otra pestaña, esta se pone al día
  window.addEventListener('storage', (evento) => {
    if (evento.key !== null && evento.key !== CLAVE_ALMACEN) return;
    lineas = leerCarrito();
    renderizar();
  });

  renderizar();
})();

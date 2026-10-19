# Cambios para terminar Templvm

Este documento resume qué se cambió al pasar el laboratorio a proyecto de portafolio y por qué. La regla fue **no cambiar lo que ya estaba (estructura, colores, fuentes, textos, imágenes), solo corregir y completar**.

## Bugs corregidos

- **Botones que perdían el color al usar el teclado.** Bootstrap pinta el estado de foco (`.btn:focus-visible`) con sus propias variables (`--bs-btn-hover-bg`, etc.). Como `.btn-templo` y `.btn-outline-templo` ponían el color directamente con `background-color`, al llegar con Tab el botón rojo se volvía transparente y el anillo de foco salía azul. Ahora los dos botones se definen con las variables de Bootstrap, así que hover, foco, presionado y deshabilitado conservan los colores de la marca.
- **"Ver los castillos" casi no se leía en la portada.** El texto dorado quedaba sobre la parte clara de la imagen (contraste de 1,6 a 1,8:1, cuando el mínimo es 4,5:1). Se le dio un fondo oscuro translúcido; ahora mide unos 5:1 y al pasar el mouse sigue rellenándose de oro, como antes. El distintivo "Orden del Temple · Fundada en 1119" tenía el mismo problema (2,5:1 → 5,6:1) y el párrafo de la portada estaba justo en el límite, por eso lleva un halo oscuro muy suave detrás de las letras.
- **Botones "Agregar" ilegibles sobre blanco.** El dorado sobre fondo blanco no llegaba a 3:1. Dentro de las tarjetas de producto el texto ahora es color piedra, con el mismo borde dorado.
- **La página actual no se marcaba en la navegación.** La regla `#navbarTemplum .nav-link` era más específica que el `.active` de Bootstrap y lo anulaba. Ahora el enlace actual sale en oro y subrayado, y en la tienda el botón "Ir a la tienda" tiene un filo dorado.
- **Flecha del acordeón invisible.** En el paso abierto de la historia la flecha era azul oscuro sobre el fondo rojo. Ahora es color pergamino.
- **Foto equivocada.** `gisors.png` y `tomar.png` eran el mismo archivo (24 MB cada uno). Revisando la imagen, es el Convento de Cristo en Tomar (la iglesia manuelina sobre el claustro), así que se usa para Tomar y Gisors conserva el ícono de torre hasta tener su foto.
- **Fotos de castillos sin usar.** Las tarjetas mostraban un ícono aunque había fotos en `img/castillos/`. Ahora cuatro castillos tienen foto en un recuadro 16:9 que recorta sin deformar.
- **Anclas tapadas por la barra fija.** Al ir a "La Orden" el título quedaba debajo de la barra. Se agregó `scroll-padding-top`.
- **`scroll-behavior: smooth` no hacía nada** porque estaba en `body`; se movió a `html` y se desactiva si la persona pide movimiento reducido.
- **Menú móvil:** no se cerraba con Escape y, estando en el inicio, al tocar "La Orden" quedaba abierto tapando la sección. Las dos cosas se resolvieron en `js/menu.js`.
- **Efectos de hover "pegados" en celular.** La elevación de tarjetas y el relleno dorado de los botones se quedaban activos después de tocar. Ahora solo aplican en dispositivos con mouse.
- **Portada en celulares:** `min-height: 100vh` salta cuando aparece o desaparece la barra del navegador; se usa `100svh` con `100vh` de respaldo.
- **Título de la portada:** el `<h1>` decía "templeshop", pero la marca en el menú, el pie y el título de la página es TEMPLVM. Ahora dice TEMPLVM.
- **Limpieza de CSS:** la regla `.badge-pais` estaba repetida y quedaban comentarios de instrucciones del laboratorio ("Cambiá esta regla...").

## Funcionalidades nuevas

- **Carrito de compras** (`js/carrito.js`):
  - Los botones "Agregar" estaban deshabilitados; ahora agregan el producto, muestran un aviso (toast de Bootstrap) con un botón "Ver carrito" y animan el contador.
  - Contador de piezas en la barra de navegación de **todas** las páginas, también con el menú móvil cerrado.
  - Panel lateral (offcanvas de Bootstrap) con: cantidad de 1 a 10 por pieza, quitar, subtotal por producto, subtotal general y total.
  - Se guarda en `localStorage` (siempre dentro de `try/catch`). Si el navegador bloquea el almacenamiento, el carrito sigue funcionando mientras la página esté abierta. Los datos guardados se validan al leerlos: se descartan productos que no existen y cantidades inválidas.
  - Si el carrito cambia en otra pestaña, la pestaña abierta se actualiza (evento `storage`).
  - Estado vacío con un camino de vuelta: "Ir a la tienda" desde otras páginas, "Seguir viendo el catálogo" dentro de la tienda.
  - "Finalizar compra" simulado: estado "Procesando…", resumen del pedido y un mensaje claro de que es una demostración sin cobro. No hay formularios de pago.
  - Los productos y precios del carrito son los mismos de `tienda.html`, en un arreglo `PRODUCTOS` al inicio del archivo. Si cambia un precio en la página, hay que cambiarlo también ahí.
  - Mejora progresiva: los botones "Agregar" vienen deshabilitados en el HTML y el script los activa, así que sin JavaScript no hay botones que no hacen nada.
- **Pie de página** en todas las páginas, con la marca, los enlaces principales y la nota de que es un proyecto académico y la tienda no procesa pagos.
- **Página 404** rehecha con el estilo del sitio (estaba en inglés y con estilos genéricos): barra de navegación, mensaje en español y caminos de vuelta al inicio, la tienda, la historia y los castillos.

## Accesibilidad

- `<main id="contenido">` en cada página y enlace "Saltar al contenido" que aparece con el primer Tab.
- Anillo de foco propio: rojo sobre fondos claros, oro sobre fondos oscuros.
- `aria-current="page"` en el enlace de la página actual (barra y pie de página) y `aria-label` en las dos navegaciones.
- Acordeón de la historia con `aria-expanded` y `aria-controls` desde el inicio.
- Títulos ocultos visualmente (`visually-hidden`) para el catálogo y la galería, así la jerarquía de encabezados no salta de `h1` a `h3`.
- Carrito usable solo con teclado: Escape cierra el panel, el foco vuelve al botón que lo abrió, al cambiar una cantidad el foco se queda en el mismo botón y al quitar un producto pasa al siguiente. Los botones de cantidad usan `aria-disabled` en el mínimo y el máximo para no perder el foco.
- Regiones `aria-live` que leen en voz alta lo que pasa: "Agregaste… El carrito tiene 3 piezas", "Quitaste…", el total al cambiar cantidades y la confirmación del pedido.
- El botón del carrito dice cuántas piezas hay ("Carrito: 3 piezas") y cada "Agregar" o "Quitar" nombra su producto para lectores de pantalla.
- Objetivos táctiles de al menos 44 px en celular (carrito, menú, enlaces del menú, "Agregar", cantidades, pie de página).
- Texto alternativo descriptivo en las fotos de castillos.
- `prefers-reduced-motion`: sin desplazamientos ni rebotes; quedan los cambios de color.
- `lang="es"` también en la 404 (estaba en `en`).

## Rendimiento

- `img/hero.png` (2,4 MB) → `img/hero.webp` (156 KB), y se precarga con `fetchpriority="high"` porque es lo primero que se ve.
- Fotos de castillos: los PNG sumaban unos 49 MB (dos de ellos de 24 MB y 5184 px de ancho). En WebP suman unos 300 KB. Tomar tiene dos tamaños (600 y 1200 px) con `srcset`/`sizes`, así el celular descarga el pequeño.
- Las fotos que no se ven al cargar llevan `loading="lazy"`; todas tienen `width`/`height` y `decoding="async"` para no mover el diseño mientras cargan.
- Los scripts propios se cargan con `defer`.

## Contenido

- Voseo cambiado a español neutro tuteando: "Explorá / recorré / llevate" → "Explora / recorre / llévate" (inicio), "Llevate" → "Llévate" (castillos), "Conocé" → "Conoce" (historia), "¿Querés…? / Descubrí…" → "¿Quieres…? / Descubre…" (tienda).
- `meta description`, Open Graph básico (`og:title`, `og:description`, `og:type`), `theme-color` y favicon (`favicon.svg`, la cruz dorada del logo) en todas las páginas.
- `mirabert.png` se renombró a `miravet.webp` para que coincida con el nombre del castillo.
- No se cambió ningún texto histórico, precio ni descripción de producto.

## Fotos de castillos con licencia libre

- **Gisors y Peñíscola** tenían el ícono de torre porque no había foto. Ahora tienen una.
- **Miravet, Monzón y Ponferrada** se reemplazaron: medían 400, 650 y 738 px y se veían suaves en pantallas grandes, la de Monzón tenía la marca de agua de otro sitio y la de Ponferrada un cartel publicitario. Ya no hace falta el encuadre a la izquierda de Ponferrada (`.castillo-foto--izquierda`), así que se quitó.
- Las cinco fotos son de Wikimedia Commons, con licencias CC BY 2.0, CC BY-SA 3.0, CC BY-SA 3.0 ES y CC BY-SA 4.0. Esas licencias piden citar al autor, la fuente y la licencia, así que al final de `castillos.html` hay una sección **Créditos de las fotos** con los enlaces.
- Como Tomar, cada foto tiene dos tamaños (600 y 1200 px) con `srcset`/`sizes`. Las de la primera fila cargan de inmediato y las demás con `loading="lazy"`.

## Seguridad para publicar

- `netlify.toml` con cabeceras de seguridad: política de contenido (`Content-Security-Policy`) que solo permite los recursos que el sitio usa, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` y HTTPS obligatorio. Se probó en Chromium con esas cabeceras: todas las páginas cargan sin violaciones y pasan las mismas pruebas de antes.
- Caché del navegador: 30 días para imágenes y 1 hora para CSS y JS, para que quien vuelve no descargue todo otra vez.
- `.gitignore` para no subir por error archivos `.env`, la carpeta `.netlify/`, `node_modules/` ni archivos del editor o del sistema.
- Bootstrap y Bootstrap Icons se cargan con `integrity` y `crossorigin`: si el archivo en jsDelivr fuera alterado, el navegador no lo usa.

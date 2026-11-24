# Mochila Invisible

Prototipo web de la campaña para Cóndor Estudiantil 2026, basado en las diapositivas 11, 12, 14 y 15 de la presentación del Grupo 1.

Web publicada: https://rymdo36.github.io/mochila-invisible/

Materiales y QR: https://rymdo36.github.io/mochila-invisible/materiales.html

## Probar

Abre `index.html` en Chrome o Edge. También se puede servir esta carpeta con cualquier servidor estático. Los archivos usan rutas relativas para funcionar en un repositorio de GitHub Pages.

El sitio incluye inicio, solicitud de relevo en cuatro pasos, resumen editable, seguimiento de la solicitud, voluntariado, perfil, acceso de prueba y preferencias.

Los perfiles, borradores y solicitudes se guardan mediante `localStorage` en el navegador. La confirmación indica «Pendiente de evaluación». Las fechas y horarios son preferencias sujetas a coordinación del equipo. La demostración permite ensayar el recorrido completo con datos ficticios.

El acceso al perfil reconoce el correo guardado en el mismo navegador. Para una puesta en marcha real hacen falta autenticación y un servicio que reciba las solicitudes, gestione consentimientos y permita la evaluación por el equipo responsable.

## Pieza de TC y lámina

Abre `materiales.html`. Incluye la composición de televisión y una lámina A4. Una vez publicada la web, pega su dirección para generar un QR real. Desde esa pantalla puedes descargar el QR en SVG, la pieza de TC en PNG y usar «Imprimir lámina» para imprimir o guardar como PDF.

La dirección definitiva también puede escribirse en `config.js`, en `publicUrl`. El QR se genera localmente mediante la biblioteca incluida en `vendor`.

## GitHub Pages

Esta publicación usa GitHub Pages desde `main` y la carpeta raíz, con `.nojekyll`. Los cambios subidos a esa rama se publican automáticamente.

## Identidad y material

El logo proviene de la variante punteada aprobada que compartió el equipo. La fotografía y el encuadre de TC proceden de los materiales del videocaso. La paleta usa morado, lavanda, blanco y berenjena. Las fuentes están incluidas para funcionar localmente.

Los archivos `Mochila-Invisible-QR.svg`, `Mochila-Invisible-TC-con-QR.png` y `Mochila-Invisible-Lamina-A4.pdf` contienen el QR de la dirección publicada.

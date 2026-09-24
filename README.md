# Journey Map Studio

Herramienta local para crear journey maps y service blueprints basados en investigación
(enfoque *This is Service Design Doing*).

## Cómo abrirla en tu computadora
1. Instala [Node.js](https://nodejs.org) (versión LTS), una sola vez.
2. En una terminal, dentro de esta carpeta:
   ```
   npm install
   npm run dev
   ```
3. Abre http://localhost:5173 en el navegador.

Los datos se guardan en tu navegador (localStorage). Exporta tus proyectos a JSON de vez en cuando
como respaldo (botón **Exportar JSON** en cada proyecto).

## Comprobar que todo funciona
```
npm test
```
Ejecuta las pruebas automáticas; deben salir todas en verde ("passed").

Contexto completo del producto en `CLAUDE.md`.

# QR Scanner & Generator PWA

Aplicación web progresiva (PWA) para escanear y generar códigos QR con soporte para notificaciones push.

## 🚀 Características

- ✅ **Escáner de QR**: Usa la cámara para escanear códigos QR en tiempo real
- ✅ **Generador de QR**: Crea códigos QR personalizados o aleatorios
- ✅ **Notificaciones Push**: Envía y recibe notificaciones
- ✅ **PWA Instalable**: Se puede instalar como app nativa
- ✅ **Funciona Offline**: Service Worker para caché offline
- ✅ **Responsive**: Funciona en móvil y escritorio

## 📱 Instalación

### En Móvil (iOS/Android)

1. Abre la app en Safari (iOS) o Chrome (Android)
2. Toca el botón "Compartir" o el menú (⋮)
3. Selecciona "Agregar a pantalla de inicio"
4. ¡Listo! La app aparecerá como una app nativa

### En Escritorio

1. Abre la app en Chrome, Edge o cualquier navegador compatible
2. Busca el ícono de instalación (➕) en la barra de direcciones
3. Click en "Instalar"

## 🛠️ Desarrollo Local

### Opción 1: Python HTTP Server

```bash
cd docs
python -m http.server 8000
```

Luego abre: http://localhost:8000

### Opción 2: Node.js http-server

```bash
npm install -g http-server
cd docs
http-server -p 8000
```

### Opción 3: VS Code Live Server

1. Instala la extensión "Live Server"
2. Click derecho en `index.html`
3. Selecciona "Open with Live Server"

## 📂 Estructura de Archivos

```
docs/
├── index.html           # Página principal
├── style.css           # Estilos
├── app.js              # Lógica de la aplicación
├── manifest.json       # Configuración PWA
├── service-worker.js   # Service Worker para offline
├── icon-192.png        # Icono 192x192
├── icon-512.png        # Icono 512x512
└── generate-icons.html # Generador de iconos
```

## 🎯 Uso

### Escanear QR

1. Ve a la pestaña "📷 Escanear"
2. Click en "📸 Abrir Cámara"
3. Apunta a un código QR
4. El resultado aparecerá automáticamente

### Generar QR

1. Ve a la pestaña "🔲 Generar"
2. Escribe el texto o URL
3. Click en "🔲 Generar QR"
4. Descarga el QR generado

### Notificaciones

1. Ve a la pestaña "🔔 Notificaciones"
2. Click en "🔔 Activar Notificaciones"
3. Acepta los permisos
4. Envía notificaciones de prueba

## 🔧 Configuración

### Generar Iconos

Si necesitas regenerar los iconos:

1. Abre `generate-icons.html` en tu navegador
2. Click derecho en cada icono
3. "Guardar imagen como..." → `icon-192.png` y `icon-512.png`

### HTTPS Requerido

Las PWA requieren HTTPS en producción. Opciones:

- **GitHub Pages**: Automáticamente usa HTTPS
- **Netlify/Vercel**: HTTPS incluido
- **Desarrollo local**: Funciona en `localhost` sin HTTPS

## 🌐 Deploy

### GitHub Pages

1. Sube los archivos a un repositorio
2. Ve a Settings → Pages
3. Selecciona la rama y carpeta `/docs`
4. ¡Listo! Tu PWA estará en `https://usuario.github.io/repo/`

### Netlify

```bash
# Arrastra la carpeta docs a netlify.com
# O usa Netlify CLI:
netlify deploy --prod --dir=docs
```

## ⚙️ Compatibilidad

| Característica | Chrome | Safari | Firefox | Edge |
|---------------|--------|--------|---------|------|
| Escáner QR    | ✅     | ✅     | ✅      | ✅   |
| Generador QR  | ✅     | ✅     | ✅      | ✅   |
| Notificaciones| ✅     | ✅*    | ✅      | ✅   |
| Instalación PWA| ✅    | ✅     | ⚠️      | ✅   |
| Service Worker| ✅     | ✅     | ✅      | ✅   |

*Safari iOS 16.4+ soporta notificaciones web

## 🐛 Solución de Problemas

### La cámara no funciona

- Verifica permisos de cámara en el navegador
- Asegúrate de usar HTTPS (o localhost)
- Prueba con otro navegador

### No se puede instalar

- Verifica que tengas HTTPS activo
- Confirma que `manifest.json` esté accesible
- Revisa la consola del navegador para errores

### Las notificaciones no funcionan

- Acepta los permisos cuando se soliciten
- Verifica configuración de notificaciones del sistema
- En iOS: Safari 16.4+ requerido

## 📝 Notas

- Esta es una aplicación de demostración sin backend
- Los QR se generan y escanean localmente
- Los datos no se guardan en ningún servidor
- Funciona completamente offline después de la primera carga

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Siéntete libre de:

- Reportar bugs
- Sugerir nuevas características
- Enviar pull requests

## 📄 Licencia

MIT License - Úsalo libremente para tus proyectos

## 🔗 Enlaces Útiles

- [MDN - Progressive Web Apps](https://developer.mozilla.org/es/docs/Web/Progressive_web_apps)
- [Web.dev - PWA](https://web.dev/progressive-web-apps/)
- [Can I Use - PWA](https://caniuse.com/?search=pwa)

---

Hecho con ❤️ para probar PWA en móviles y web

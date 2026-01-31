# Changelog - PWA QR Scanner & Generator

## [2.1.0] - 2026-01-30
### Added
- Sistema de versionado
- Notificación de actualizaciones disponibles
- Verificación automática de versión en cada carga

### Changed
- Actualizaciones finales en estilos y lógica de la app

---

## [2.0.0] - 2026-01-29
### Fixed
- Eliminado duplicado de HTML que causaba menú duplicado
- Ajustes de viewport para Safari iOS (svh y tamaño de texto)
- Layout responsive en dispositivos móviles

### Added
- Notificaciones programadas en minutos
- Mejor soporte para safe-area en iOS

---

## [1.9.0] - 2026-01-28
### Added
- Interfaz diferenciada para navegador vs modo PWA
- Control de flash/linterna para cámara frontal
- Mejor manejo de permisos de cámara

---

## [1.8.0] - 2026-01-27
### Added
- Sistema de notificaciones push
- Notificaciones programadas
- Vibración en escaneos exitosos y sonidos

---

## [1.7.0] - 2026-01-26
### Added
- Tema oscuro/claro con detección automática del sistema
- Persistencia de preferencias de tema en localStorage
- Mejoras en accesibilidad (contraste, tamaños)

### Changed
- Rediseño de interfaz de configuración

---

## [1.6.0] - 2026-01-25
### Added
- Generador QR con 6 tipos:
  - Texto simple
  - WiFi (SSID, contraseña)
  - vCard (contacto)
  - Email
  - SMS
  - Geolocalización
- Exportación e importación de historial (JSON)
- Estadísticas de uso (códigos escaneados/generados)

---

## [1.5.0] - 2026-01-24
### Added
- Historial de códigos QR escaneados
- Búsqueda y filtrado en historial
- Soporte para compartir con API nativa (fallback copy)
- Copiar códigos al portapapeles

---

## [1.0.0] - 2026-01-23
### Added
- Versión inicial del PWA
- Escaneo de QR con cámara web
- Carga de imágenes desde galería
- Service Worker para funcionamiento offline
- Instalable en dispositivos (manifest.json)
- Persistencia de datos con localStorage
- Interfaz responsive

// Variables globales
let html5QrCode = null;
let deferredPrompt = null;
let isScanning = false;

// Elementos del DOM
const elements = {
    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Scanner
    startScanBtn: document.getElementById('startScanBtn'),
    stopScanBtn: document.getElementById('stopScanBtn'),
    cameraContainer: document.getElementById('cameraContainer'),
    video: document.getElementById('video'),
    canvas: document.getElementById('canvas'),
    scanResult: document.getElementById('scanResult'),
    resultText: document.getElementById('resultText'),
    copyResultBtn: document.getElementById('copyResultBtn'),
    
    // Generator
    qrInput: document.getElementById('qrInput'),
    generateBtn: document.getElementById('generateBtn'),
    generateRandomBtn: document.getElementById('generateRandomBtn'),
    qrContainer: document.getElementById('qrContainer'),
    downloadQRBtn: document.getElementById('downloadQRBtn'),
    
    // Notifications
    enableNotificationsBtn: document.getElementById('enableNotificationsBtn'),
    sendNotificationBtn: document.getElementById('sendNotificationBtn'),
    notificationStatus: document.getElementById('statusText'),
    notificationOptions: document.getElementById('notificationOptions'),
    notifTitle: document.getElementById('notifTitle'),
    notifBody: document.getElementById('notifBody'),
    sendCustomNotificationBtn: document.getElementById('sendCustomNotificationBtn'),
    
    // Install
    installContainer: document.getElementById('installContainer'),
    installButton: document.getElementById('installButton'),
    
    // Status
    pwaStatus: document.getElementById('pwaStatus'),
    onlineStatus: document.getElementById('onlineStatus')
};

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    setupTabs();
    setupScanner();
    setupGenerator();
    setupNotifications();
    setupPWA();
    checkOnlineStatus();
    
    console.log('✅ App inicializada correctamente');
}

// ========== TABS ==========
function setupTabs() {
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Desactivar todos los tabs
    elements.tabBtns.forEach(btn => btn.classList.remove('active'));
    elements.tabContents.forEach(content => content.classList.remove('active'));
    
    // Activar el tab seleccionado
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(tabName);
    
    if (activeBtn && activeContent) {
        activeBtn.classList.add('active');
        activeContent.classList.add('active');
    }
    
    // Detener scanner si se cambia de tab
    if (tabName !== 'scanner' && isScanning) {
        stopScanner();
    }
}

// ========== SCANNER QR ==========
function setupScanner() {
    elements.startScanBtn.addEventListener('click', startScanner);
    elements.stopScanBtn.addEventListener('click', stopScanner);
    elements.copyResultBtn.addEventListener('click', copyResult);
}

async function startScanner() {
    try {
        // Ocultar resultado previo
        elements.scanResult.classList.add('hidden');
        
        // Verificar permisos de cámara
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' }
        });
        
        elements.video.srcObject = stream;
        elements.cameraContainer.classList.remove('hidden');
        elements.startScanBtn.classList.add('hidden');
        elements.stopScanBtn.classList.remove('hidden');
        
        isScanning = true;
        
        // Escanear QR en tiempo real
        scanQRFromVideo();
        
        console.log('📸 Cámara iniciada');
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        alert('No se pudo acceder a la cámara. Asegúrate de dar permisos.');
    }
}

function scanQRFromVideo() {
    const ctx = elements.canvas.getContext('2d');
    
    const scan = () => {
        if (!isScanning) return;
        
        if (elements.video.readyState === elements.video.HAVE_ENOUGH_DATA) {
            elements.canvas.width = elements.video.videoWidth;
            elements.canvas.height = elements.video.videoHeight;
            ctx.drawImage(elements.video, 0, 0, elements.canvas.width, elements.canvas.height);
            
            const imageData = ctx.getImageData(0, 0, elements.canvas.width, elements.canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                console.log('✅ QR detectado:', code.data);
                showScanResult(code.data);
                playBeep();
                // No detenemos automáticamente para permitir múltiples escaneos
                // stopScanner();
                return;
            }
        }
        
        requestAnimationFrame(scan);
    };
    
    // Intentar usar jsQR si está disponible, sino usar alternativa
    if (typeof jsQR === 'undefined') {
        console.log('⚠️ jsQR no disponible, usando método alternativo');
        scanQRAlternative();
    } else {
        scan();
    }
}

function scanQRAlternative() {
    // Método alternativo usando html5-qrcode
    html5QrCode = new Html5Qrcode("cameraContainer");
    
    const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 }
    };
    
    html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
            console.log('✅ QR detectado:', decodedText);
            showScanResult(decodedText);
            playBeep();
        },
        (errorMessage) => {
            // Error al escanear, continuar intentando
        }
    ).catch(err => {
        console.error('Error al iniciar scanner:', err);
    });
}

function stopScanner() {
    isScanning = false;
    
    // Detener stream de video
    if (elements.video.srcObject) {
        elements.video.srcObject.getTracks().forEach(track => track.stop());
        elements.video.srcObject = null;
    }
    
    // Detener html5-qrcode si se usó
    if (html5QrCode) {
        html5QrCode.stop().catch(err => console.log(err));
        html5QrCode = null;
    }
    
    elements.cameraContainer.classList.add('hidden');
    elements.startScanBtn.classList.remove('hidden');
    elements.stopScanBtn.classList.add('hidden');
    
    console.log('⏹️ Cámara detenida');
}

function showScanResult(text) {
    elements.resultText.textContent = text;
    elements.scanResult.classList.remove('hidden');
}

function copyResult() {
    const text = elements.resultText.textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Copiado al portapapeles');
    }).catch(err => {
        console.error('Error al copiar:', err);
    });
}

function playBeep() {
    // Sonido de confirmación
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

// ========== GENERADOR QR ==========
function setupGenerator() {
    elements.generateBtn.addEventListener('click', generateQR);
    elements.generateRandomBtn.addEventListener('click', generateRandomQR);
    elements.downloadQRBtn.addEventListener('click', downloadQR);
}

function generateQR() {
    const text = elements.qrInput.value.trim();
    
    if (!text) {
        alert('⚠️ Escribe algo para generar el QR');
        return;
    }
    
    createQRCode(text);
}

function generateRandomQR() {
    const randomTexts = [
        'https://github.com',
        'https://developer.mozilla.org',
        'PWA Test App ' + Date.now(),
        'QR Code: ' + Math.random().toString(36).substring(7),
        'Random ID: ' + crypto.randomUUID(),
        'https://www.youtube.com',
        'https://stackoverflow.com'
    ];
    
    const randomText = randomTexts[Math.floor(Math.random() * randomTexts.length)];
    elements.qrInput.value = randomText;
    createQRCode(randomText);
}

function createQRCode(text) {
    // Limpiar QR anterior
    elements.qrContainer.innerHTML = '';
    
    // Crear nuevo QR
    const qr = new QRCode(elements.qrContainer, {
        text: text,
        width: 256,
        height: 256,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
    
    elements.downloadQRBtn.classList.remove('hidden');
    
    console.log('✅ QR generado:', text);
}

function downloadQR() {
    const canvas = elements.qrContainer.querySelector('canvas');
    
    if (!canvas) {
        alert('⚠️ No hay QR para descargar');
        return;
    }
    
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-code-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('💾 QR descargado');
    });
}

// ========== NOTIFICACIONES ==========
function setupNotifications() {
    elements.enableNotificationsBtn.addEventListener('click', enableNotifications);
    elements.sendNotificationBtn.addEventListener('click', sendTestNotification);
    elements.sendCustomNotificationBtn.addEventListener('click', sendCustomNotification);
    
    checkNotificationPermission();
}

function checkNotificationPermission() {
    if (!('Notification' in window)) {
        elements.notificationStatus.textContent = 'No soportadas';
        console.warn('⚠️ Este navegador no soporta notificaciones');
        return;
    }
    
    if (Notification.permission === 'granted') {
        elements.notificationStatus.textContent = '✅ Activas';
        elements.enableNotificationsBtn.classList.add('hidden');
        elements.sendNotificationBtn.classList.remove('hidden');
        elements.notificationOptions.classList.remove('hidden');
    } else if (Notification.permission === 'denied') {
        elements.notificationStatus.textContent = '❌ Bloqueadas';
    } else {
        elements.notificationStatus.textContent = '⏸️ Pendientes';
    }
}

async function enableNotifications() {
    if (!('Notification' in window)) {
        alert('⚠️ Tu navegador no soporta notificaciones');
        return;
    }
    
    try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            elements.notificationStatus.textContent = '✅ Activas';
            elements.enableNotificationsBtn.classList.add('hidden');
            elements.sendNotificationBtn.classList.remove('hidden');
            elements.notificationOptions.classList.remove('hidden');
            
            // Enviar notificación de bienvenida
            sendNotification('¡Notificaciones activadas!', '✅ Ahora recibirás notificaciones de esta app');
            
            console.log('✅ Notificaciones activadas');
        } else {
            elements.notificationStatus.textContent = '❌ Rechazadas';
            alert('⚠️ Has rechazado los permisos de notificación');
        }
    } catch (error) {
        console.error('Error al solicitar permisos:', error);
        alert('❌ Error al solicitar permisos de notificación');
    }
}

function sendTestNotification() {
    const messages = [
        { title: '¡Hola!', body: 'Esta es una notificación de prueba 👋' },
        { title: 'QR Escaneado', body: '✅ Código QR detectado correctamente' },
        { title: 'PWA Funcionando', body: '📱 Tu PWA está trabajando correctamente' },
        { title: 'Recordatorio', body: '🔔 No olvides probar todas las funciones' }
    ];
    
    const random = messages[Math.floor(Math.random() * messages.length)];
    sendNotification(random.title, random.body);
}

function sendCustomNotification() {
    const title = elements.notifTitle.value.trim() || 'Notificación';
    const body = elements.notifBody.value.trim() || 'Mensaje de prueba';
    
    sendNotification(title, body);
    
    // Limpiar campos
    elements.notifTitle.value = '';
    elements.notifBody.value = '';
}

function sendNotification(title, body) {
    if (Notification.permission !== 'granted') {
        alert('⚠️ Debes activar las notificaciones primero');
        return;
    }
    
    const options = {
        body: body,
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'pwa-notification',
        requireInteraction: false
    };
    
    const notification = new Notification(title, options);
    
    notification.onclick = () => {
        window.focus();
        notification.close();
    };
    
    console.log('📬 Notificación enviada:', title);
}

// ========== PWA ==========
function setupPWA() {
    // Verificar si es PWA
    checkIfPWA();
    
    // Evento de instalación
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        elements.installContainer.classList.remove('hidden');
        console.log('💾 Prompt de instalación disponible');
    });
    
    elements.installButton.addEventListener('click', installPWA);
    
    // Evento cuando se instala
    window.addEventListener('appinstalled', () => {
        elements.installContainer.classList.add('hidden');
        deferredPrompt = null;
        console.log('✅ PWA instalada');
        
        sendNotification('¡App Instalada!', '📱 La PWA se instaló correctamente');
    });
    
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => {
                console.log('✅ Service Worker registrado:', reg.scope);
            })
            .catch(err => {
                console.error('❌ Error al registrar Service Worker:', err);
            });
    }
}

function checkIfPWA() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = window.navigator.standalone === true;
    
    if (isStandalone || isIOSStandalone) {
        elements.pwaStatus.textContent = '✅ Instalada';
        elements.installContainer.classList.add('hidden');
    } else {
        elements.pwaStatus.textContent = '🌐 Navegador';
    }
}

async function installPWA() {
    if (!deferredPrompt) {
        alert('⚠️ La instalación no está disponible en este momento');
        return;
    }
    
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        console.log('✅ Usuario aceptó instalar');
    } else {
        console.log('❌ Usuario rechazó instalar');
    }
    
    deferredPrompt = null;
    elements.installContainer.classList.add('hidden');
}

// ========== ESTADO ONLINE/OFFLINE ==========
function checkOnlineStatus() {
    updateOnlineStatus();
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
}

function updateOnlineStatus() {
    if (navigator.onLine) {
        elements.onlineStatus.textContent = '✅ Conectado';
    } else {
        elements.onlineStatus.textContent = '⚠️ Sin conexión';
    }
}

// ========== JSQR FALLBACK ==========
// Si jsQR no está disponible, crear un placeholder
if (typeof jsQR === 'undefined') {
    console.log('ℹ️ jsQR no cargado, usando html5-qrcode como alternativa');
}

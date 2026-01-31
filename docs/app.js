// Variables globales
let html5QrCode = null;
let deferredPrompt = null;
let isScanning = false;
let currentStream = null;
let torchEnabled = false;
let scheduledNotificationTimeout = null;
let settings = {
    theme: 'auto',
    soundEnabled: true,
    vibrationEnabled: true
};
let stats = {
    scanned: 0,
    generated: 0
};

// LocalStorage keys
const STORAGE_KEYS = {
    HISTORY_SCANNED: 'qr_history_scanned',
    HISTORY_GENERATED: 'qr_history_generated',
    SETTINGS: 'qr_settings',
    STATS: 'qr_stats'
};

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    loadSettings();
    loadStats();
    checkForUpdates();
    setupTabs();
    setupScanner();
    setupGenerator();
    setupHistory();
    setupSettings();
    setupPWA();
    checkOnlineStatus();
    applyTheme();
    updateModeUI();
    listenDisplayModeChanges();
    
    console.log('✅ App inicializada correctamente');
}

// ========== STORAGE ==========
function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
        settings = JSON.parse(saved);
    }
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

function loadStats() {
    const saved = localStorage.getItem(STORAGE_KEYS.STATS);
    if (saved) {
        stats = JSON.parse(saved);
    }
    updateStatsDisplay();
}

function saveStats() {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    updateStatsDisplay();
}

function updateStatsDisplay() {
    document.getElementById('statScanned').textContent = stats.scanned;
    document.getElementById('statGenerated').textContent = stats.generated;
    document.getElementById('statTotal').textContent = stats.scanned + stats.generated;
}

function saveToHistory(type, data) {
    const key = type === 'scanned' ? STORAGE_KEYS.HISTORY_SCANNED : STORAGE_KEYS.HISTORY_GENERATED;
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    
    history.unshift({
        id: Date.now(),
        content: data,
        date: new Date().toISOString()
    });
    
    // Limitar a 100 elementos
    if (history.length > 100) {
        history.pop();
    }
    
    localStorage.setItem(key, JSON.stringify(history));
    
    // Actualizar stats
    stats[type]++;
    saveStats();
}

function getHistory(type) {
    const key = type === 'scanned' ? STORAGE_KEYS.HISTORY_SCANNED : STORAGE_KEYS.HISTORY_GENERATED;
    return JSON.parse(localStorage.getItem(key) || '[]');
}

function clearHistory(type) {
    const key = type === 'scanned' ? STORAGE_KEYS.HISTORY_SCANNED : STORAGE_KEYS.HISTORY_GENERATED;
    localStorage.removeItem(key);
}

// ========== VERSIONADO Y ACTUALIZACIONES ==========
let currentVersion = null;

async function checkForUpdates() {
    try {
        const response = await fetch('./version.json?v=' + Date.now());
        const versionData = await response.json();
        const remoteVersion = versionData.version;
        const localVersion = localStorage.getItem('app_version') || '1.0.0';
        
        currentVersion = remoteVersion;
        localStorage.setItem('app_version', remoteVersion);
        
        if (localVersion !== remoteVersion) {
            console.log(`🔄 Actualización disponible: ${localVersion} → ${remoteVersion}`);
            showUpdateNotification(remoteVersion, versionData.changelog[0].changes);
        }
    } catch (error) {
        console.log('ℹ️ No se pudo verificar actualizaciones:', error);
    }
}

function showUpdateNotification(version, changes) {
    // Crear notificación de actualización
    const existingNotif = document.getElementById('updateNotification');
    if (existingNotif) existingNotif.remove();
    
    const notification = document.createElement('div');
    notification.id = 'updateNotification';
    notification.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, var(--primary-color), #0066cc);
        color: white;
        padding: 15px 20px;
        text-align: center;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px;
        font-size: 14px;
        font-weight: 500;
        animation: slideDown 0.3s ease-out;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                transform: translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    const text = document.createElement('span');
    text.innerHTML = `
        <strong>✨ Versión ${version} disponible</strong><br>
        ${changes.slice(0, 2).join(' • ')}
    `;
    
    const button = document.createElement('button');
    button.textContent = 'Recargar';
    button.style.cssText = `
        background: white;
        color: var(--primary-color);
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: transform 0.2s;
    `;
    button.onmouseover = () => button.style.transform = 'scale(1.05)';
    button.onmouseout = () => button.style.transform = 'scale(1)';
    button.onclick = () => location.reload();
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
        background: rgba(255,255,255,0.2);
        color: white;
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    `;
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,0.3)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255,255,255,0.2)';
    closeBtn.onclick = () => notification.remove();
    
    notification.appendChild(text);
    notification.appendChild(button);
    notification.appendChild(closeBtn);
    document.body.insertBefore(notification, document.body.firstChild);
    
    // Auto-cerrar después de 10 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideDown 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 10000);
}

// ========== TABS ==========
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(tabName);
    
    if (activeBtn && activeContent) {
        activeBtn.classList.add('active');
        activeContent.classList.add('active');
    }
    
    if (tabName !== 'scanner' && isScanning) {
        stopScanner();
    }
    
    if (tabName === 'history') {
        loadHistoryView();
    }
}

// ========== SCANNER QR ==========
function setupScanner() {
    document.getElementById('startScanBtn').addEventListener('click', startScanner);
    document.getElementById('stopScanBtn').addEventListener('click', stopScanner);
    document.getElementById('uploadImageBtn').addEventListener('click', () => {
        document.getElementById('imageInput').click();
    });
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);
    document.getElementById('copyResultBtn').addEventListener('click', copyResult);
    document.getElementById('shareResultBtn').addEventListener('click', shareResult);
    document.getElementById('saveResultBtn').addEventListener('click', () => {
        const text = document.getElementById('resultText').textContent;
        saveToHistory('scanned', text);
        showToast('✅ Guardado en historial');
    });
    document.getElementById('toggleFlashBtn').addEventListener('click', toggleFlash);
}

async function startScanner() {
    try {
        document.getElementById('scanResult').classList.add('hidden');
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' }
        });
        
        currentStream = stream;
        const video = document.getElementById('video');
        video.srcObject = stream;
        
        document.getElementById('cameraContainer').classList.remove('hidden');
        document.getElementById('startScanBtn').classList.add('hidden');
        document.getElementById('stopScanBtn').classList.remove('hidden');
        
        // Mostrar botón de flash si está disponible
        const track = stream.getVideoTracks()[0];
        if (track.getCapabilities && track.getCapabilities().torch) {
            document.getElementById('toggleFlashBtn').classList.remove('hidden');
        }
        
        isScanning = true;
        scanQRFromVideo();
        
        console.log('📸 Cámara iniciada');
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        alert('No se pudo acceder a la cámara. Asegúrate de dar permisos.');
    }
}

function scanQRFromVideo() {
    const canvas = document.getElementById('canvas');
    const video = document.getElementById('video');
    const ctx = canvas.getContext('2d');
    
    const scan = () => {
        if (!isScanning) return;
        
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            if (typeof jsQR !== 'undefined') {
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code) {
                    console.log('✅ QR detectado:', code.data);
                    showScanResult(code.data);
                    playBeep();
                    vibrate();
                    saveToHistory('scanned', code.data);
                    return;
                }
            }
        }
        
        requestAnimationFrame(scan);
    };
    
    if (typeof jsQR === 'undefined') {
        console.log('⚠️ jsQR no disponible, usando html5-qrcode');
        scanQRAlternative();
    } else {
        scan();
    }
}

function scanQRAlternative() {
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
            vibrate();
            saveToHistory('scanned', decodedText);
        }
    ).catch(err => {
        console.error('Error al iniciar scanner:', err);
    });
}

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        // Usar html5-qrcode para escanear imagen
        if (typeof Html5Qrcode !== 'undefined') {
            const html5QrCode = new Html5Qrcode("qr-reader-temp");
            const result = await html5QrCode.scanFile(file, true);
            showScanResult(result);
            playBeep();
            vibrate();
            saveToHistory('scanned', result);
        } else {
            alert('⚠️ Función no disponible');
        }
    } catch (error) {
        console.error('Error al escanear imagen:', error);
        alert('❌ No se pudo detectar un QR en la imagen');
    }
}

async function toggleFlash() {
    if (!currentStream) return;
    const track = currentStream.getVideoTracks()[0];
    const capabilities = track.getCapabilities ? track.getCapabilities() : {};
    if (!capabilities.torch) {
        showToast('⚠️ Flash no disponible');
        return;
    }

    try {
        torchEnabled = !torchEnabled;
        await track.applyConstraints({ advanced: [{ torch: torchEnabled }] });
        showToast(torchEnabled ? '🔦 Flash encendido' : '💡 Flash apagado');
    } catch (error) {
        torchEnabled = false;
        console.error('Error al activar flash:', error);
        showToast('❌ No se pudo activar el flash');
    }
}

function stopScanner() {
    isScanning = false;
    
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    
    if (html5QrCode) {
        html5QrCode.stop().catch(err => console.log(err));
        html5QrCode = null;
    }
    
    document.getElementById('cameraContainer').classList.add('hidden');
    document.getElementById('startScanBtn').classList.remove('hidden');
    document.getElementById('stopScanBtn').classList.add('hidden');
    torchEnabled = false;
    document.getElementById('toggleFlashBtn').classList.add('hidden');
    
    console.log('⏹️ Cámara detenida');
}

function showScanResult(text) {
    document.getElementById('resultText').textContent = text;
    document.getElementById('scanResult').classList.remove('hidden');
}

function copyResult() {
    const text = document.getElementById('resultText').textContent;
    navigator.clipboard.writeText(text).then(() => {
        showToast('✅ Copiado al portapapeles');
    }).catch(err => {
        console.error('Error al copiar:', err);
    });
}

async function shareResult() {
    const text = document.getElementById('resultText').textContent;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'QR Escaneado',
                text: text
            });
            console.log('✅ Compartido');
        } catch (error) {
            console.log('Compartir cancelado');
        }
    } else {
        copyResult();
    }
}

// ========== GENERADOR QR ==========
function setupGenerator() {
    const qrType = document.getElementById('qrType');
    qrType.addEventListener('change', handleQRTypeChange);
    
    document.getElementById('generateBtn').addEventListener('click', generateQR);
    document.getElementById('generateRandomBtn').addEventListener('click', generateRandomQR);
    document.getElementById('downloadQRBtn').addEventListener('click', downloadQR);
    document.getElementById('shareQRBtn').addEventListener('click', shareQR);
    document.getElementById('saveQRBtn').addEventListener('click', () => {
        const text = getQRDataFromForm();
        saveToHistory('generated', text);
        showToast('✅ Guardado en historial');
    });
    
    document.getElementById('getLocationBtn').addEventListener('click', getGeolocation);
}

function handleQRTypeChange() {
    const type = document.getElementById('qrType').value;
    
    document.querySelectorAll('.qr-form').forEach(form => {
        form.classList.add('hidden');
    });
    
    document.getElementById(`${type}Form`).classList.remove('hidden');
}

function getQRDataFromForm() {
    const type = document.getElementById('qrType').value;
    let data = '';
    
    switch(type) {
        case 'text':
            data = document.getElementById('qrInput').value.trim();
            break;
        case 'wifi':
            const ssid = document.getElementById('wifiSSID').value;
            const password = document.getElementById('wifiPassword').value;
            const encryption = document.getElementById('wifiEncryption').value;
            data = `WIFI:T:${encryption};S:${ssid};P:${password};;`;
            break;
        case 'vcard':
            const name = document.getElementById('vcardName').value;
            const phone = document.getElementById('vcardPhone').value;
            const email = document.getElementById('vcardEmail').value;
            data = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`;
            break;
        case 'email':
            const emailTo = document.getElementById('emailTo').value;
            const subject = document.getElementById('emailSubject').value;
            const body = document.getElementById('emailBody').value;
            data = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            break;
        case 'sms':
            const number = document.getElementById('smsNumber').value;
            const message = document.getElementById('smsMessage').value;
            data = `sms:${number}?body=${encodeURIComponent(message)}`;
            break;
        case 'geo':
            const lat = document.getElementById('geoLat').value;
            const long = document.getElementById('geoLong').value;
            data = `geo:${lat},${long}`;
            break;
    }
    
    return data;
}

function generateQR() {
    const text = getQRDataFromForm();
    
    if (!text) {
        alert('⚠️ Completa los campos requeridos');
        return;
    }
    
    createQRCode(text);
    saveToHistory('generated', text);
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
    document.getElementById('qrInput').value = randomText;
    createQRCode(randomText);
    saveToHistory('generated', randomText);
}

function createQRCode(text) {
    const container = document.getElementById('qrContainer');
    container.innerHTML = '';
    
    const colorDark = document.getElementById('qrColorDark').value;
    const colorLight = document.getElementById('qrColorLight').value;
    
    const qr = new QRCode(container, {
        text: text,
        width: 256,
        height: 256,
        colorDark: colorDark,
        colorLight: colorLight,
        correctLevel: QRCode.CorrectLevel.H
    });
    
    document.getElementById('qrActions').classList.remove('hidden');
    
    console.log('✅ QR generado:', text);
}

function downloadQR() {
    const canvas = document.getElementById('qrContainer').querySelector('canvas');
    
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
        
        showToast('💾 QR descargado');
    });
}

async function shareQR() {
    const canvas = document.getElementById('qrContainer').querySelector('canvas');
    
    if (!canvas) {
        alert('⚠️ No hay QR para compartir');
        return;
    }
    
    canvas.toBlob(async (blob) => {
        const file = new File([blob], 'qr-code.png', { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: 'Código QR',
                    text: 'Código QR generado',
                    files: [file]
                });
                console.log('✅ Compartido');
            } catch (error) {
                console.log('Compartir cancelado');
            }
        } else {
            downloadQR();
        }
    });
}

async function getGeolocation() {
    if (!navigator.geolocation) {
        alert('⚠️ Geolocalización no disponible');
        return;
    }
    
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        document.getElementById('geoLat').value = position.coords.latitude.toFixed(6);
        document.getElementById('geoLong').value = position.coords.longitude.toFixed(6);
        
        showToast('📍 Ubicación obtenida');
    } catch (error) {
        console.error('Error al obtener ubicación:', error);
        alert('❌ No se pudo obtener la ubicación');
    }
}

// ========== HISTORIAL ==========
function setupHistory() {
    document.querySelectorAll('.history-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.history-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadHistoryView();
        });
    });
    
    document.getElementById('clearHistoryBtn').addEventListener('click', () => {
        if (confirm('¿Borrar todo el historial?')) {
            const type = document.querySelector('.history-tab-btn.active').dataset.type;
            clearHistory(type);
            loadHistoryView();
            showToast('🗑️ Historial borrado');
        }
    });
    
    document.getElementById('exportHistoryBtn').addEventListener('click', exportHistory);
}

function loadHistoryView() {
    const type = document.querySelector('.history-tab-btn.active').dataset.type;
    const history = getHistory(type);
    const container = document.getElementById('historyList');
    
    if (history.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay elementos en el historial</p>';
        return;
    }
    
    container.innerHTML = history.map(item => `
        <div class="history-item" data-id="${item.id}">
            <div class="history-item-header">
                <span class="history-item-date">${formatDate(item.date)}</span>
                <button onclick="deleteHistoryItem('${type}', ${item.id})" style="background: #f44336; color: white; padding: 4px 8px; border: none; border-radius: 4px; cursor: pointer;">🗑️</button>
            </div>
            <div class="history-item-content">${escapeHtml(item.content)}</div>
            <div class="history-item-actions">
                <button onclick="copyText('${escapeHtml(item.content)}')" style="background: #2196F3; color: white; padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer;">📋 Copiar</button>
                <button onclick="shareText('${escapeHtml(item.content)}')" style="background: #4CAF50; color: white; padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer;">🔗 Compartir</button>
            </div>
        </div>
    `).join('');
}

function deleteHistoryItem(type, id) {
    const key = type === 'scanned' ? STORAGE_KEYS.HISTORY_SCANNED : STORAGE_KEYS.HISTORY_GENERATED;
    let history = JSON.parse(localStorage.getItem(key) || '[]');
    history = history.filter(item => item.id !== id);
    localStorage.setItem(key, JSON.stringify(history));
    loadHistoryView();
    showToast('🗑️ Elemento borrado');
}

function exportHistory() {
    const type = document.querySelector('.history-tab-btn.active').dataset.type;
    const history = getHistory(type);
    
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-history-${type}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('📤 Historial exportado');
}

// ========== AJUSTES ==========
function setupSettings() {
    const themeSelect = document.getElementById('themeSelect');
    const soundEnabled = document.getElementById('soundEnabled');
    const vibrationEnabled = document.getElementById('vibrationEnabled');
    
    themeSelect.value = settings.theme;
    soundEnabled.checked = settings.soundEnabled;
    vibrationEnabled.checked = settings.vibrationEnabled;
    
    themeSelect.addEventListener('change', (e) => {
        settings.theme = e.target.value;
        saveSettings();
        applyTheme();
    });
    
    soundEnabled.addEventListener('change', (e) => {
        settings.soundEnabled = e.target.checked;
        saveSettings();
    });
    
    vibrationEnabled.addEventListener('change', (e) => {
        settings.vibrationEnabled = e.target.checked;
        saveSettings();
    });
    
    document.getElementById('enableNotificationsBtn').addEventListener('click', enableNotifications);
    document.getElementById('sendNotificationBtn').addEventListener('click', sendTestNotification);

    document.getElementById('scheduleNotificationBtn').addEventListener('click', scheduleNotification);
    document.getElementById('cancelScheduledNotificationBtn').addEventListener('click', cancelScheduledNotification);
    
    document.getElementById('clearAllDataBtn').addEventListener('click', () => {
        if (confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) {
            localStorage.clear();
            location.reload();
        }
    });
    
    checkNotificationPermission();
}

function scheduleNotification() {
    const minutes = parseInt(document.getElementById('notificationDelay').value, 10);
    const message = document.getElementById('notificationMessage').value.trim() || 'Recordatorio de prueba';

    if (!Number.isFinite(minutes) || minutes < 1) {
        alert('⚠️ Indica un número de minutos válido (mínimo 1)');
        return;
    }

    if (Notification.permission !== 'granted') {
        alert('⚠️ Activa las notificaciones primero');
        return;
    }

    cancelScheduledNotification();

    const delayMs = minutes * 60 * 1000;
    const runAt = new Date(Date.now() + delayMs);

    scheduledNotificationTimeout = setTimeout(() => {
        sendNotification('⏰ Recordatorio', message);
        scheduledNotificationTimeout = null;
        updateScheduledInfo(null);
    }, delayMs);

    updateScheduledInfo(runAt);
    document.getElementById('cancelScheduledNotificationBtn').classList.remove('hidden');
    showToast(`⏰ Notificación programada en ${minutes} min`);
}

function cancelScheduledNotification() {
    if (scheduledNotificationTimeout) {
        clearTimeout(scheduledNotificationTimeout);
        scheduledNotificationTimeout = null;
    }
    updateScheduledInfo(null);
    document.getElementById('cancelScheduledNotificationBtn').classList.add('hidden');
}

function updateScheduledInfo(date) {
    const info = document.getElementById('scheduledInfo');
    if (!date) {
        info.classList.add('hidden');
        info.textContent = '';
        return;
    }
    info.textContent = `Programada para: ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    info.classList.remove('hidden');
}

function applyTheme() {
    const theme = settings.theme;
    
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else if (theme === 'light') {
        document.body.classList.remove('dark-mode');
    } else {
        // Auto: detectar preferencia del sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
}

// ========== NOTIFICACIONES ==========
function checkNotificationPermission() {
    if (!('Notification' in window)) {
        document.getElementById('statusText').textContent = 'No soportadas';
        return;
    }
    
    if (Notification.permission === 'granted') {
        document.getElementById('statusText').textContent = '✅ Activas';
        document.getElementById('enableNotificationsBtn').classList.add('hidden');
        document.getElementById('sendNotificationBtn').classList.remove('hidden');
    } else if (Notification.permission === 'denied') {
        document.getElementById('statusText').textContent = '❌ Bloqueadas';
    } else {
        document.getElementById('statusText').textContent = '⏸️ Pendientes';
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
            document.getElementById('statusText').textContent = '✅ Activas';
            document.getElementById('enableNotificationsBtn').classList.add('hidden');
            document.getElementById('sendNotificationBtn').classList.remove('hidden');
            
            sendNotification('¡Notificaciones activadas!', '✅ Ahora recibirás notificaciones de esta app');
        } else {
            document.getElementById('statusText').textContent = '❌ Rechazadas';
        }
    } catch (error) {
        console.error('Error al solicitar permisos:', error);
    }
}

function sendTestNotification() {
    const messages = [
        { title: '¡Hola!', body: 'Esta es una notificación de prueba 👋' },
        { title: 'QR Escaneado', body: '✅ Código QR detectado correctamente' },
        { title: 'PWA Funcionando', body: '📱 Tu PWA está trabajando correctamente' }
    ];
    
    const random = messages[Math.floor(Math.random() * messages.length)];
    sendNotification(random.title, random.body);
}

function sendNotification(title, body) {
    if (Notification.permission !== 'granted') {
        return;
    }
    
    const options = {
        body: body,
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'pwa-notification'
    };
    
    const notification = new Notification(title, options);
    
    notification.onclick = () => {
        window.focus();
        notification.close();
    };
}

// ========== PWA ==========
function setupPWA() {
    checkIfPWA();
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('installContainer').classList.remove('hidden');
    });
    
    document.getElementById('installButton').addEventListener('click', installPWA);
    
    window.addEventListener('appinstalled', () => {
        document.getElementById('installContainer').classList.add('hidden');
        deferredPrompt = null;
        updateModeUI();
        sendNotification('¡App Instalada!', '📱 La PWA se instaló correctamente');
    });
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => {
                console.log('✅ Service Worker registrado');

                if (reg.waiting) {
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                }

                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🔄 Nueva versión disponible, actualizando...');
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                });
            })
            .catch(err => console.error('❌ Error Service Worker:', err));

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        });
    }
}

function checkIfPWA() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = window.navigator.standalone === true;
    
    if (isStandalone || isIOSStandalone) {
        document.getElementById('pwaStatus').textContent = '✅ Instalada';
        document.getElementById('installContainer').classList.add('hidden');
    } else {
        document.getElementById('pwaStatus').textContent = '🌐 Navegador';
    }
}

function isRunningAsPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function updateModeUI() {
    const isPwa = isRunningAsPWA();
    document.querySelectorAll('.only-app').forEach(el => {
        el.style.display = isPwa ? 'block' : 'none';
    });
    document.querySelectorAll('.only-browser').forEach(el => {
        el.style.display = isPwa ? 'none' : 'block';
    });
}

function listenDisplayModeChanges() {
    const mq = window.matchMedia('(display-mode: standalone)');
    const handler = () => updateModeUI();
    if (mq.addEventListener) {
        mq.addEventListener('change', handler);
    } else if (mq.addListener) {
        mq.addListener(handler);
    }
}

async function installPWA() {
    if (!deferredPrompt) {
        alert('⚠️ La instalación no está disponible');
        return;
    }
    
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    document.getElementById('installContainer').classList.add('hidden');
}

// ========== ESTADO ONLINE/OFFLINE ==========
function checkOnlineStatus() {
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
}

function updateOnlineStatus() {
    const statusEl = document.getElementById('onlineStatus');
    if (navigator.onLine) {
        statusEl.textContent = '✅ Conectado';
    } else {
        statusEl.textContent = '⚠️ Sin conexión';
    }
}

// ========== UTILIDADES ==========
function playBeep() {
    if (!settings.soundEnabled) return;
    
    try {
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
    } catch (error) {
        console.log('Error al reproducir sonido');
    }
}

function vibrate() {
    if (!settings.vibrationEnabled) return;
    
    if ('vibrate' in navigator) {
        navigator.vibrate(200);
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideDown 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
    
    return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('✅ Copiado');
    });
}

async function shareText(text) {
    if (navigator.share) {
        try {
            await navigator.share({ text: text });
        } catch (error) {
            copyText(text);
        }
    } else {
        copyText(text);
    }
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

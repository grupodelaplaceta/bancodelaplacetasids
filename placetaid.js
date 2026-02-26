
/**
 * PLACETA ID - OFFICIAL SDK V.1.0
 * Integra el sistema de identidad de La Placeta en cualquier web.
 * 
 * Uso:
 * <div id="placeta-login"></div>
 * <script src="https://tu-sede.vercel.app/placetaid.js"></script>
 * <script>
 *    const pid = new PlacetaID({
 *       containerId: 'placeta-login',
 *       apiUrl: 'https://tu-sede.vercel.app/api/placetaid', // Cambiar por URL real
 *       onSuccess: (user) => { console.log("Usuario logueado:", user); }
 *    });
 * </script>
 */

class PlacetaID {
    constructor(config) {
        this.config = {
            containerId: config.containerId || 'placeta-id-container',
            apiUrl: config.apiUrl || window.location.origin + '/api/placetaid',
            onSuccess: config.onSuccess || function(u){ console.log(u) },
            themeColor: '#3f00d8'
        };
        
        this.state = {
            step: 'LOGIN', // LOGIN | 2FA
            dni: '',
            password: '',
            isLoading: false,
            error: null
        };

        this.init();
    }

    init() {
        this.injectStyles();
        this.renderButton();
    }

    injectStyles() {
        if (document.getElementById('placeta-id-styles')) return;
        const style = document.createElement('style');
        style.id = 'placeta-id-styles';
        style.textContent = `
            .pid-btn { background-color: ${this.config.themeColor}; color: white; border: none; padding: 10px 20px; border-radius: 4px; font-family: sans-serif; font-weight: bold; cursor: pointer; display: inline-flex; items-align: center; gap: 10px; font-size: 14px; transition: all 0.2s; text-transform: uppercase; letter-spacing: 1px; }
            .pid-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(63,0,216,0.2); }
            .pid-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 99999; display: flex; align-items: center; justify-content: center; opacity: 0; animation: pidFadeIn 0.3s forwards; }
            .pid-modal { background: white; width: 100%; max-width: 400px; border-radius: 8px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); font-family: 'Plus Jakarta Sans', sans-serif; position: relative; transform: scale(0.95); animation: pidZoomIn 0.3s forwards; }
            .pid-header { background: #f8fafc; padding: 20px; text-align: center; border-bottom: 1px solid #e2e8f0; }
            .pid-logo { height: 40px; margin-bottom: 10px; }
            .pid-title { color: ${this.config.themeColor}; font-weight: 900; margin: 0; text-transform: uppercase; font-size: 18px; letter-spacing: -0.5px; }
            .pid-body { padding: 30px; }
            .pid-input-group { margin-bottom: 20px; }
            .pid-label { display: block; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
            .pid-input { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; outline: none; transition: border 0.2s; box-sizing: border-box; }
            .pid-input:focus { border-color: ${this.config.themeColor}; ring: 2px solid ${this.config.themeColor}20; }
            .pid-input.pin-mode { text-align: center; font-size: 24px; letter-spacing: 8px; font-family: monospace; color: ${this.config.themeColor}; font-weight: bold; }
            .pid-submit { width: 100%; background: ${this.config.themeColor}; color: white; border: none; padding: 14px; border-radius: 4px; font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
            .pid-submit:disabled { opacity: 0.7; cursor: not-allowed; }
            .pid-error { background: #fef2f2; color: #991b1b; padding: 10px; border-radius: 4px; font-size: 12px; margin-bottom: 20px; border-left: 3px solid #ef4444; font-weight: 600; }
            .pid-close { position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; }
            .pid-close:hover { color: #475569; }
            .pid-footer { text-align: center; padding: 15px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }
            
            @keyframes pidFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes pidZoomIn { from { transform: scale(0.95); } to { transform: scale(1); } }
        `;
        document.head.appendChild(style);
    }

    renderButton() {
        const container = document.getElementById(this.config.containerId);
        if (!container) return;

        const btn = document.createElement('button');
        btn.className = 'pid-btn';
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            Identificarse con PlacetaID
        `;
        btn.onclick = () => this.openModal();
        container.innerHTML = '';
        container.appendChild(btn);
    }

    openModal() {
        // Reset state
        this.state = { step: 'LOGIN', dni: '', password: '', isLoading: false, error: null };
        
        const overlay = document.createElement('div');
        overlay.className = 'pid-modal-overlay';
        overlay.id = 'pid-overlay';
        
        overlay.innerHTML = `
            <div class="pid-modal">
                <button class="pid-close" id="pid-close">✕</button>
                <div class="pid-header">
                    <img src="https://i.postimg.cc/dVFvsFR6/FR.png" class="pid-logo" alt="Logo">
                    <h2 class="pid-title">Placeta<span style="color:#1e293b">ID</span></h2>
                    <p style="font-size:10px; color:#64748b; margin-top:5px; text-transform:uppercase; font-weight:bold;">Pasarela de Identificación Segura</p>
                </div>
                <div class="pid-body" id="pid-form-container">
                    <!-- Form injected here -->
                </div>
                <div class="pid-footer">
                    🔒 Conexión Segura cifrada por Sede Electrónica
                </div>
            </div>
        `;

        // Close logic
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });

        document.body.appendChild(overlay);
        
        // Bind Close button
        document.getElementById('pid-close').onclick = () => this.closeModal();

        this.renderForm();
    }

    closeModal() {
        const overlay = document.getElementById('pid-overlay');
        if (overlay) overlay.remove();
    }

    renderForm() {
        const container = document.getElementById('pid-form-container');
        if (!container) return;

        let html = '';
        
        if (this.state.error) {
            html += `<div class="pid-error">${this.state.error}</div>`;
        }

        if (this.state.step === 'LOGIN') {
            html += `
                <div class="pid-input-group">
                    <label class="pid-label">Documento DIP</label>
                    <input type="text" id="pid-dni" class="pid-input" placeholder="DIP-XXXX" value="${this.state.dni}" autofocus>
                </div>
                <div class="pid-input-group">
                    <label class="pid-label">Contraseña</label>
                    <input type="password" id="pid-pass" class="pid-input" placeholder="••••••••">
                </div>
                <button id="pid-action" class="pid-submit">${this.state.isLoading ? 'Verificando...' : 'Continuar'}</button>
            `;
        } else if (this.state.step === '2FA') {
            html += `
                <div style="text-align:center; margin-bottom:20px;">
                    <div style="background:#f3f4f6; width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 15px; color:${this.config.themeColor}; font-size:24px;">🛡️</div>
                    <h3 style="margin:0; font-size:14px; color:#334155;">Verificación en Dos Pasos</h3>
                    <p style="margin:5px 0 0; font-size:12px; color:#64748b;">Introduzca el código de su aplicación Authenticator</p>
                </div>
                <div class="pid-input-group">
                    <input type="text" id="pid-token" class="pid-input pin-mode" maxlength="6" placeholder="000 000" autofocus>
                </div>
                <button id="pid-action" class="pid-submit">${this.state.isLoading ? 'Validando...' : 'Confirmar Acceso'}</button>
            `;
        }

        container.innerHTML = html;

        // Bind events
        const btn = document.getElementById('pid-action');
        if (btn) btn.onclick = () => this.handleSubmit();

        // Bind Enter key
        const inputs = container.querySelectorAll('input');
        inputs.forEach(input => {
            input.onkeydown = (e) => {
                if (e.key === 'Enter') this.handleSubmit();
            }
        });

        // Focus logic
        if (this.state.step === 'LOGIN') {
             const dniInput = document.getElementById('pid-dni');
             if(dniInput && !this.state.dni) dniInput.focus();
             else if (document.getElementById('pid-pass')) document.getElementById('pid-pass').focus();
        } else {
             const tokenInput = document.getElementById('pid-token');
             if(tokenInput) tokenInput.focus();
        }
    }

    async handleSubmit() {
        if (this.state.isLoading) return;

        if (this.state.step === 'LOGIN') {
            const dni = document.getElementById('pid-dni').value;
            const pass = document.getElementById('pid-pass').value;
            
            if (!dni || !pass) {
                this.state.error = "Por favor, complete todos los campos.";
                this.renderForm();
                return;
            }

            this.state.dni = dni;
            this.state.password = pass;
        } 
        
        let token = null;
        if (this.state.step === '2FA') {
            token = document.getElementById('pid-token').value.replace(/\s/g, '');
            if (token.length < 6) {
                this.state.error = "El código debe tener 6 dígitos.";
                this.renderForm();
                return;
            }
        }

        this.state.isLoading = true;
        this.state.error = null;
        this.renderForm();

        try {
            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dni: this.state.dni,
                    password: this.state.password,
                    token: token
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Success
                this.closeModal();
                if (this.config.onSuccess) this.config.onSuccess(data.user);
            } else if (response.status === 401 && data.error === '2FA_REQUIRED') {
                // Move to 2FA Step
                this.state.step = '2FA';
                this.state.isLoading = false;
                this.renderForm();
            } else {
                // Generic Error
                this.state.error = data.message || data.error || "Credenciales incorrectas.";
                this.state.isLoading = false;
                this.renderForm();
            }

        } catch (e) {
            console.error(e);
            this.state.error = "Error de conexión con el servidor de identidad.";
            this.state.isLoading = false;
            this.renderForm();
        }
    }
}

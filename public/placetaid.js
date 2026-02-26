
/**
 * PLACETA ID - OFFICIAL SDK V.6.0 (Mobile Optimized)
 * Fixes: 401 Handling, UI Responsiveness, Visual Feedback
 */

class PlacetaID {
    constructor(config) {
        this.config = {
            containerId: config.containerId || 'placeta-id-container',
            apiUrl: config.apiUrl ? config.apiUrl.replace(/\/$/, '') : (window.location.origin + '/api/placetaid'),
            onSuccess: config.onSuccess || function(u){ console.log('PlacetaID Success:', u) },
            theme: config.theme || 'dark'
        };
        
        this.state = { 
            step: 'LOGIN', 
            dni: '',
            password: '',
            isLoading: false
        };
        
        this.init();
    }

    init() {
        this.injectStyles();
        this.renderButton();
    }

    injectStyles() {
        if (document.getElementById('pid-v6-styles')) return;
        const style = document.createElement('style');
        style.id = 'pid-v6-styles';
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
            
            .pid-scope { font-family: 'Plus Jakarta Sans', sans-serif; --pid-primary: #0f172a; --pid-accent: #5e17eb; }

            .pid-btn {
                background: white; color: var(--pid-primary); border: 1px solid #e2e8f0; 
                padding: 16px 24px; border-radius: 20px; width: 100%;
                font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;
                cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px;
                transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            }
            .pid-btn:active { transform: scale(0.96); }
            
            .pid-icon { width: 24px; height: 24px; background: var(--pid-primary); color: white; border-radius: 8px; display: grid; place-items: center; font-size: 10px; font-weight: 900; }

            .pid-overlay {
                position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
                backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                z-index: 10000; display: flex; align-items: center; justify-content: center;
                opacity: 0; animation: pidFadeIn 0.3s forwards; padding: 20px;
            }

            .pid-card {
                background: rgba(255, 255, 255, 0.98); width: 100%; max-width: 360px;
                border-radius: 32px; padding: 32px 24px;
                box-shadow: 0 40px 60px -12px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.5) inset;
                transform: scale(0.95); opacity: 0;
                animation: pidPop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                position: relative; overflow: hidden;
            }

            .pid-header { text-align: center; margin-bottom: 24px; }
            .pid-brand { width: 100%; height: 80px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; padding: 10px; }
            .pid-brand img { width: 100%; height: 100%; object-fit: contain; }
            .pid-h1 { font-size: 20px; font-weight: 800; color: var(--pid-primary); margin: 0; letter-spacing: -0.5px; }
            .pid-sub { font-size: 12px; font-weight: 600; color: #64748b; margin-top: 4px; }

            .pid-input-wrap { margin-bottom: 16px; }
            .pid-input {
                width: 100%; box-sizing: border-box; padding: 16px 20px;
                font-size: 16px; font-weight: 700; color: var(--pid-primary);
                background: #f1f5f9; border: 2px solid transparent; border-radius: 16px;
                outline: none; transition: all 0.2s;
            }
            .pid-input:focus { background: white; border-color: var(--pid-accent); box-shadow: 0 0 0 4px rgba(94, 23, 235, 0.15); }
            .pid-input::placeholder { color: #cbd5e1; font-weight: 500; }
            .pid-input.center { text-align: center; letter-spacing: 4px; font-family: monospace; font-size: 24px; }

            .pid-action {
                width: 100%; padding: 18px; border: none; border-radius: 16px;
                background: var(--pid-primary); color: white; font-size: 14px; font-weight: 800;
                cursor: pointer; transition: all 0.2s; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px;
                box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2);
            }
            .pid-action:active { transform: scale(0.96); }
            .pid-action:disabled { opacity: 0.7; cursor: wait; }

            .pid-close {
                position: absolute; top: 20px; right: 20px; width: 32px; height: 32px;
                border-radius: 50%; background: #f1f5f9; color: #64748b; border: none;
                display: grid; place-items: center; cursor: pointer; transition: all 0.2s;
            }
            .pid-close:hover { background: #e2e8f0; color: var(--pid-primary); }

            .pid-msg {
                padding: 12px; border-radius: 12px; font-size: 12px; font-weight: 700; text-align: center;
                margin-bottom: 20px; animation: pidShake 0.4s;
            }
            .pid-msg.error { background: #fee2e2; color: #ef4444; }
            .pid-msg.info { background: #eff6ff; color: #3b82f6; }

            .pid-footer { margin-top: 32px; text-align: center; font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; gap: 6px; }

            @keyframes pidFadeIn { to { opacity: 1; } }
            @keyframes pidPop { to { transform: scale(1); opacity: 1; } }
            @keyframes pidShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
            @keyframes pidSpin { to { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
    }

    renderButton() {
        const container = document.getElementById(this.config.containerId);
        if(!container) return;
        
        container.innerHTML = `
            <div class="pid-scope">
                <button class="pid-btn" id="pid-trigger">
                    <div class="pid-icon">ID</div>
                    Conectar con PlacetaID
                </button>
            </div>
        `;
        document.getElementById('pid-trigger').onclick = () => this.open();
    }

    open() {
        this.state = { step: 'LOGIN', dni: '', password: '', isLoading: false };
        
        const overlay = document.createElement('div');
        overlay.className = 'pid-overlay pid-scope';
        overlay.id = 'pid-ui';
        overlay.innerHTML = `
            <div class="pid-card">
                <button class="pid-close" id="pid-close">✕</button>
                <div class="pid-header">
                    <div class="pid-brand">
                        <img src="https://i.postimg.cc/5t0S5t3p/BANCO-DE.png" alt="Logo">
                    </div>
                    <h2 class="pid-h1">PlacetaID</h2>
                    <p class="pid-sub">Identidad Soberana Digital</p>
                </div>
                <div id="pid-content"></div>
                <div class="pid-footer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    Conexión Segura SSL
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        document.getElementById('pid-close').onclick = () => this.close();
        this.renderStep();
    }

    close() {
        const el = document.getElementById('pid-ui');
        if(el) {
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 200);
        }
    }

    renderStep() {
        const container = document.getElementById('pid-content');
        if(!container) return;

        let html = '';
        
        if (this.state.step === 'LOGIN') {
            html = `
                <form id="pid-form">
                    <div class="pid-input-wrap">
                        <input type="text" id="pid-dni" class="pid-input" placeholder="DIP-XXXXXX" value="${this.state.dni}" required autocomplete="username" inputmode="text">
                    </div>
                    <div class="pid-input-wrap">
                        <input type="password" id="pid-pass" class="pid-input" placeholder="Clave de Nodo" required autocomplete="current-password">
                    </div>
                    <button type="submit" class="pid-action" id="pid-submit">
                        Iniciar Sesión
                    </button>
                </form>
            `;
        } else if (this.state.step === '2FA') {
            html = `
                <form id="pid-form">
                    <div class="pid-msg info">⚠️ Verificación Requerida</div>
                    <div class="pid-input-wrap">
                        <input type="text" id="pid-token" class="pid-input center" placeholder="000 000" maxlength="6" inputmode="numeric" pattern="[0-9]*" required autofocus>
                    </div>
                    <button type="submit" class="pid-action" id="pid-submit">
                        Confirmar Acceso
                    </button>
                </form>
            `;
        }

        container.innerHTML = html;

        if(this.state.step === 'LOGIN') {
            const inp = document.getElementById('pid-dni');
            if(inp && !inp.value) inp.focus();
        }

        document.getElementById('pid-form').onsubmit = (e) => {
            e.preventDefault();
            this.handleSubmit();
        };
    }

    async handleSubmit() {
        if (this.state.isLoading) return;

        const btn = document.getElementById('pid-submit');
        const originalText = btn.innerText;
        btn.innerHTML = `<span style="display:inline-block; animation:pidSpin 1s linear infinite; margin-right:8px">◌</span> Conectando`;
        btn.disabled = true;
        this.state.isLoading = true;

        const payload = {};
        if (this.state.step === 'LOGIN') {
            this.state.dni = document.getElementById('pid-dni').value.toUpperCase();
            this.state.password = document.getElementById('pid-pass').value;
            payload.dni = this.state.dni;
            payload.password = this.state.password;
        } else {
            payload.dni = this.state.dni;
            payload.password = this.state.password;
            payload.token = document.getElementById('pid-token').value;
        }

        const oldErr = document.querySelector('.pid-msg.error');
        if(oldErr) oldErr.remove();

        try {
            const res = await fetch(this.config.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            
            this.state.isLoading = false;
            btn.disabled = false;
            btn.innerText = originalText;

            if (res.ok && data.success) {
                btn.style.background = '#10b981';
                btn.innerText = '¡Acceso Concedido!';
                setTimeout(() => {
                    this.close();
                    this.config.onSuccess(data.user);
                }, 500);
            } else if (res.status === 401 && data.error === '2FA_REQUIRED') {
                this.state.step = '2FA';
                this.renderStep();
            } else {
                this.showError(data.message || data.error || "Credenciales inválidas");
            }

        } catch (e) {
            console.error(e);
            this.state.isLoading = false;
            btn.disabled = false;
            btn.innerText = "Reintentar";
            this.showError("Error de red: No se pudo conectar al nodo.");
        }
    }

    showError(msg) {
        const container = document.getElementById('pid-content');
        const err = document.createElement('div');
        err.className = 'pid-msg error';
        err.innerText = msg;
        container.prepend(err);
    }
}

window.PlacetaID = PlacetaID;
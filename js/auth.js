/**
 * SuperMart - Authentication, Route Guards & Shared Utilities
 *
 * NOTE: This is still a FRONTEND-ONLY DEMO. Passwords are no longer stored as plain text
 * (only salted SHA-256 hashes), but anything running in the browser can be bypassed.
 * Real security needs the Laravel backend (server-side check + hashed passwords + token/session).
 */

const SESSION_KEY = 'supermart_active_session';
const HASH_SALT = 'supermart-demo-v1';

// No plain-text passwords here. hash = SHA-256("salt:username:password")
const USERS = {
    cashier: {
        username: 'cashier',
        passwordHash: '26802541fd222108fc5ae8052d7c89e844c8447281fd72f17a10f077512e61b0',
        role: 'cashier',
        name: 'XYZ',
        roleTitle: 'Senior Cashier',
        branch: 'Main Branch, Chattogram'
    },
    admin: {
        username: 'admin',
        passwordHash: '1d2878619b6f4c559a49e7835308969badff62062520efa91b3b84fa49823d35',
        role: 'admin',
        name: 'Jawad Siddik',
        roleTitle: 'System Admin',
        branch: 'Main Branch, Chattogram'
    }
};

// Simple brute-force slowdown (in memory)
const LOGIN_LIMIT = { maxAttempts: 5, lockMs: 30000, attempts: 0, lockedUntil: 0 };

const Auth = {
    // To make a new hash, open the login page console and run:
    //   Auth.hash('username', 'new-password').then(console.log)
    async hash(username, password) {
        const data = new TextEncoder().encode(`${HASH_SALT}:${username}:${password}`);
        const buf = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    getCurrentUser() {
        try {
            const session = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
            return session ? JSON.parse(session) : null;
        } catch (e) {
            return null;
        }
    },

    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },

    async login(username, password, selectedRole, rememberMe = false) {
        const now = Date.now();
        if (now < LOGIN_LIMIT.lockedUntil) {
            const secs = Math.ceil((LOGIN_LIMIT.lockedUntil - now) / 1000);
            return { success: false, error: `Too many attempts. Try again in ${secs}s.` };
        }

        if (!(window.crypto && crypto.subtle)) {
            return { success: false, error: 'Secure context required. Open via localhost or https.' };
        }

        const u = username.trim().toLowerCase();
        const p = password; // do not trim passwords
        const inputHash = await this.hash(u, p);

        const account = Object.values(USERS).find(
            user => user.username === u && user.passwordHash === inputHash
        );

        // One generic message for wrong password OR wrong role (does not reveal which accounts exist)
        if (!account || account.role !== selectedRole) {
            LOGIN_LIMIT.attempts++;
            if (LOGIN_LIMIT.attempts >= LOGIN_LIMIT.maxAttempts) {
                LOGIN_LIMIT.attempts = 0;
                LOGIN_LIMIT.lockedUntil = Date.now() + LOGIN_LIMIT.lockMs;
            }
            return { success: false, error: 'Invalid username, password or role.' };
        }

        LOGIN_LIMIT.attempts = 0;

        // Save session WITHOUT the password hash
        const { passwordHash, ...safeUser } = account;
        const sessionData = { ...safeUser, loginTime: new Date().toISOString() };

        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        if (rememberMe) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        } else {
            localStorage.removeItem(SESSION_KEY);
        }

        return {
            success: true,
            user: sessionData,
            redirectUrl: account.role === 'admin' ? 'admin.html' : 'pos.html'
        };
    },

    logout() {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_KEY);
        window.location.href = 'index.html';
    },

    // Route guard for protected pages
    guard(requiredRole = null) {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'index.html';
            return false;
        }

        if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
            alert('Access Denied: You do not have permission to view the Admin Dashboard.');
            window.location.href = 'pos.html';
            return false;
        }

        return true;
    }
};

/* ==========================================================================
   TOAST NOTIFICATION ENGINE
   ========================================================================== */
function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-triangle-exclamation';
    if (type === 'warning') iconClass = 'fa-bell';

    const icon = document.createElement('i');
    icon.className = `fa-solid ${iconClass}`;
    const text = document.createElement('span');
    text.textContent = message; // textContent (not innerHTML) to avoid HTML injection
    toast.append(icon, text);

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/* ==========================================================================
   WEB AUDIO API SOUND EFFECTS
   ========================================================================== */
const SoundFX = {
    audioCtx: null,

    init() {
        if (!this.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
    },

    play(type = 'beep') {
        const settings = (typeof DB !== 'undefined' && DB) ? DB.getSettings() : { soundEnabled: true };
        if (settings && settings.soundEnabled === false) return;

        try {
            this.init();
            if (!this.audioCtx) return;

            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const ctx = this.audioCtx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === 'beep') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1760, now);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.setValueAtTime(160, now + 0.1);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'success') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.setValueAtTime(659.25, now + 0.08);
                osc.frequency.setValueAtTime(783.99, now + 0.16);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            }
        } catch (e) {
            console.log('Audio playback skipped:', e);
        }
    }
};

/* ==========================================================================
   LIVE REAL-TIME CLOCK & DATE FORMATTER
   ========================================================================== */
function initLiveDateTime() {
    function update() {
        const now = new Date();

        const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? String(hours).padStart(2, '0') : '12';
        const timeStr = `${hours}:${minutes}:${seconds} ${ampm}`;

        document.querySelectorAll('.live-date').forEach(el => el.textContent = dateStr);
        document.querySelectorAll('.live-time').forEach(el => el.textContent = timeStr);
        document.querySelectorAll('.live-datetime').forEach(el => el.textContent = `${dateStr}  ${timeStr}`);
    }

    update();
    setInterval(update, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    initLiveDateTime();

    const user = Auth.getCurrentUser();
    if (user) {
        document.querySelectorAll('.user-display-name').forEach(el => el.textContent = user.name || user.username);
        document.querySelectorAll('.user-display-role').forEach(el => el.textContent = user.roleTitle || user.role);
        document.querySelectorAll('.user-display-branch').forEach(el => el.textContent = user.branch || 'Main Branch');
    }
});
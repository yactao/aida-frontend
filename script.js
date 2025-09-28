document.addEventListener('DOMContentLoaded', () => {
    // --- SÉLECTEURS ---
    const pages = document.querySelectorAll('.page');
    const homeLink = document.getElementById('home-link');
    const registerBtn = document.querySelector('.btn-register');
    const userMenuContainer = document.querySelector('.user-menu-container');
    const userInfoClickable = document.getElementById('user-info-clickable');
    const userDropdown = document.querySelector('.user-dropdown');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutBtn = document.getElementById('logout-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    // ... et tous les autres sélecteurs nécessaires pour les autres pages

    // --- VARIABLES GLOBALES ---
    const backendUrl = 'https://aida-backend-bqd0fnd2a3c7dadf.francecentral-01.azurewebsites.net/api';
    let currentUser = null;
    // ... et les autres variables globales ...

    // --- LOGIQUE D'ANIMATION ---
    function setupHeroAnimation() {
        const canvas = document.getElementById('hero-animation');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let particles = [];
        const setCanvasSize = () => {
            canvas.width = window.innerWidth;
            // Assurez-vous que le parent a une hauteur définie, sinon l'animation pourrait ne pas être visible
            canvas.height = canvas.parentElement.offsetHeight > 0 ? canvas.parentElement.offsetHeight : window.innerHeight;
        };

        class Particle {
            constructor(x, y, size, color, speedX, speedY) {
                this.x = x; this.y = y; this.size = size; this.color = color;
                this.speedX = speedX; this.speedY = speedY;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
            update() {
                if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
                if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
                this.x += this.speedX;
                this.y += this.speedY;
            }
        }

        function init() {
            setCanvasSize();
            particles = [];
            const particleCount = (canvas.width * canvas.height) / 9000;
            const isDarkMode = document.body.classList.contains('dark-mode');
            const particleColor = isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';

            for (let i = 0; i < particleCount; i++) {
                let size = Math.random() * 2 + 1;
                let x = Math.random() * (canvas.width - size * 2) + size;
                let y = Math.random() * (canvas.height - size * 2) + size;
                let speedX = (Math.random() - 0.5) * 0.5;
                let speedY = (Math.random() - 0.5) * 0.5;
                particles.push(new Particle(x, y, size, particleColor, speedX, speedY));
            }
        }

        function connect() {
            let opacityValue = 1;
            const isDarkMode = document.body.classList.contains('dark-mode');
            const lineColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    let distance = Math.sqrt(Math.pow(particles[a].x - particles[b].x, 2) + Math.pow(particles[a].y - particles[b].y, 2));
                    if (distance < 120) {
                        opacityValue = 1 - (distance / 120);
                        ctx.strokeStyle = lineColor.replace(/, [0-9.]+\)/, `, ${opacityValue})`);
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            connect();
            requestAnimationFrame(animate);
        }

        window.addEventListener('resize', init);
        themeToggleBtn?.addEventListener('click', init);
        init();
        animate();
    }

    // --- LOGIQUE DE L'APPLICATION ---
    function changePage(targetId) {
        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(targetId);
        if(targetPage) {
            targetPage.classList.add('active');
        } else {
            console.error(`La page avec l'ID '${targetId}' n'a pas été trouvée.`);
        }
    }

    function applyTheme(theme) { /* ... (code inchangé) ... */ }
    async function handleAuth(url, body) { /* ... (code complet ici) ... */ }
    async function setupUIForUser() { /* ... (code complet ici) ... */ }
    // ... Toutes les autres fonctions de votre application ...
    
    function initializeAppState() {
        changePage('home');
        if (userMenuContainer) userMenuContainer.classList.add('hidden');
        if (registerBtn) registerBtn.classList.remove('hidden');
    }

    function setupEventListeners() {
        homeLink.addEventListener('click', (e) => { e.preventDefault(); initializeAppState(); });
        registerBtn.addEventListener('click', (e) => { e.preventDefault(); changePage('auth-page'); });
        
        document.querySelectorAll('#home .selection-card').forEach(card => {
            if (card.tagName !== 'A') {
                card.addEventListener('click', () => {
                    const targetPage = card.getAttribute('data-target');
                    if (targetPage) changePage(targetPage);
                });
            }
        });
        
        // ... (Le reste de vos listeners pour les formulaires, les modales, etc.)
    }

    // --- POINT D'ENTRÉE ---
    function init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
        initializeAppState();
        setupEventListeners();
        setupHeroAnimation(); // Lancement de l'animation
    }

    init();
});


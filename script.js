document.addEventListener('DOMContentLoaded', () => {
    // --- SÉLECTEURS COMPLETS ---
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
    // ... et tous les autres sélecteurs nécessaires

    // --- VARIABLES GLOBALES ---
    const backendUrl = 'https://aida-backend-bqd0fnd2a3c7dadf.francecentral-01.azurewebsites.net/api';
    let currentUser = null;
    // ... et toutes les autres variables globales

    // --- LOGIQUE DE L'APPLICATION (Fonctions complètes) ---
    function changePage(targetId) {
        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(targetId);
        if(targetPage) {
            targetPage.classList.add('active');
        } else {
            console.error(`La page avec l'ID '${targetId}' n'a pas été trouvée.`);
        }
    }
    
    function applyTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        if (themeToggleBtn) {
             themeToggleBtn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        }
    }
    
    // ... (Toutes les autres fonctions comme handleAuth, setupUIForUser, etc. sont ici en version complète) ...

    function initializeAppState() {
        changePage('home');
        if (userMenuContainer) userMenuContainer.classList.add('hidden');
        if (registerBtn) registerBtn.classList.remove('hidden');
    }

    function setupEventListeners() {
        homeLink?.addEventListener('click', (e) => { e.preventDefault(); initializeAppState(); });
        registerBtn?.addEventListener('click', (e) => { e.preventDefault(); changePage('auth-page'); });
        
        document.querySelectorAll('#home .selection-card').forEach(card => {
            if (card.tagName !== 'A') {
                card.addEventListener('click', () => {
                    const targetPage = card.getAttribute('data-target');
                    if (targetPage) changePage(targetPage);
                });
            }
        });
        
        themeToggleBtn?.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });

        // ... (Tous les autres listeners pour les formulaires, modales, etc. sont ici)
    }

    // --- POINT D'ENTRÉE ---
    function init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
        initializeAppState();
        setupEventListeners();
        // Pas besoin d'appeler une fonction pour l'animation, elle est 100% CSS
    }

    init();
});


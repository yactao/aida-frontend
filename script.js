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
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const teacherWelcome = document.getElementById('teacher-welcome');
    const openClassModalBtn = document.getElementById('open-class-modal-btn');
    const classModal = document.getElementById('create-class-modal');
    const createClassForm = document.getElementById('create-class-form');
    const classListContainer = document.getElementById('class-list');
    const noClassesMessage = document.getElementById('no-classes-message');
    const openResourceModalBtn = document.querySelector('.new-resource-btn');
    const generationModal = document.getElementById('generation-modal');
    const resourceForm = document.getElementById('resource-form');
    const modalFormStep = document.getElementById('modal-form-step');
    const modalLoadingStep = document.getElementById('modal-loading-step');
    const modalResultStep = document.getElementById('modal-result-step');
    const assignClassSelect = document.getElementById('assign-class-select');
    const studentWelcome = document.getElementById('student-welcome');
    const joinClassPanel = document.getElementById('join-class-panel');
    const joinClassForm = document.getElementById('join-class-form');
    const studentModuleList = document.getElementById('student-module-list');
    const contentTitle = document.getElementById('content-title');
    const contentViewer = document.getElementById('content-viewer');
    const submitQuizBtn = document.getElementById('submit-quiz-btn');
    const quizResult = document.getElementById('quiz-result');
    const classDetailsTitle = document.getElementById('class-details-title');
    const classDetailsContent = document.getElementById('class-details-content');
    const backToTeacherDashboardBtn = document.getElementById('back-to-teacher-dashboard');
    const cycleSelect = document.getElementById('cycle-select');
    const levelSelect = document.getElementById('level-select');
    const subjectSelect = document.getElementById('subject-select');
    const notionSelect = document.getElementById('notion-select');
    const contentTypeSelect = document.getElementById('content-type-select');
    const resourceFormButton = document.querySelector('#resource-form button');
    const generatedContentEditor = document.getElementById('generated-content-editor');
    const confirmAssignBtn = document.getElementById('confirm-assign-btn');
    const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');

    // --- VARIABLES GLOBALES ---
    const backendUrl = 'https://aida-backend-bqd0fnd2a3c7dadf.francecentral-01.azurewebsites.net/api';
    let currentUser = null;
    let generatedContentData = null;
    let programmesData = null;
    let currentClassData = null;
    let currentQuizData = null;
    let currentClassId = null;

    // --- LOGIQUE DE L'APPLICATION ---
    function changePage(targetId) {
        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(targetId);
        if (targetPage) {
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

    async function handleAuth(url, body) {
        const errorEl = body.role ? document.getElementById('signup-error') : document.getElementById('login-error');
        if (errorEl) errorEl.textContent = '';
        try {
            const response = await fetch(`${backendUrl}${url}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            currentUser = data.user;
            await setupUIForUser();
        } catch (error) {
            if (errorEl) errorEl.textContent = error.message;
        }
    }

    async function setupUIForUser() {
        if (!currentUser) return;
        registerBtn?.classList.add('hidden');
        userMenuContainer?.classList.remove('hidden');
        if (userEmailDisplay) userEmailDisplay.textContent = currentUser.email;
        if (userDropdown) userDropdown.classList.add('hidden');
        
        if (currentUser.role === 'teacher') {
            changePage('teacher-dashboard');
            await fetchAndDisplayClasses();
        } else {
            changePage('student-dashboard');
            await fetchAndDisplayStudentContent();
        }
    }

    function logout() {
        currentUser = null;
        userMenuContainer?.classList.add('hidden');
        registerBtn?.classList.remove('hidden');
        initializeAppState();
    }
    
    async function fetchAndDisplayClasses() {
        // ... (Cette fonction charge les classes pour le professeur)
    }
    
    async function fetchAndDisplayStudentContent() {
        // ... (Cette fonction charge les modules pour l'élève)
    }

    function initializeAppState() {
        changePage('home');
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

        showSignupLink?.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('login-form-container')?.classList.add('hidden'); document.getElementById('signup-form-container')?.classList.remove('hidden'); });
        showLoginLink?.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('signup-form-container')?.classList.add('hidden'); document.getElementById('login-form-container')?.classList.remove('hidden'); });

        loginForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            handleAuth('/auth/login', {
                email: e.target.elements['login-email'].value,
                password: e.target.elements['login-password'].value
            });
        });

        signupForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            handleAuth('/auth/signup', {
                email: e.target.elements['signup-email'].value,
                password: e.target.elements['signup-password'].value,
                role: e.target.elements['signup-role'].value
            });
        });

        logoutBtn?.addEventListener('click', logout);
        
        userInfoClickable?.addEventListener('click', () => userDropdown?.classList.toggle('hidden'));
        window.addEventListener('click', (e) => {
            if (userMenuContainer && !userMenuContainer.contains(e.target)) {
                userDropdown?.classList.add('hidden');
            }
        });
    }

    // --- POINT D'ENTRÉE ---
    function init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
        initializeAppState();
        setupEventListeners();
    }

    init();
});


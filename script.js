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
    const generatedContentEditor = document.getElementById('generated-content-editor');
    const assignClassSelect = document.getElementById('assign-class-select');
    const confirmAssignBtn = document.getElementById('confirm-assign-btn');
    
    const studentWelcome = document.getElementById('student-welcome');
    const joinClassPanel = document.getElementById('join-class-panel');
    const joinClassForm = document.getElementById('join-class-form');
    const studentModuleList = document.getElementById('student-module-list');
    
    const contentPage = document.getElementById('content-page');
    const contentTitle = document.getElementById('content-title');
    const contentViewer = document.getElementById('content-viewer');
    const submitQuizBtn = document.getElementById('submit-quiz-btn');
    const quizResult = document.getElementById('quiz-result');
    const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');

    const classDetailsTitle = document.getElementById('class-details-title');
    const classDetailsContent = document.getElementById('class-details-content');
    const backToTeacherDashboardBtn = document.getElementById('back-to-teacher-dashboard');

    const cycleSelect = document.getElementById('cycle-select');
    const levelSelect = document.getElementById('level-select');
    const subjectSelect = document.getElementById('subject-select');
    const notionSelect = document.getElementById('notion-select');
    const contentTypeSelect = document.getElementById('content-type-select');
    const resourceFormButton = document.querySelector('#resource-form button');

    // --- VARIABLES GLOBALES ---
    const backendUrl = 'https://aida-backend-bqd0fnd2a3c7dadf.francecentral-01.azurewebsites.net/api';
    let currentUser = null;
    let generatedContentData = null;
    let programmesData = null;
    let currentClassData = null;

    // --- LOGIQUE D'ANIMATION ---
    function setupHeroAnimation() {
        const canvas = document.getElementById('hero-animation');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let particles = [];
        const setCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = canvas.parentElement.offsetHeight;
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
        document.getElementById(targetId)?.classList.add('active');
    }

    function applyTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        themeToggleBtn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    }

    async function handleAuth(url, body) { /* ... (code inchangé) ... */ }
    async function setupUIForUser() { /* ... (code inchangé) ... */ }
    function logout() { /* ... (code inchangé) ... */ }
    async function fetchAndDisplayClasses() { /* ... (code inchangé) ... */ }
    async function showClassDetails(classId, className) { /* ... (code inchangé) ... */ }
    function displayContentForTeacher(contentId) { /* ... (code inchangé) ... */ }
    function displayStudentResultDetails(resultId) { /* ... (code inchangé) ... */ }
    async function fetchAndDisplayStudentContent() { /* ... (code inchangé) ... */ }
    function displayContent(contentData, classId) { /* ... (code inchangé) ... */ }
    function displayQuiz(quizData, classId) { /* ... (code inchangé) ... */ }
    async function submitQuiz(quizData, classId) { /* ... (code inchangé) ... */ }
    function populateSelect(selectElement, options, defaultText, isObject = false) { /* ... (code inchangé) ... */ }
    function findCompetences(data, path) { /* ... (code inchangé) ... */ }
    function initializeResourceModal() { /* ... (code inchangé) ... */ }
    async function loadProgrammesForCycle(cycle) { /* ... (code inchangé) ... */ }

    function initializeAppState() {
        changePage('home');
        // Cache les éléments de l'utilisateur connecté et montre le bouton de connexion
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

        themeToggleBtn.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
        showSignupLink.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('login-form-container').classList.add('hidden'); document.getElementById('signup-form-container').classList.remove('hidden'); });
        showLoginLink.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('signup-form-container').classList.add('hidden'); document.getElementById('login-form-container').classList.remove('hidden'); });
        
        userInfoClickable?.addEventListener('click', () => userDropdown?.classList.toggle('hidden'));
        window.addEventListener('click', (e) => {
            if (userMenuContainer && !userMenuContainer.contains(e.target)) {
                userDropdown?.classList.add('hidden');
            }
        });
        logoutBtn?.addEventListener('click', logout);
        
        backToTeacherDashboardBtn?.addEventListener('click', () => changePage('teacher-dashboard'));
        backToDashboardBtn?.addEventListener('click', () => currentUser.role === 'teacher' ? changePage('teacher-dashboard') : changePage('student-dashboard'));

        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
            modal.querySelector('.close-modal')?.addEventListener('click', () => modal.classList.add('hidden'));
        });
        
        loginForm?.addEventListener('submit', (e) => { e.preventDefault(); handleAuth('/auth/login', { email: loginForm.elements['login-email'].value, password: loginForm.elements['login-password'].value }); });
        signupForm?.addEventListener('submit', (e) => { e.preventDefault(); handleAuth('/auth/signup', { email: signupForm.elements['signup-email'].value, password: signupForm.elements['signup-password'].value, role: signupForm.elements['signup-role'].value }); });

        openClassModalBtn?.addEventListener('click', () => classModal.classList.remove('hidden'));
        createClassForm?.addEventListener('submit', async (e) => { /* ... (code inchangé) ... */ });
        openResourceModalBtn?.addEventListener('click', () => { generationModal.classList.remove('hidden'); initializeResourceModal(); });
        cycleSelect?.addEventListener('change', () => loadProgrammesForCycle(cycleSelect.value));
        levelSelect?.addEventListener('change', () => { /* ... (code inchangé) ... */ });
        subjectSelect?.addEventListener('change', () => { /* ... (code inchangé) ... */ });
        notionSelect?.addEventListener('change', () => { resourceFormButton.disabled = !notionSelect.value; });
        resourceForm?.addEventListener('submit', async (e) => { /* ... (code inchangé) ... */ });
        confirmAssignBtn?.addEventListener('click', async () => { /* ... (code inchangé) ... */ });
        joinClassForm?.addEventListener('submit', async (e) => { /* ... (code inchangé) ... */ });
        classDetailsContent?.addEventListener('click', (e) => { /* ... (code inchangé) ... */ });
        submitQuizBtn?.addEventListener('click', () => submitQuiz(currentQuizData, currentClassId));
    }

    // --- POINT D'ENTRÉE PRINCIPAL ---
    function init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
        initializeAppState();
        setupEventListeners();
        setupHeroAnimation();
    }

    init();
});


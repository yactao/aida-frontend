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
    const aidaIntroAnimation = document.getElementById('aida-intro-animation');
    const startBtn = document.getElementById('start-btn');

    // --- VARIABLES GLOBALES ---
    const backendUrl = 'https://aida-backend-bqd0fnd2a3c7dadf.francecentral-01.azurewebsites.net/api';
    let currentUser = null;
    let introAnimationTimeout; // Pour pouvoir interrompre l'animation
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
            await fetchAndDisplayClasses();
            changePage('teacher-dashboard');
        } else {
            await fetchAndDisplayStudentContent();
            changePage('student-dashboard');
        }
    }

    function logout() {
        currentUser = null;
        userMenuContainer?.classList.add('hidden');
        registerBtn?.classList.remove('hidden');
        initializeAppState();
    }
    
    async function fetchAndDisplayClasses() {
        if (!currentUser || !classListContainer) return;
        if (teacherWelcome) teacherWelcome.textContent = `Tableau de bord de ${currentUser.email.split('@')[0]}`;
        try {
            const response = await fetch(`${backendUrl}/classes/${currentUser.email}`);
            const classes = await response.json();
            classListContainer.innerHTML = '';
            if (noClassesMessage) noClassesMessage.style.display = classes.length === 0 ? 'block' : 'none';
            classes.forEach(cls => {
                const classCard = document.createElement('div');
                classCard.className = 'dashboard-card clickable';
                classCard.innerHTML = `<h4><i class="fa-solid fa-users"></i> ${cls.className}</h4><p>${cls.students.length} élève(s)</p><p>${(cls.quizzes || []).length} contenu(s)</p>`;
                classCard.addEventListener('click', () => showClassDetails(cls.id, cls.className));
                classListContainer.appendChild(classCard);
            });
        } catch(e) { console.error("Erreur de chargement des classes", e); }
    }

    async function fetchAndDisplayStudentContent() {
        if (!currentUser || !studentModuleList) return;
        if (studentWelcome) studentWelcome.textContent = `Bonjour ${currentUser.email.split('@')[0]} !`;
        // ... (Le reste de la logique pour afficher les modules)
    }

    // --- ANIMATION D'INTRODUCTION ---
    function setupIntroAnimation() {
        const heroContent = document.querySelector('.hero-content');
        if (!aidaIntroAnimation || !heroContent) return;

        const animationTexts = ["Pour les élèves", "Pour les enseignants", "Créez des ressources", "Suivez les progrès", "Apprenez simplement"];
        const animationColors = ['#4A90E2', '#50E3C2', '#F5A623', '#8E44AD', '#D35400'];
        let currentIndex = 0;

        function animateStep() {
            if (currentIndex < animationTexts.length) {
                const text = animationTexts[currentIndex];
                const textElement = document.createElement('span');
                textElement.className = 'animation-text is-entering';
                textElement.textContent = text;
                textElement.style.color = animationColors[currentIndex % animationColors.length];
                
                aidaIntroAnimation.innerHTML = '';
                aidaIntroAnimation.appendChild(textElement);
                
                introAnimationTimeout = setTimeout(() => {
                    textElement.className = 'animation-text is-leaving';
                    currentIndex++;
                    introAnimationTimeout = setTimeout(animateStep, 750);
                }, 1500);
            } else {
                interruptIntroAnimation();
            }
        }
        heroContent.classList.add('hidden');
        aidaIntroAnimation.parentElement?.classList.remove('hidden');
        animateStep();
    }
    
    function interruptIntroAnimation() {
        clearTimeout(introAnimationTimeout);
        aidaIntroAnimation.parentElement?.classList.add('hidden');
        document.querySelector('.hero-content')?.classList.remove('hidden');
    }

    function initializeAppState() {
        changePage('home');
    }

    function setupEventListeners() {
        homeLink?.addEventListener('click', (e) => { e.preventDefault(); initializeAppState(); });
        
        registerBtn?.addEventListener('click', (e) => { 
            e.preventDefault(); 
            interruptIntroAnimation();
            changePage('auth-page'); 
        });
        startBtn?.addEventListener('click', (e) => { 
            e.preventDefault(); 
            interruptIntroAnimation();
            changePage('auth-page'); 
        });
        
        loginForm?.addEventListener('submit', (e) => { e.preventDefault(); handleAuth('/auth/login', { email: e.target.elements['login-email'].value, password: e.target.elements['login-password'].value }); });
        signupForm?.addEventListener('submit', (e) => { e.preventDefault(); handleAuth('/auth/signup', { email: e.target.elements['signup-email'].value, password: e.target.elements['signup-password'].value, role: e.target.elements['signup-role'].value }); });
        logoutBtn?.addEventListener('click', logout);
        
        openClassModalBtn?.addEventListener('click', () => classModal?.classList.remove('hidden'));
        openResourceModalBtn?.addEventListener('click', () => generationModal?.classList.remove('hidden'));
        
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal-overlay').classList.add('hidden');
            });
        });
        
        createClassForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const className = e.target.elements['class-name-input'].value;
            try {
                await fetch(`${backendUrl}/classes/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ className, teacherEmail: currentUser.email }) });
                await fetchAndDisplayClasses();
                classModal.classList.add('hidden');
                e.target.reset();
            } catch (error) {
                console.error("Erreur création classe", error);
            }
        });
    }

    // --- POINT D'ENTRÉE ---
    function init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
        initializeAppState();
        setupEventListeners();
        setupIntroAnimation();
    }

    init();
});


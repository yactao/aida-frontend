// URL complète du backend Azure
const backendUrl = 'https://aida-backend-bqd0fnd2a3c7dadf.francecentral-01.azurewebsites.net/api';

document.addEventListener('DOMContentLoaded', () => {
    // --- SÉLECTEURS COMPLETS (Basés sur votre version fonctionnelle) ---
    const pages = document.querySelectorAll('.page');
    const registerBtn = document.querySelector('.btn-register');
    const homeLink = document.getElementById('home-link');
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
    const userMenuContainer = document.querySelector('.user-menu-container');
    const guestControls = document.querySelector('.guest-controls');
    const userInfoClickable = document.getElementById('user-info-clickable');
    const userDropdown = document.querySelector('.user-dropdown');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutBtn = document.getElementById('logout-btn');
    const startBtn = document.getElementById('start-btn');
    const aidaIntroAnimation = document.getElementById('aida-intro-animation');
    // ... (tous les autres sélecteurs de votre fichier fonctionnel sont ici pour la complétude)
    const resourceForm = document.getElementById('resource-form');
    const assignClassSelect = document.getElementById('assign-class-select');
    const studentWelcome = document.getElementById('student-welcome');
    const joinClassPanel = document.getElementById('join-class-panel');
    const joinClassForm = document.getElementById('join-class-form');
    const studentModuleList = document.getElementById('student-module-list');

    // --- VARIABLES GLOBALES ---
    let currentUser = null;
    let introAnimationTimeout;

    // --- NAVIGATION ET UI ---
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

    // --- AUTHENTIFICATION ---
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
        guestControls?.classList.add('hidden');
        userMenuContainer?.classList.remove('hidden');
        if (userEmailDisplay) userEmailDisplay.textContent = currentUser.email;
        if (userDropdown) userDropdown.classList.add('hidden');
        
        if (currentUser.role === 'teacher') {
            await fetchAndDisplayClasses();
            changePage('teacher-dashboard');
        } else {
            // await fetchAndDisplayStudentContent(); // Logique élève à venir
            changePage('student-dashboard');
        }
    }

    function logout() {
        currentUser = null;
        initializeAppState();
    }
    
    // --- LOGIQUE ENSEIGNANT ---
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
                classCard.innerHTML = `<h4><i class="fa-solid fa-users"></i> ${cls.className}</h4><p>${cls.students.length} élève(s)</p>`;
                classListContainer.appendChild(classCard);
            });
        } catch(e) { console.error("Erreur de chargement des classes", e); }
    }

    // --- ANIMATION ---
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
        guestControls?.classList.remove('hidden');
        userMenuContainer?.classList.add('hidden');
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
        
        loginForm?.addEventListener('submit', (e) => { e.preventDefault(); handleAuth('/auth/login', { email: loginForm.elements['login-email'].value, password: loginForm.elements['login-password'].value }); });
        signupForm?.addEventListener('submit', (e) => { e.preventDefault(); handleAuth('/auth/signup', { email: signupForm.elements['signup-email'].value, password: signupForm.elements['signup-password'].value, role: signupForm.elements['signup-role'].value }); });
        showLoginLink?.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('signup-form-container').classList.add('hidden'); document.getElementById('login-form-container').classList.remove('hidden'); });
        showSignupLink?.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('login-form-container').classList.add('hidden'); document.getElementById('signup-form-container').classList.remove('hidden'); });
        
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
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    initializeAppState();
    setupEventListeners();
    setupIntroAnimation();
});


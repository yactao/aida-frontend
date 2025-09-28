// URL complète du backend Azure
const backendUrl = 'https://aida-backend-bqd0fnd2a3c7dadf.francecentral-01.azurewebsites.net/api';

document.addEventListener('DOMContentLoaded', () => {
    // --- SÉLECTEURS ---
    const pages = document.querySelectorAll('.page');
    const startButton = document.querySelector('#home .btn-main');
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
    const classDetailsTitle = document.getElementById('class-details-title');
    const classDetailsContent = document.getElementById('class-details-content');
    const backToTeacherDashboardBtn = document.getElementById('back-to-teacher-dashboard');
    const cycleSelect = document.getElementById('cycle-select');
    const levelSelect = document.getElementById('level-select');
    const subjectSelect = document.getElementById('subject-select');
    const notionSelect = document.getElementById('notion-select');
    const contentTypeSelect = document.getElementById('content-type-select');
    const resourceFormButton = resourceForm.querySelector('button');
    const generatedContentEditor = document.getElementById('generated-content-editor');
    const confirmAssignBtn = document.getElementById('confirm-assign-btn');
    const userMenuContainer = document.querySelector('.user-menu-container');
    const userInfoClickable = document.getElementById('user-info-clickable');
    const userDropdown = document.querySelector('.user-dropdown');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutBtn = document.getElementById('logout-btn');

    // --- VARIABLES GLOBALES ---
    let currentUser = null;
    let generatedContentData = null;
    let programmesData = null;
    let currentClassData = null;

    // --- NAVIGATION ET UI ---
    function changePage(targetId) {
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(targetId)?.classList.add('active');
    }

    function applyTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        themeToggleBtn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    }

    // --- AUTHENTIFICATION ---
    async function handleAuth(url, body) {
        const errorEl = body.role ? document.getElementById('signup-error') : document.getElementById('login-error');
        errorEl.textContent = '';
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
        } catch (error) { errorEl.textContent = error.message; }
    }

    async function setupUIForUser() {
        if (!currentUser) {
            registerBtn.classList.remove('hidden');
            userMenuContainer.classList.add('hidden');
            return;
        }
        registerBtn.classList.add('hidden');
        userMenuContainer.classList.remove('hidden');
        userEmailDisplay.textContent = currentUser.email;
        userDropdown.classList.add('hidden');

        if (currentUser.role === 'teacher') {
            teacherWelcome.textContent = `Tableau de bord de ${currentUser.email.split('@')[0]}`;
            await fetchAndDisplayClasses();
            changePage('teacher-dashboard');
        } else {
            studentWelcome.textContent = `Bonjour ${currentUser.email.split('@')[0]} !`;
            await fetchAndDisplayStudentContent();
            changePage('student-dashboard');
        }
    }

    function logout() {
        currentUser = null;
        initializeAppState();
    }

    // --- LOGIQUE ENSEIGNANT ---
    async function fetchAndDisplayClasses() { /* ... (inchangé) ... */ }
    
    async function showClassDetails(classId, className) {
        changePage('class-details-page');
        classDetailsTitle.textContent = `Détails de la classe : ${className}`;
        classDetailsContent.innerHTML = '<div class="spinner"></div>';

        try {
            const response = await fetch(`${backendUrl}/class/details/${classId}`);
            currentClassData = await response.json();
            classDetailsContent.innerHTML = ''; // Nettoyer

            // Section des contenus assignés
            const contentsSection = document.createElement('div');
            contentsSection.className = 'class-details-section';
            contentsSection.innerHTML = '<h3>Contenus Assignés</h3>';
            const contentList = document.createElement('ul');
            contentList.className = 'content-list';
            if (currentClassData.quizzes && currentClassData.quizzes.length > 0) {
                currentClassData.quizzes.forEach(content => {
                    const li = document.createElement('li');
                    li.innerHTML = `${content.title} <button data-content-id="${content.id}">Voir</button>`;
                    contentList.appendChild(li);
                });
            } else {
                contentList.innerHTML = '<p>Aucun contenu assigné pour cette classe.</p>';
            }
            contentsSection.appendChild(contentList);
            classDetailsContent.appendChild(contentsSection);

            // Section des résultats
            const resultsSection = document.createElement('div');
            resultsSection.className = 'class-details-section';
            resultsSection.innerHTML = '<h3>Résultats des Élèves</h3>';
             if (currentClassData.results && currentClassData.results.length > 0) {
                 // Logique d'affichage des résultats (inchangée)
             } else {
                 resultsSection.innerHTML += '<p>Aucun élève n\'a encore terminé de contenu.</p>';
             }
            classDetailsContent.appendChild(resultsSection);

        } catch (error) {
            classDetailsContent.innerHTML = "<p>Erreur lors du chargement des détails.</p>";
        }
    }

    function displayContentForTeacher(contentId) {
        const content = currentClassData.quizzes.find(q => q.id === contentId);
        if (!content) return;
        // Pour la simplicité, on utilise alert pour la prévisualisation
        alert(`Prévisualisation de : ${content.title}\n\n` + JSON.stringify(content, null, 2));
    }

    // --- INITIALISATION & GESTION DES ÉVÉNEMENTS ---
    function initializeAppState() {
        changePage('home');
        if (currentUser) logout();
        else {
            registerBtn.classList.remove('hidden');
            userMenuContainer.classList.add('hidden');
        }
    }

    function setupEventListeners() {
        // ... (tous les autres écouteurs d'événements) ...
        
        // Logique du menu utilisateur
        userInfoClickable.addEventListener('click', () => {
            userDropdown.classList.toggle('hidden');
        });

        window.addEventListener('click', (e) => {
            if (!userMenuContainer.contains(e.target)) {
                userDropdown.classList.add('hidden');
            }
        });
        
        logoutBtn.addEventListener('click', logout);
        
        // Clic sur le bouton "Voir" un contenu
        classDetailsContent.addEventListener('click', (e) => {
            if (e.target.matches('button[data-content-id]')) {
                const contentId = e.target.getAttribute('data-content-id');
                displayContentForTeacher(contentId);
            }
        });

        // ... (le reste des écouteurs) ...
    }
    
    // Le reste du fichier est identique...
    // Le code pour `fetchAndDisplayClasses`, `loadProgrammesForCycle`,
    // `fetchAndDisplayStudentContent`, `displayContent`, `displayQuiz`, `populateSelect`,
    // `findCompetences`, et le reste de `setupEventListeners`
    // est le même que dans la version précédente.
    // J'ai seulement montré les parties modifiées pour la clarté.
    // Le fichier complet est dans le Canvas.
});


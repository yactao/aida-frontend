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
    const quizResult = document.getElementById('quiz-result');
    const classDetailsTitle = document.getElementById('class-details-title');
    const classResultsContainer = document.getElementById('class-results-container');
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
    const userDropdown = document.querySelector('.user-dropdown');
    const dropdownUserInfo = document.getElementById('dropdown-user-info');
    const logoutBtn = document.getElementById('logout-btn');

    // --- VARIABLES GLOBALES ---
    let currentUser = null;
    let generatedContentData = null;
    let programmesData = null;

    // --- FONCTIONS DE NAVIGATION ET UI ---
    function changePage(targetId) {
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(targetId)?.classList.add('active');
    }

    function applyTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        themeToggleBtn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    }

    // --- GESTION DE L'AUTHENTIFICATION ---
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
        } catch (error) {
            errorEl.textContent = error.message;
        }
    }

    async function setupUIForUser() {
        if (!currentUser) {
            registerBtn.classList.remove('hidden');
            userDropdown.classList.add('hidden');
            return;
        }
        registerBtn.classList.add('hidden');
        userDropdown.classList.remove('hidden');
        dropdownUserInfo.textContent = currentUser.email;

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

    // --- LOGIQUE POUR L'ENSEIGNANT ---
    async function fetchAndDisplayClasses() {
        if (!currentUser) return;
        try {
            const response = await fetch(`${backendUrl}/classes/${currentUser.email}`);
            const classes = await response.json();
            classListContainer.innerHTML = '';
            assignClassSelect.innerHTML = '<option value="">-- Sélectionnez --</option>';
            noClassesMessage.style.display = classes.length === 0 ? 'block' : 'none';
            classes.forEach(cls => {
                const classCard = document.createElement('div');
                classCard.className = 'dashboard-card';
                classCard.innerHTML = `<h4><i class="fa-solid fa-users"></i> ${cls.className}</h4><p>${cls.students.length} élève(s)</p><p>${(cls.quizzes || []).length} contenu(s)</p>`;
                classCard.addEventListener('click', () => showClassDetails(cls.id, cls.className));
                classListContainer.appendChild(classCard);
                assignClassSelect.add(new Option(cls.className, cls.id));
            });
        } catch (error) { console.error("Erreur de récupération des classes:", error); }
    }

    function initializeResourceModal() {
        cycleSelect.value = '';
        levelSelect.innerHTML = '<option value="">-- D\'abord choisir un cycle --</option>';
        levelSelect.disabled = true;
        subjectSelect.innerHTML = '<option value="">-- D\'abord choisir une classe --</option>';
        subjectSelect.disabled = true;
        notionSelect.innerHTML = '<option value="">-- D\'abord choisir une matière --</option>';
        notionSelect.disabled = true;
        resourceFormButton.disabled = true;
        programmesData = null;
        modalFormStep.classList.remove('hidden');
        modalLoadingStep.classList.add('hidden');
        modalResultStep.classList.add('hidden');
    }

    async function loadProgrammesForCycle(cycle) {
        if (!cycle) {
            levelSelect.innerHTML = '<option value="">-- D\'abord choisir un cycle --</option>';
            levelSelect.disabled = true;
            return;
        }
        const fileMap = {
            primaire: 'programmes-primaire.json',
            college: 'programmes-college.json',
            lycee: 'programmes-lycee.json'
        };
        try {
            const response = await fetch(fileMap[cycle]);
            programmesData = await response.json();
            populateSelect(levelSelect, Object.keys(programmesData), "-- Choisir la classe --");
        } catch (e) { console.error("Erreur chargement programmes"); }
    }
    
    // --- LOGIQUE POUR L'ÉLÈVE ---
     async function fetchAndDisplayStudentContent() {
        if (!currentUser) return;
        try {
            const response = await fetch(`${backendUrl}/student/classes/${currentUser.email}`);
            const classes = await response.json();
            studentModuleList.innerHTML = '';
            joinClassPanel.classList.toggle('hidden', classes.length > 0);
            
            let hasContent = false;
            classes.forEach(cls => {
                if (cls.quizzes && cls.quizzes.length > 0) {
                    hasContent = true;
                    cls.quizzes.forEach(content => {
                        const card = document.createElement('div');
                        card.className = 'dashboard-card';
                        card.innerHTML = `<h4>${content.title}</h4><p>Classe: ${cls.className}</p><button class="btn-secondary">Commencer</button>`;
                        card.querySelector('button').addEventListener('click', () => displayContent(content, cls.id));
                        studentModuleList.appendChild(card);
                    });
                }
            });

            if (!hasContent) {
                studentModuleList.innerHTML = '<p>Aucun module n\'est disponible pour le moment.</p>';
            }

        } catch (error) { console.error("Erreur de récupération des modules:", error); }
    }
    
    function displayContent(contentData, classId) {
        contentTitle.textContent = contentData.title;
        contentViewer.innerHTML = '';
        submitQuizBtn.classList.add('hidden');
        
        switch(contentData.type) {
            case 'quiz':
                displayQuiz(contentData);
                break;
            // Autres types de contenu à gérer ici
            default:
                contentViewer.innerHTML = `<p>${contentData.content || "Ce type de contenu n'est pas encore supporté."}</p>`;
        }
        changePage('content-page');
    }
    
    function displayQuiz(quizData) {
        quizData.questions.forEach((q, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'quiz-question';
            const optionsHTML = q.options.map((option, i) => `<label><input type="radio" name="question-${index}" value="${i}"> ${option}</label>`).join('');
            questionElement.innerHTML = `<p><strong>${index + 1}. ${q.question_text}</strong></p><div class="quiz-options">${optionsHTML}</div>`;
            contentViewer.appendChild(questionElement);
        });
        submitQuizBtn.classList.remove('hidden');
    }


    // --- FONCTIONS UTILITAIRES ---
    function populateSelect(selectElement, options, defaultText, isObject = false) {
        selectElement.innerHTML = `<option value="">${defaultText}</option>`;
        options.forEach(option => {
            const value = isObject ? option.key : option;
            const text = isObject ? option.name : option;
            selectElement.add(new Option(text, value));
        });
        selectElement.disabled = false;
    }
    
    function findCompetences(data, path) {
        let current = data;
        for (const key of path) {
            current = current[key];
            if (!current) return [];
        }

        let competences = [];
        function recurse(obj) {
            if (obj.competences) {
                competences = competences.concat(obj.competences);
            }
            if (obj.sous_notions) {
                Object.values(obj.sous_notions).forEach(recurse);
            }
        }
        recurse(current);
        return [...new Set(competences)]; // Retourne des compétences uniques
    }


    // --- GESTION DES ÉVÉNEMENTS ---
    function setupEventListeners() {
        // Navigation & UI
        homeLink.addEventListener('click', (e) => { e.preventDefault(); initializeAppState(); });
        startButton.addEventListener('click', () => changePage('auth-page'));
        themeToggleBtn.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
        showSignupLink.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('login-form-container').classList.add('hidden'); document.getElementById('signup-form-container').classList.remove('hidden'); });
        showLoginLink.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('signup-form-container').classList.add('hidden'); document.getElementById('login-form-container').classList.remove('hidden'); });
        registerBtn.addEventListener('click', () => changePage('auth-page'));
        logoutBtn.addEventListener('click', logout);
        backToTeacherDashboardBtn.addEventListener('click', () => changePage('teacher-dashboard'));

        // Modales
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
            modal.querySelector('.close-modal')?.addEventListener('click', () => modal.classList.add('hidden'));
        });
        
        // Authentification
        loginForm.addEventListener('submit', (e) => { e.preventDefault(); handleAuth('/auth/login', { email: loginForm.elements['login-email'].value, password: loginForm.elements['login-password'].value }); });
        signupForm.addEventListener('submit', (e) => { e.preventDefault(); handleAuth('/auth/signup', { email: signupForm.elements['signup-email'].value, password: signupForm.elements['signup-password'].value, role: signupForm.elements['signup-role'].value }); });

        // Enseignant
        openClassModalBtn.addEventListener('click', () => classModal.classList.remove('hidden'));
        createClassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const className = createClassForm.elements['class-name-input'].value;
            try {
                const response = await fetch(`${backendUrl}/classes/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ className, teacherEmail: currentUser.email }) });
                if (!response.ok) throw new Error((await response.json()).error);
                await fetchAndDisplayClasses();
                classModal.classList.add('hidden');
            } catch (error) { document.getElementById('class-creation-error').textContent = error.message; }
        });

        openResourceModalBtn.addEventListener('click', () => {
            generationModal.classList.remove('hidden');
            initializeResourceModal();
        });

        // Logique des menus déroulants pour la création
        cycleSelect.addEventListener('change', () => loadProgrammesForCycle(cycleSelect.value));
        levelSelect.addEventListener('change', () => {
            const path = [levelSelect.value];
            populateSelect(subjectSelect, Object.keys(programmesData[path[0]]).map(k => ({ key: k, name: programmesData[path[0]][k].nom })), "-- Choisir la matière --", true);
        });
        subjectSelect.addEventListener('change', () => {
            const path = [levelSelect.value, subjectSelect.value, 'sous_notions'];
            populateSelect(notionSelect, Object.keys(programmesData[path[0]][path[1]][path[2]]).map(k => ({ key: k, name: programmesData[path[0]][path[1]][path[2]][k].nom })), "-- Choisir la notion --", true);
        });
        notionSelect.addEventListener('change', () => {
            resourceFormButton.disabled = !notionSelect.value;
        });

        resourceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            modalFormStep.classList.add('hidden');
            modalLoadingStep.classList.remove('hidden');

            const path = [levelSelect.value, subjectSelect.value, 'sous_notions', notionSelect.value];
            const competences = findCompetences(programmesData, path);
            const contentType = contentTypeSelect.value;
            
            try {
                const response = await fetch(`${backendUrl}/generate/content`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ competences, contentType })
                });
                generatedContentData = await response.json();
                if (!response.ok) throw new Error(generatedContentData.error);
                
                generatedContentEditor.value = JSON.stringify(generatedContentData, null, 2);
                modalLoadingStep.classList.add('hidden');
                modalResultStep.classList.remove('hidden');
            } catch (err) {
                alert("Erreur de génération: " + err.message);
                initializeResourceModal();
            }
        });
        
        confirmAssignBtn.addEventListener('click', async () => {
            const classId = assignClassSelect.value;
            if (!classId) return alert("Veuillez sélectionner une classe.");
            try {
                const contentToAssign = JSON.parse(generatedContentEditor.value);
                const response = await fetch(`${backendUrl}/class/assign-content`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contentData: contentToAssign, classId, teacherEmail: currentUser.email })
                });
                if (!response.ok) throw new Error((await response.json()).error);
                alert("Contenu assigné avec succès !");
                generationModal.classList.add('hidden');
                await fetchAndDisplayClasses();
            } catch (error) { alert(`Erreur: ${error.message}`); }
        });
        
        // Élève
        joinClassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const className = joinClassForm.elements['class-code-input'].value;
            try {
                const response = await fetch(`${backendUrl}/class/join`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ className, studentEmail: currentUser.email })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error);
                alert(data.message);
                await fetchAndDisplayStudentContent();
            } catch (error) { document.getElementById('join-class-error').textContent = error.message; }
        });

    }

    function initializeAppState() {
        changePage('home');
        if (currentUser) logout();
    }

    // --- INITIALISATION ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    initializeAppState();
    setupEventListeners();
});


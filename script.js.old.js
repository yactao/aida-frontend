// URL complète du backend Azure
const backendUrl = 'https://aida-backend-bqd0fnd2a3c7dadf.francecentral-01.azurewebsites.net/api';

document.addEventListener('DOMContentLoaded', () => {
    // --- SÉLECTEURS ---
    const pages = document.querySelectorAll('.page');
    const startButton = document.querySelector('#home .btn-main');
    const registerBtn = document.querySelector('.btn-register');
    const homeLink = document.getElementById('home-link');
    const playgroundLink = document.getElementById('playground-link');
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
    const assignClassSelect = document.getElementById('assign-class-select');
    const studentWelcome = document.getElementById('student-welcome');
    const studentTodoList = document.getElementById('student-todo-list');
    const studentCompletedList = document.getElementById('student-completed-list');
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
    const userMenuContainer = document.querySelector('.user-menu-container');
    const userInfoClickable = document.getElementById('user-info-clickable');
    const userDropdown = document.querySelector('.user-dropdown');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutBtn = document.getElementById('logout-btn');
    const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
    const backToClassDetailsBtn = document.getElementById('back-to-class-details');
    const studentResultsTitle = document.getElementById('student-results-title');
    const studentResultsContent = document.getElementById('student-results-content');
    const previewModal = document.getElementById('preview-modal');
    const previewContent = document.getElementById('preview-content');
    const confirmAssignBtn = document.getElementById('confirm-assign-btn');
    const assignClassSelectPreview = document.getElementById('assign-class-select-preview');

    // --- VARIABLES GLOBALES ---
    let currentUser = null;
    let generatedContentData = null; 
    let programmesData = null;
    let currentClassData = null;

    // --- NAVIGATION ET UI ---
    function changePage(targetId) {
        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(targetId);
        if (targetPage) {
            targetPage.classList.add('active');
        } else if (targetId === 'playground') {
            window.location.href = 'playground.html';
        }
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
            const response = await fetch(`${backendUrl}${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
            playgroundLink.classList.add('hidden');
            return;
        }
        registerBtn.classList.add('hidden');
        userMenuContainer.classList.remove('hidden');
        playgroundLink.classList.remove('hidden');
        userEmailDisplay.textContent = currentUser.firstName || currentUser.email.split('@')[0];
        userDropdown.classList.add('hidden');

        if (currentUser.role === 'teacher') {
            teacherWelcome.textContent = `Tableau de bord de ${currentUser.firstName}`;
            await fetchAndDisplayClasses();
            changePage('teacher-dashboard');
        } else {
            studentWelcome.textContent = `Bonjour ${currentUser.firstName} !`;
            await fetchAndDisplayStudentContent();
            changePage('student-dashboard');
        }
    }

    function logout() {
        currentUser = null;
        changePage('home');
        registerBtn.classList.remove('hidden');
        userMenuContainer.classList.add('hidden');
        playgroundLink.classList.add('hidden');
    }
    
    // --- LOGIQUE ENSEIGNANT ---
    async function fetchAndDisplayClasses() {
        if (!currentUser) return;
        try {
            const response = await fetch(`${backendUrl}/classes/${currentUser.email}`);
            const classes = await response.json();
            classListContainer.innerHTML = '';
            assignClassSelect.innerHTML = '<option value="">-- Sélectionnez --</option>';
            assignClassSelectPreview.innerHTML = '<option value="">-- Sélectionnez --</option>';
            noClassesMessage.style.display = classes.length === 0 ? 'block' : 'none';
            classes.forEach(cls => {
                const classCard = document.createElement('div');
                classCard.className = 'dashboard-card';
                classCard.innerHTML = `<h4><i class="fa-solid fa-users"></i> ${cls.className}</h4><p>${(cls.students || []).length} élève(s)</p><p>${(cls.quizzes || []).length} contenu(s)</p>`;
                classCard.addEventListener('click', () => showClassDetails(cls.id));
                classListContainer.appendChild(classCard);
                const option = new Option(cls.className, cls.id);
                assignClassSelect.add(option.cloneNode(true));
                assignClassSelectPreview.add(option);
            });
        } catch (error) { console.error("Erreur de récupération des classes:", error); }
    }
    
    async function showClassDetails(classId) {
        changePage('class-details-page');
        classDetailsContent.innerHTML = '<div class="spinner"></div>';
        try {
            const response = await fetch(`${backendUrl}/class/details/${classId}`);
            currentClassData = await response.json();
            classDetailsTitle.textContent = `Détails de la classe : ${currentClassData.className}`;
            
            const studentsGrid = document.createElement('div');
            studentsGrid.className = 'details-grid';
            
            if (currentClassData.studentsWithResults && currentClassData.studentsWithResults.length > 0) {
                 currentClassData.studentsWithResults.forEach(student => {
                    const card = document.createElement('div');
                    card.className = 'details-card student-card';
                    card.innerHTML = `<div class="card-title"><i class="fa-solid fa-user"></i> ${student.email.split('@')[0]}</div>
                                      <div class="card-info">${student.results.length} test(s) complété(s)</div>
                                      <button class="btn-secondary" data-student-email="${student.email}">Voir les résultats</button>`;
                    studentsGrid.appendChild(card);
                });
            } else {
                studentsGrid.innerHTML = '<p>Aucun élève dans cette classe pour le moment.</p>';
            }
            classDetailsContent.innerHTML = '';
            classDetailsContent.appendChild(studentsGrid);
        } catch (error) {
            classDetailsContent.innerHTML = "<p>Erreur lors du chargement des détails.</p>";
        }
    }
    
    function showStudentResults(studentEmail) {
        const studentData = currentClassData.studentsWithResults.find(s => s.email === studentEmail);
        if (!studentData) return;

        changePage('student-results-page');
        studentResultsTitle.textContent = `Résultats de ${studentEmail.split('@')[0]}`;
        studentResultsContent.innerHTML = '';

        if (studentData.results.length === 0) {
            studentResultsContent.innerHTML = "<p>Cet élève n'a complété aucun test.</p>";
            return;
        }
        
        const grid = document.createElement('div');
        grid.className = 'details-grid';
        studentData.results.forEach(result => {
             const card = document.createElement('div');
            card.className = 'details-card result-card';
            const scorePercentage = (result.score / result.totalQuestions) * 100;
            card.innerHTML = `<div class="card-title">${result.quizTitle}</div>
                              <div class="score-display">
                                <span class="score">${result.score}/${result.totalQuestions}</span>
                                <div class="score-bar"><div class="score-fill" style="width: ${scorePercentage}%;"></div></div>
                              </div>`;
            grid.appendChild(card);
        });
        studentResultsContent.appendChild(grid);
    }
    
    // --- LOGIQUE ÉLÈVE ---
    async function fetchAndDisplayStudentContent() {
        if (!currentUser) return;
        try {
            const response = await fetch(`${backendUrl}/student/classes/${currentUser.email}`);
            const data = await response.json();
            studentTodoList.innerHTML = '';
            studentCompletedList.innerHTML = '';

            (data.todo || []).forEach(content => createStudentCard(content, studentTodoList));
            if (studentTodoList.innerHTML === '') studentTodoList.innerHTML = '<p>Bravo, tu as tout terminé !</p>';

            (data.completed || []).forEach(content => createStudentCard(content, studentCompletedList));
            if (studentCompletedList.innerHTML === '') studentCompletedList.innerHTML = '<p>Aucun exercice terminé pour le moment.</p>';
        } catch (error) { console.error("Erreur de récupération des modules:", error); }
    }

    function createStudentCard(content, container) {
        const card = document.createElement('div');
        card.className = 'dashboard-card-student';
        const isCompleted = content.status === 'completed';
        const dateToShow = isCompleted ? content.completedAt : content.assignedAt;
        const formattedDate = new Date(dateToShow).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const dateLabel = isCompleted ? 'Terminé le' : 'Reçu le';

        card.innerHTML = `
            <div class="card-header">
                <span class="subject-tag tag-maths">${content.type.charAt(0).toUpperCase() + content.type.slice(1)}</span>
                ${content.isNewest && !isCompleted ? '<span class="new-tag">Nouveau</span>' : ''}
            </div>
            <div class="card-content"><h4>${content.title}</h4><p>Classe: ${content.className}</p></div>
            <div class="card-footer">
                <span class="card-date">${dateLabel} ${formattedDate}</span>
                <button class="btn-secondary ${isCompleted ? 'btn-termine' : ''}" ${isCompleted ? 'disabled' : ''}>
                    ${isCompleted ? 'Terminé' : 'Commencer'}
                </button>
            </div>`;
        if (!isCompleted) card.querySelector('button').addEventListener('click', () => displayContent(content, content.classId));
        container.appendChild(card);
    }
    
    function displayContent(contentData, classId) {
        contentTitle.textContent = contentData.title;
        contentViewer.innerHTML = '';
        submitQuizBtn.classList.add('hidden');
        
        switch(contentData.type) {
            case 'quiz': displayQuiz(contentData, classId); break;
            case 'revision':
            case 'exercices':
                contentViewer.innerHTML = `<div class="revision-content">${(contentData.content || "").replace(/\n/g, '<br>')}</div>`;
                break;
            default: contentViewer.innerHTML = `<p>Ce type de contenu n'est pas supporté.</p>`;
        }
        changePage('content-page');
    }
    
    function displayQuiz(quizData, classId) {
        quizData.questions.forEach((q, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'quiz-question';
            const optionsHTML = q.options.map((option, i) => `<label><input type="radio" name="question-${index}" value="${i}"> ${option}</label>`).join('');
            questionElement.innerHTML = `<p><strong>${index + 1}. ${q.question_text}</strong></p><div class="quiz-options">${optionsHTML}</div>`;
            contentViewer.appendChild(questionElement);
        });
        submitQuizBtn.classList.remove('hidden');
        submitQuizBtn.onclick = () => submitQuiz(quizData, classId);
    }

    async function submitQuiz(quizData, classId) {
        const userAnswers = quizData.questions.map((_, index) => {
            const selectedInput = document.querySelector(`input[name="question-${index}"]:checked`);
            return selectedInput ? parseInt(selectedInput.value) : -1;
        });
        
        let score = userAnswers.reduce((acc, ans, idx) => acc + (ans == quizData.questions[idx].correct_answer_index ? 1 : 0), 0);
        
        try {
            await fetch(`${backendUrl}/quiz/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    classId, quizId: quizData.id, studentEmail: currentUser.email,
                    score, totalQuestions: quizData.questions.length, quizTitle: quizData.title, answers: userAnswers
                })
            });
            await fetchAndDisplayStudentContent();
            changePage('student-dashboard');
        } catch (error) { console.error("Erreur lors de l'envoi du score:", error); }
    }

    // --- Génération de contenu ---
    async function loadProgrammesForCycle(cycle) {
        if (!cycle) {
            levelSelect.innerHTML = '<option value="">-- D\'abord choisir un cycle --</option>';
            levelSelect.disabled = true;
            return;
        }
        const fileMap = { primaire: 'programmes-primaire.json', college: 'programmes-college.json', lycee: 'programmes-lycee.json' };
        try {
            const response = await fetch(fileMap[cycle]); // Utilise le chemin relatif car servi par le même serveur
            programmesData = await response.json();
            populateSelect(levelSelect, Object.keys(programmesData), "-- Choisir la classe --");
        } catch (e) { alert("Impossible de charger les programmes pour ce cycle."); }
    }
    
    function populateSelect(select, options, defaultText, isObject = false) {
        select.innerHTML = `<option value="">${defaultText}</option>`;
        options.forEach(opt => select.add(new Option(isObject ? opt.name : opt, isObject ? opt.key : opt)));
        select.disabled = false;
    }
    
    // --- GESTION DES ÉVÉNEMENTS ---
    function setupEventListeners() {
        homeLink.addEventListener('click', (e) => { e.preventDefault(); changePage('home'); });
        playgroundLink.addEventListener('click', (e) => { e.preventDefault(); changePage('playground'); });
        startButton.addEventListener('click', (e) => { e.preventDefault(); changePage(startButton.getAttribute('data-target')); });
        registerBtn.addEventListener('click', (e) => { e.preventDefault(); changePage('auth-page'); });
        backToDashboardBtn.addEventListener('click', () => currentUser.role === 'teacher' ? changePage('teacher-dashboard') : changePage('student-dashboard'));
        themeToggleBtn.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
        showSignupLink.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('login-form-container').classList.add('hidden'); document.getElementById('signup-form-container').classList.remove('hidden'); });
        showLoginLink.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('signup-form-container').classList.add('hidden'); document.getElementById('login-form-container').classList.remove('hidden'); });
        userInfoClickable.addEventListener('click', () => userDropdown.classList.toggle('hidden'));
        window.addEventListener('click', (e) => !userMenuContainer.contains(e.target) && userDropdown.classList.add('hidden'));
        logoutBtn.addEventListener('click', logout);
        backToTeacherDashboardBtn.addEventListener('click', () => changePage('teacher-dashboard'));
        backToClassDetailsBtn.addEventListener('click', () => showClassDetails(currentClassData.id));

        document.querySelectorAll('.modal-overlay .close-modal').forEach(btn => btn.addEventListener('click', () => btn.closest('.modal-overlay').classList.add('hidden')));
        
        loginForm.addEventListener('submit', (e) => { e.preventDefault(); handleAuth('/auth/login', { email: loginForm.elements['login-email'].value, password: loginForm.elements['login-password'].value }); });
        signupForm.addEventListener('submit', (e) => { e.preventDefault(); handleAuth('/auth/signup', { email: signupForm.elements['signup-email'].value, password: signupForm.elements['signup-password'].value, role: signupForm.elements['signup-role'].value }); });

        openClassModalBtn.addEventListener('click', () => classModal.classList.remove('hidden'));
        createClassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const className = createClassForm.elements['class-name-input'].value;
            try {
                await fetch(`${backendUrl}/classes/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ className, teacherEmail: currentUser.email }) });
                await fetchAndDisplayClasses();
                classModal.classList.add('hidden');
            } catch (error) { document.getElementById('class-creation-error').textContent = error.message; }
        });

        openResourceModalBtn.addEventListener('click', () => {
            generationModal.classList.remove('hidden');
            loadProgrammesForCycle('primaire'); // Pré-charge pour l'exemple
        });
        
        cycleSelect.addEventListener('change', () => loadProgrammesForCycle(cycleSelect.value));
        levelSelect.addEventListener('change', () => {
            const level = levelSelect.value;
            const subjects = Object.keys(programmesData[level]).map(k => ({ key: k, name: programmesData[level][k].nom }));
            populateSelect(subjectSelect, subjects, "-- Choisir la matière --", true);
        });
        subjectSelect.addEventListener('change', () => {
            const data = programmesData[levelSelect.value][subjectSelect.value];
            const notions = Object.keys(data).filter(k => k !== 'nom').flatMap(mainKey => 
                Object.keys(data[mainKey].sous_notions).map(subKey => ({
                    key: `${mainKey},${subKey}`,
                    name: data[mainKey].sous_notions[subKey].nom
                }))
            );
            populateSelect(notionSelect, notions, "-- Choisir la notion --", true);
        });

        resourceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const competences = programmesData[levelSelect.value][subjectSelect.value][notionSelect.value.split(',')[0]].sous_notions[notionSelect.value.split(',')[1]].competences;
            const contentType = document.getElementById('content-type-select').value;
            
            try {
                const response = await fetch(`${backendUrl}/generate/content`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ competences, contentType }) });
                const data = await response.json();
                generatedContentData = data.structured_content;
                previewContent.innerHTML = `<h4>${generatedContentData.title}</h4><hr>` + 
                    (generatedContentData.questions || []).map(q => `<p>${q.question_text}</p>`).join('') +
                    (generatedContentData.content || "").replace(/\n/g, '<br>');

                generationModal.classList.add('hidden');
                previewModal.classList.remove('hidden');
            } catch (err) { alert("Erreur de génération: " + err.message); }
        });
        
        confirmAssignBtn.addEventListener('click', async () => {
            const classId = assignClassSelectPreview.value;
            if (!classId) return alert("Veuillez sélectionner une classe.");
            try {
                await fetch(`${backendUrl}/class/assign-content`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contentData: generatedContentData, classId }) });
                alert("Contenu assigné avec succès !");
                previewModal.classList.add('hidden');
                await fetchAndDisplayClasses();
            } catch (error) { alert(`Erreur: ${error.message}`); }
        });

        classDetailsContent.addEventListener('click', e => {
            const btn = e.target.closest('button[data-student-email]');
            if (btn) showStudentResults(btn.dataset.studentEmail);
        });
    }

    // --- INITIALISATION ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    changePage('home');
    setupEventListeners();
});


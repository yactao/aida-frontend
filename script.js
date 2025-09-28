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
    const userMenuContainer = document.querySelector('.user-menu-container');
    const userInfoClickable = document.getElementById('user-info-clickable');
    const userDropdown = document.querySelector('.user-dropdown');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutBtn = document.getElementById('logout-btn');
    const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');


    // --- VARIABLES GLOBALES ---
    let currentUser = null;
    let generatedContentData = null; // Stockera le JSON structuré
    let programmesData = null;
    let currentClassData = null; // Stockera les données de la classe consultée

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
                const resultsList = document.createElement('ul');
                resultsList.className = 'results-list';
                currentClassData.results.forEach(result => {
                    const li = document.createElement('li');
                    li.innerHTML = `${result.studentEmail.split('@')[0]} - ${result.quizTitle}: ${result.score}/${result.totalQuestions} <button data-result-id="${result.resultId}">Voir détails</button>`;
                    resultsList.appendChild(li);
                });
                resultsSection.appendChild(resultsList);
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
        alert(`Prévisualisation de : ${content.title}\n\n` + JSON.stringify(content, null, 2));
    }

    function displayStudentResultDetails(resultId) {
        const result = currentClassData.results.find(r => r.resultId === resultId);
        const content = currentClassData.quizzes.find(q => q.id === result.quizId);
        if (!result || !content) return;

        const modal = document.getElementById('result-details-modal');
        const modalTitle = document.getElementById('result-modal-title');
        const modalContent = document.getElementById('result-modal-content');

        modalTitle.textContent = `Réponses de ${result.studentEmail.split('@')[0]}`;
        let contentHTML = '';
        content.questions.forEach((q, index) => {
            const studentAnswerIndex = result.answers[index];
            const isCorrect = studentAnswerIndex == q.correct_answer_index;
            contentHTML += `<h4>Question ${index + 1}: ${q.question_text}</h4>`;
            q.options.forEach((opt, optIndex) => {
                let className = '';
                if (optIndex == studentAnswerIndex) {
                    className = isCorrect ? 'correct' : 'incorrect';
                } else if (optIndex == q.correct_answer_index) {
                    className = 'correct';
                }
                contentHTML += `<div class="answer ${className}">${opt}</div>`;
            });
        });
        modalContent.innerHTML = contentHTML;
        modal.classList.remove('hidden');
    }

    // --- LOGIQUE ÉLÈVE ---
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
        quizResult.classList.add('hidden');
        
        switch(contentData.type) {
            case 'quiz':
                displayQuiz(contentData, classId);
                break;
            default:
                contentViewer.innerHTML = `<p>${contentData.content || "Ce type de contenu n'est pas encore supporté."}</p>`;
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
        submitQuizBtn.onclick = () => submitQuiz(quizData, classId); // Attacher l'événement
    }

    async function submitQuiz(quizData, classId) {
        let score = 0;
        const userAnswers = [];
        quizData.questions.forEach((q, index) => {
            const selectedInput = document.querySelector(`input[name="question-${index}"]:checked`);
            const answerIndex = selectedInput ? parseInt(selectedInput.value) : -1;
            userAnswers.push(answerIndex);
            if (answerIndex == q.correct_answer_index) {
                score++;
            }
        });

        // Envoyer les résultats au backend
        try {
            await fetch(`${backendUrl}/quiz/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    classId,
                    quizId: quizData.id,
                    studentEmail: currentUser.email,
                    score,
                    totalQuestions: quizData.questions.length,
                    quizTitle: quizData.title,
                    answers: userAnswers
                })
            });
        } catch (error) {
            console.error("Erreur lors de l'envoi du score:", error);
        }

        // Afficher la correction
        quizResult.textContent = `Votre score : ${score} / ${quizData.questions.length}`;
        quizResult.classList.remove('hidden');
        submitQuizBtn.classList.add('hidden');
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
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else { return []; }
        }
        if (current && Array.isArray(current.competences)) {
            return current.competences;
        }
        return [];
    }
    
    function initializeResourceModal() {
        cycleSelect.value = '';
        levelSelect.innerHTML = '<option value="">-- D\'abord choisir un cycle --</option>';
        levelSelect.disabled = true;
        subjectSelect.innerHTML = '<option value="">-- D\'abord choisir une classe --</option>';
        subjectSelect.disabled = true;
        notionSelect.innerHTML = '<option value="">-- D\'abord choisir une matière --</option>';
        notionSelect.disabled = true;
        if(resourceFormButton) resourceFormButton.disabled = true;
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
            primaire: 'Programmes Scolaires - Primaire.json',
            college: 'Programmes Scolaires - Collège.json',
            lycee: 'Programmes Scolaires - Lycée.json'
        };
        try {
            const response = await fetch(fileMap[cycle]);
            programmesData = await response.json();
            populateSelect(levelSelect, Object.keys(programmesData), "-- Choisir la classe --");
        } catch (e) { console.error("Erreur chargement programmes"); }
    }

    function setupEventListeners() {
        homeLink.addEventListener('click', (e) => { e.preventDefault(); initializeAppState(); });
        startButton.addEventListener('click', (e) => { e.preventDefault(); changePage(startButton.getAttribute('data-target')); });
        registerBtn.addEventListener('click', (e) => { e.preventDefault(); changePage('auth-page'); });
        backToDashboardBtn.addEventListener('click', () => {
            if(currentUser.role === 'teacher') changePage('teacher-dashboard');
            else changePage('student-dashboard');
        });

        themeToggleBtn.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
        showSignupLink.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('login-form-container').classList.add('hidden'); document.getElementById('signup-form-container').classList.remove('hidden'); });
        showLoginLink.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('signup-form-container').classList.add('hidden'); document.getElementById('login-form-container').classList.remove('hidden'); });
        
        userInfoClickable.addEventListener('click', () => {
            userDropdown.classList.toggle('hidden');
        });
        window.addEventListener('click', (e) => {
            if (!userMenuContainer.contains(e.target)) {
                userDropdown.classList.add('hidden');
            }
        });
        logoutBtn.addEventListener('click', logout);
        
        backToTeacherDashboardBtn.addEventListener('click', () => changePage('teacher-dashboard'));

        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
            modal.querySelector('.close-modal')?.addEventListener('click', () => modal.classList.add('hidden'));
        });
        
        loginForm.addEventListener('submit', (e) => { e.preventDefault(); handleAuth('/auth/login', { email: loginForm.elements['login-email'].value, password: loginForm.elements['login-password'].value }); });
        signupForm.addEventListener('submit', (e) => { e.preventDefault(); handleAuth('/auth/signup', { email: signupForm.elements['signup-email'].value, password: signupForm.elements['signup-password'].value, role: signupForm.elements['signup-role'].value }); });

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

        cycleSelect.addEventListener('change', () => loadProgrammesForCycle(cycleSelect.value));
        
        levelSelect.addEventListener('change', () => {
            notionSelect.innerHTML = '<option value="">-- D\'abord choisir une matière --</option>';
            notionSelect.disabled = true;
            const level = levelSelect.value;
            if (level && programmesData[level]) {
                const subjects = Object.keys(programmesData[level]).map(key => ({ key: key, name: programmesData[level][key].nom }));
                populateSelect(subjectSelect, subjects, "-- Choisir la matière --", true);
            }
        });
        
        subjectSelect.addEventListener('change', () => {
            const selectedLevel = levelSelect.value;
            const selectedSubject = subjectSelect.value;
            if (selectedLevel && selectedSubject && programmesData[selectedLevel]?.[selectedSubject]) {
                const subjectData = programmesData[selectedLevel][selectedSubject];
                let allNotions = [];
                Object.keys(subjectData).forEach(mainNotionKey => {
                    if (mainNotionKey === 'nom') return;
                    const mainNotion = subjectData[mainNotionKey];
                    if (mainNotion && mainNotion.sous_notions) {
                        Object.keys(mainNotion.sous_notions).forEach(subNotionKey => {
                            const subNotion = mainNotion.sous_notions[subNotionKey];
                            if (subNotion && subNotion.nom) {
                                allNotions.push({ key: `${mainNotionKey},${subNotionKey}`, name: subNotion.nom });
                            }
                        });
                    }
                });
                populateSelect(notionSelect, allNotions, "-- Choisir la notion --", true);
            }
        });

        notionSelect.addEventListener('change', () => {
            if(resourceFormButton) resourceFormButton.disabled = !notionSelect.value;
        });

        resourceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            modalFormStep.classList.add('hidden');
            modalLoadingStep.classList.remove('hidden');

            const [mainNotionKey, subNotionKey] = notionSelect.value.split(',');
            const path = [levelSelect.value, subjectSelect.value, mainNotionKey, 'sous_notions', subNotionKey];
            const competences = findCompetences(programmesData, path);
            const contentType = contentTypeSelect.value;

            if (competences.length === 0) {
                 alert("Aucune compétence trouvée pour cette notion.");
                 initializeResourceModal();
                 return;
            }
            
            try {
                const response = await fetch(`${backendUrl}/generate/content`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ competences, contentType })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error);
                
                generatedContentEditor.value = data.text_representation;
                generatedContentData = data.structured_content; // Garder le JSON en mémoire
                
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
            const modifiedText = generatedContentEditor.value;

            try {
                const conversionResponse = await fetch(`${backendUrl}/convert/text-to-json`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: modifiedText, contentType: generatedContentData.type })
                });
                const finalContent = await conversionResponse.json();

                const assignResponse = await fetch(`${backendUrl}/class/assign-content`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contentData: finalContent, classId, teacherEmail: currentUser.email })
                });
                if (!assignResponse.ok) throw new Error((await assignResponse.json()).error);
                alert("Contenu assigné avec succès !");
                generationModal.classList.add('hidden');
                await fetchAndDisplayClasses();
            } catch (error) { alert(`Erreur: ${error.message}`); }
        });
        
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

        classDetailsContent.addEventListener('click', (e) => {
            if (e.target.matches('button[data-result-id]')) {
                displayStudentResultDetails(e.target.getAttribute('data-result-id'));
            } else if (e.target.matches('button[data-content-id]')) {
                displayContentForTeacher(e.target.getAttribute('data-content-id'));
            }
        });
    }

    // --- INITIALISATION ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    initializeAppState();
    setupEventListeners();
});


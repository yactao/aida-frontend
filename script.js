// On utilise l'URL complète du backend Azure. C'est la connexion directe.
const backendUrl = 'https://aida-backend-bqd0fnd2a3c7dadf.francecentral-01.azurewebsites.net/api';

document.addEventListener('DOMContentLoaded', () => {
    // --- SÉLECTEURS ---
    const pages = document.querySelectorAll('.page');
    const startButton = document.querySelector('#home .btn-main');
    const registerBtn = document.querySelector('.btn-register');
    const homeLink = document.getElementById('home-link');
    const loginFormContainer = document.getElementById('login-form-container');
    const signupFormContainer = document.getElementById('signup-form-container');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');
    const teacherWelcome = document.getElementById('teacher-welcome');
    const openClassModalBtn = document.getElementById('open-class-modal-btn');
    const classModal = document.getElementById('create-class-modal');
    const createClassForm = document.getElementById('create-class-form');
    const classCreationError = document.getElementById('class-creation-error');
    const classListContainer = document.getElementById('class-list');
    const noClassesMessage = document.getElementById('no-classes-message');
    const openQuizModalBtn = document.querySelector('.new-resource-btn');
    const quizModal = document.getElementById('generation-modal');
    const resourceForm = document.getElementById('resource-form');
    const modalFormStep = document.getElementById('modal-form-step');
    const modalLoadingStep = document.getElementById('modal-loading-step');
    const modalResultStep = document.getElementById('modal-result-step');
    const assignClassSelect = document.getElementById('assign-class-select');
    const useQuizBtn = quizModal ? quizModal.querySelector('.use-resource-btn') : null;
    const studentWelcome = document.getElementById('student-welcome');
    const joinClassPanel = document.getElementById('join-class-panel');
    const joinClassForm = document.getElementById('join-class-form');
    const joinClassError = document.getElementById('join-class-error');
    const studentModuleList = document.getElementById('student-module-list');
    const quizTitle = document.getElementById('quiz-title');
    const quizQuestionsContainer = document.getElementById('quiz-questions-container');
    const submitQuizBtn = document.getElementById('submit-quiz-btn');
    const quizResult = document.getElementById('quiz-result');
    const aidaHelpModal = document.getElementById('aida-help-modal');
    const aidaHelpLoading = document.getElementById('aida-help-loading');
    const aidaHelpResult = document.getElementById('aida-help-result');
    const aidaHintText = document.getElementById('aida-hint-text');
    const classDetailsTitle = document.getElementById('class-details-title');
    const classResultsContainer = document.getElementById('class-results-container');
    const backToTeacherDashboardBtn = document.getElementById('back-to-teacher-dashboard');
    const quizContainer = document.querySelector('.quiz-container');
    const cycleSelect = document.getElementById('cycle-select');
    const levelSelect = document.getElementById('level-select');
    const subjectSelect = document.getElementById('subject-select');
    const notionSelect = document.getElementById('notion-select');
    const resourceFormButton = document.querySelector('#resource-form button');
    // NOUVEAUX SÉLECTEURS POUR LE MENU UTILISATEUR
    const userMenu = document.getElementById('user-menu');
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutBtn = document.getElementById('logout-btn');
    const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');


    // --- VARIABLES GLOBALES ---
    let currentUser = null;
    let generatedQuizData = null;
    let currentQuizData = null;
    let currentClassId = null;
    let programmesData = null;
    let currentClassDataForTeacher = null;

    const goToAuthPage = (e) => { e.preventDefault(); changePage('auth-page'); };

    function applyTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        if (themeToggleCheckbox) {
            themeToggleCheckbox.checked = (theme === 'dark');
        }
    }

    function changePage(targetId) {
        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(targetId);
        if (targetPage) targetPage.classList.add('active');
    }

    async function handleAuth(url, body) {
        const errorEl = body.role ? signupError : loginError;
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
    
    // MISE À JOUR pour gérer le nouveau menu utilisateur
    async function setupUIForUser() {
        if (!currentUser) return;

        registerBtn.classList.add('hidden');
        userMenu.classList.remove('hidden');
        userEmailDisplay.textContent = currentUser.email;

        if (currentUser.role === 'student') {
            if (studentWelcome) studentWelcome.textContent = `Bonjour ${currentUser.email.split('@')[0]} !`;
            await fetchAndDisplayStudentClasses();
            changePage('student-dashboard');
        } else {
            if (teacherWelcome) teacherWelcome.textContent = `Tableau de bord de ${currentUser.email.split('@')[0]}`;
            await fetchAndDisplayClasses();
            changePage('teacher-dashboard');
        }
    }

    // MISE À JOUR pour gérer le nouveau menu utilisateur
    function logout() {
        currentUser = null;
        registerBtn.classList.remove('hidden');
        userMenu.classList.add('hidden');
        userMenuDropdown.classList.add('hidden');
        initializeAppState();
    }
    
    async function fetchAndDisplayClasses() {
        if (!currentUser || !classListContainer) return;
        try {
            const response = await fetch(`${backendUrl}/classes/${currentUser.email}`);
            const classes = await response.json();
            classListContainer.innerHTML = '';
            if (assignClassSelect) assignClassSelect.innerHTML = '<option value="">-- Sélectionnez une classe --</option>';
            if (noClassesMessage) noClassesMessage.style.display = classes.length === 0 ? 'block' : 'none';
            classes.forEach(cls => {
                const classCard = document.createElement('div');
                classCard.className = 'dashboard-card clickable';
                classCard.innerHTML = `<h4><i class="fa-solid fa-users"></i> ${cls.className}</h4><p>${cls.students.length} élève(s)</p><p>${cls.quizzes.length} quiz</p>`;
                classCard.addEventListener('click', () => showClassDetails(cls.id, cls.className));
                classListContainer.appendChild(classCard);
                if (assignClassSelect) {
                    const option = new Option(cls.className, cls.id);
                    assignClassSelect.appendChild(option);
                }
            });
        } catch (error) { console.error("Erreur de récupération des classes:", error); }
    }

    async function showClassDetails(classId, className) {
        changePage('class-details-page');
        if (classDetailsTitle) classDetailsTitle.textContent = `Résultats de la classe : ${className}`;
        if (classResultsContainer) {
            classResultsContainer.innerHTML = '<div class="spinner"></div>';
            classResultsContainer.classList.remove('quiz-feedback');
        }
        try {
            const response = await fetch(`${backendUrl}/class/details/${classId}`);
            currentClassDataForTeacher = await response.json();
            
            if (!currentClassDataForTeacher.results || currentClassDataForTeacher.results.length === 0) {
                if (classResultsContainer) classResultsContainer.innerHTML = '<p>Aucun quiz n\'a été complété pour cette classe.</p>';
                return;
            }

            const resultsByQuiz = currentClassDataForTeacher.results.reduce((acc, result) => {
                if (!acc[result.quizId]) acc[result.quizId] = { title: result.quizTitle, results: [] };
                acc[result.quizId].results.push(result);
                return acc;
            }, {});

            if (classResultsContainer) classResultsContainer.innerHTML = '';
            for (const quizId in resultsByQuiz) {
                const quiz = resultsByQuiz[quizId];
                let resultsHTML = '<ul>';
                quiz.results.forEach(r => {
                    resultsHTML += `<li><button class="result-link" data-result-id="${r.resultId}"><strong>${r.studentEmail.split('@')[0]}</strong> a obtenu ${r.score}/${r.totalQuestions}</button></li>`;
                });
                resultsHTML += '</ul>';
                const quizResultCard = document.createElement('div');
                quizResultCard.className = 'quiz-result-card';
                quizResultCard.innerHTML = `<h3>${quiz.title}</h3>${resultsHTML}`;
                if (classResultsContainer) classResultsContainer.appendChild(quizResultCard);
            }
            
            document.querySelectorAll('.result-link').forEach(button => {
                button.addEventListener('click', (e) => {
                    const resultId = e.currentTarget.getAttribute('data-result-id');
                    displayDetailedResult(resultId, classId, className);
                });
            });
        } catch (error) {
            if (classResultsContainer) classResultsContainer.innerHTML = '<p>Une erreur est survenue.</p>';
        }
    }

    function displayDetailedResult(resultId, classId, className) {
        const result = currentClassDataForTeacher.results.find(r => r.resultId === resultId);
        const quiz = currentClassDataForTeacher.quizzes.find(q => q.id === result.quizId);

        if (!result || !quiz) { alert("Impossible de trouver les détails."); return; }

        if (classDetailsTitle) classDetailsTitle.textContent = `Rapport d'erreurs pour ${result.studentEmail.split('@')[0]} (${quiz.title})`;
        if (classResultsContainer) {
            classResultsContainer.innerHTML = '';
            classResultsContainer.classList.add('quiz-feedback');
        }

        const backButton = document.createElement('button');
        backButton.className = 'btn-secondary btn-small';
        backButton.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Retour à la synthèse de la classe`;
        backButton.addEventListener('click', () => showClassDetails(classId, className));
        if (classResultsContainer) classResultsContainer.appendChild(backButton);

        let errorCount = 0;
        quiz.questions.forEach((q, index) => {
            const userAnswerIndex = result.answers[index];
            const isCorrect = userAnswerIndex === q.correct_answer_index;

            if (!isCorrect) {
                errorCount++;
                const questionElement = document.createElement('div');
                questionElement.className = 'quiz-question';
                
                const optionsHTML = q.options.map((option, i) => {
                    let className = '';
                    if (i === q.correct_answer_index) className = 'correct-answer';
                    else if (i === userAnswerIndex) className = 'wrong-answer';
                    return `<label class="${className}">${option}</label>`;
                }).join('');

                questionElement.innerHTML = `<p><strong>Question ${index + 1}: ${q.question_text}</strong></p><div class="quiz-options">${optionsHTML}</div>`;
                if (classResultsContainer) classResultsContainer.appendChild(questionElement);
            }
        });

        if (errorCount === 0) {
            const noErrorsMessage = document.createElement('p');
            noErrorsMessage.style.marginTop = '1rem';
            noErrorsMessage.innerHTML = `<strong>Félicitations !</strong> Cet élève n'a fait aucune erreur sur ce quiz.`;
            if (classResultsContainer) classResultsContainer.appendChild(noErrorsMessage);
        }
    }
    
    async function fetchAndDisplayStudentClasses() {
        if (!currentUser || !studentModuleList) return;
        try {
            const response = await fetch(`${backendUrl}/student/classes/${currentUser.email}`);
            const classes = await response.json();
            studentModuleList.innerHTML = '';
            if (joinClassPanel) joinClassPanel.classList.toggle('hidden', classes.length > 0);
            if (classes.length === 0) {
                studentModuleList.innerHTML = '<div class="module-card"><h4>En attente de votre première classe</h4><p>Rejoignez une classe pour voir les modules.</p></div>';
                return;
            }
            
            let hasPendingQuizzes = false;
            classes.forEach(cls => {
                if (cls.quizzes && cls.quizzes.length > 0) {
                    const completedQuizIds = (cls.results || [])
                        .filter(result => result.studentEmail === currentUser.email)
                        .map(result => result.quizId);

                    const pendingQuizzes = cls.quizzes.filter(quiz => !completedQuizIds.includes(quiz.id));

                    if (pendingQuizzes.length > 0) {
                        hasPendingQuizzes = true;
                        pendingQuizzes.forEach(quiz => {
                            const quizCard = document.createElement('div');
                            quizCard.className = 'module-card';
                            quizCard.innerHTML = `<h4>${quiz.title}</h4><p>De la classe : ${cls.className}</p><button class="btn-secondary">Commencer le quiz</button>`;
                            quizCard.querySelector('button').addEventListener('click', () => startQuiz(quiz, cls.id));
                            studentModuleList.appendChild(quizCard);
                        });
                    }
                }
            });

            if (!hasPendingQuizzes) {
                studentModuleList.innerHTML = '<div class="module-card"><h4>Bravo !</h4><p>Tu as terminé tous les quiz pour le moment. Reviens plus tard !</p></div>';
            }
        } catch (error) {
            console.error("Impossible de charger les modules de l'élève:", error);
        }
    }

    async function getAidaHelp(questionText) {
        if (!aidaHelpModal) return;
        aidaHelpModal.classList.remove('hidden');
        if (aidaHelpLoading) aidaHelpLoading.classList.remove('hidden');
        if (aidaHelpResult) aidaHelpResult.classList.add('hidden');
        try {
            const response = await fetch(`${backendUrl}/aida/help`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: questionText })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            if (aidaHintText) aidaHintText.textContent = data.hint;
        } catch (error) {
            if (aidaHintText) aidaHintText.textContent = "Désolée, je n'ai pas trouvé d'indice pour le moment.";
        } finally {
            if (aidaHelpLoading) aidaHelpLoading.classList.add('hidden');
            if (aidaHelpResult) aidaHelpResult.classList.remove('hidden');
        }
    }
    
    function startQuiz(quizData, classId) {
        currentQuizData = quizData;
        currentClassId = classId;

        if (!quizData || !Array.isArray(quizData.questions)) {
            alert("Désolé, ce quiz ne peut pas être chargé car ses questions sont manquantes.");
            return;
        }

        if (quizContainer) quizContainer.classList.remove('quiz-feedback');
        if (quizTitle) quizTitle.textContent = quizData.title;
        if (quizQuestionsContainer) quizQuestionsContainer.innerHTML = '';
        if (quizResult) quizResult.classList.add('hidden');
        if (submitQuizBtn) submitQuizBtn.classList.remove('hidden');
        
        quizData.questions.forEach((q, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'quiz-question';
            const optionsHTML = q.options.map((option, i) => `<label><input type="radio" name="question-${index}" value="${i}"> ${option}</label>`).join('');
            questionElement.innerHTML = `<p><strong>${index + 1}. ${q.question_text}</strong><button class="aida-help-btn" title="Demander un indice à AIDA"><i class="fa-solid fa-lightbulb"></i></button></p><div class="quiz-options">${optionsHTML}</div>`;
            const helpBtn = questionElement.querySelector('.aida-help-btn');
            if (helpBtn) helpBtn.addEventListener('click', () => getAidaHelp(q.question_text));
            if (quizQuestionsContainer) quizQuestionsContainer.appendChild(questionElement);
        });
        changePage('quiz-page');
    }
    
    function initializeAppState() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
        changePage('home');
    }
    
    function initializeResourceModal() {
        cycleSelect.value = '';
        levelSelect.innerHTML = '<option value="">-- D\'abord choisir un cycle --</option>';
        levelSelect.disabled = true;
        subjectSelect.innerHTML = '<option value="">-- D\'abord choisir un niveau --</option>';
        subjectSelect.disabled = true;
        notionSelect.innerHTML = '<option value="">-- D\'abord choisir une matière --</option>';
        notionSelect.disabled = true;
        resourceFormButton.disabled = true;
        programmesData = null;
    }

    // CORRECTION du bug de chargement
    async function loadProgrammesForCycle(cycle) {
        levelSelect.innerHTML = '<option value="">Chargement...</option>';
        subjectSelect.innerHTML = '<option value="">-- D\'abord choisir un niveau --</option>';
        notionSelect.innerHTML = '<option value="">-- D\'abord choisir une matière --</option>';
        levelSelect.disabled = true;
        subjectSelect.disabled = true;
        notionSelect.disabled = true;

        if (!cycle) {
            levelSelect.innerHTML = '<option value="">-- D\'abord choisir un cycle --</option>';
            return;
        }

        // Dictionnaire pour faire correspondre la valeur du select au nom du fichier
        const fileMap = {
            primaire: 'programmes-primaire.json',
            college: 'programmes-college.json',
            lycee: 'programmes-lycee.json'
        };
        const fileName = fileMap[cycle];

        if (!fileName) {
            console.error("Cycle inconnu:", cycle);
            levelSelect.innerHTML = '<option value="">Erreur de cycle</option>';
            return;
        }

        try {
            const response = await fetch(fileName);
            if (!response.ok) throw new Error(`Fichier ${fileName} non trouvé.`);
            programmesData = await response.json();
            
            levelSelect.innerHTML = '<option value="">-- Choisir le niveau --</option>';
            Object.keys(programmesData).forEach(level => {
                levelSelect.add(new Option(level, level));
            });
            levelSelect.disabled = false;
        } catch (error) {
            console.error("Impossible de charger les programmes:", error);
            levelSelect.innerHTML = '<option value="">Erreur de chargement</option>';
        }
    }

    function setupEventListeners() {
        if (startButton) startButton.addEventListener('click', (e) => { e.preventDefault(); changePage(startButton.getAttribute('data-target')); });
        if (registerBtn) registerBtn.addEventListener('click', goToAuthPage);
        if (homeLink) homeLink.addEventListener('click', (e) => { e.preventDefault(); changePage('home'); });
        
        // Logique pour le nouveau menu utilisateur
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', () => {
                userMenuDropdown.classList.toggle('active');
            });
        }
        if (logoutBtn) logoutBtn.addEventListener('click', logout);
        if (themeToggleCheckbox) {
             themeToggleCheckbox.addEventListener('change', () => {
                const newTheme = themeToggleCheckbox.checked ? 'dark' : 'light';
                localStorage.setItem('theme', newTheme);
                applyTheme(newTheme);
            });
        }
        // Fermer le dropdown si on clique ailleurs
        document.addEventListener('click', (e) => {
            if (userMenu && !userMenu.contains(e.target)) {
                userMenuDropdown.classList.remove('active');
            }
        });


        if (showSignupLink) showSignupLink.addEventListener('click', (e) => { e.preventDefault(); if(loginFormContainer && signupFormContainer) { loginFormContainer.classList.add('hidden'); signupFormContainer.classList.remove('hidden'); } });
        if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); if(signupFormContainer && loginFormContainer) { signupFormContainer.classList.add('hidden'); loginFormContainer.classList.remove('hidden'); } });
        
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handleAuth('/auth/signup', {
                    email: e.target.elements['signup-email'].value,
                    password: e.target.elements['signup-password'].value,
                    role: e.target.elements['signup-role'].value
                });
            });
        }
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handleAuth('/auth/login', {
                    email: e.target.elements['login-email'].value,
                    password: e.target.elements['login-password'].value
                });
            });
        }
        if (openClassModalBtn) openClassModalBtn.addEventListener('click', () => { if (classModal) classModal.classList.remove('hidden'); });
        if (createClassForm) {
            createClassForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (classCreationError) classCreationError.textContent = '';
                const className = e.target.elements['class-name-input'].value;
                try {
                    const response = await fetch(`${backendUrl}/classes/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ className, teacherEmail: currentUser.email }) });
                    if (!response.ok) throw new Error((await response.json()).error);
                    await fetchAndDisplayClasses();
                    if (classModal) classModal.classList.add('hidden');
                    e.target.reset();
                } catch (error) {
                    if (classCreationError) classCreationError.textContent = error.message;
                }
            });
        }
        
        if (openQuizModalBtn) {
            openQuizModalBtn.addEventListener('click', () => { 
                if (quizModal) quizModal.classList.remove('hidden');
                initializeResourceModal(); 
            });
        }
        if (cycleSelect) {
            cycleSelect.addEventListener('change', () => {
                loadProgrammesForCycle(cycleSelect.value);
            });
        }
        if (levelSelect) {
            levelSelect.addEventListener('change', () => {
                subjectSelect.innerHTML = '<option value="">-- Choisir la matière --</option>';
                notionSelect.innerHTML = '<option value="">-- Choisir la notion --</option>';
                subjectSelect.disabled = true;
                notionSelect.disabled = true;
                if(resourceFormButton) resourceFormButton.disabled = true;

                const selectedLevel = levelSelect.value;
                if (selectedLevel && programmesData[selectedLevel]) {
                    Object.keys(programmesData[selectedLevel]).forEach(subjectKey => {
                        const subjectData = programmesData[selectedLevel][subjectKey];
                        const subjectName = subjectData.nom || subjectKey.charAt(0).toUpperCase() + subjectKey.slice(1);
                        subjectSelect.add(new Option(subjectName, subjectKey));
                    });
                    subjectSelect.disabled = false;
                }
            });
        }
        if (subjectSelect) {
            subjectSelect.addEventListener('change', () => {
                notionSelect.innerHTML = '<option value="">-- Choisir la notion --</option>';
                notionSelect.disabled = true;
                if(resourceFormButton) resourceFormButton.disabled = true;

                const selectedLevel = levelSelect.value;
                const selectedSubject = subjectSelect.value;
                if (selectedSubject && programmesData[selectedLevel] && programmesData[selectedLevel][selectedSubject]) {
                    const subjectContent = programmesData[selectedLevel][selectedSubject];
                    Object.keys(subjectContent).forEach(notionKey => {
                        if (subjectContent[notionKey] && subjectContent[notionKey].nom) {
                            const notionName = subjectContent[notionKey].nom;
                            notionSelect.add(new Option(notionName, notionKey));
                        }
                    });
                    notionSelect.disabled = false;
                }
            });
        }
        if (notionSelect) {
            notionSelect.addEventListener('change', () => {
                if(resourceFormButton) resourceFormButton.disabled = notionSelect.value === "";
            });
        }
        if (resourceForm) {
            resourceForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const level = levelSelect.value;
                const subject = subjectSelect.value;
                const notion = notionSelect.value;
                const competences = programmesData[level][subject][notion].competences;

                if (modalFormStep) modalFormStep.classList.add('hidden');
                if (modalLoadingStep) modalLoadingStep.classList.remove('hidden');
                if (modalResultStep) modalResultStep.classList.add('hidden');

                try {
                    const response = await fetch(`${backendUrl}/generate/quiz`, { 
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify({ competences })
                    });
                    generatedQuizData = await response.json();
                    if (!response.ok) throw new Error(generatedQuizData.error);
                    
                    const resultContainer = quizModal ? quizModal.querySelector('#modal-result-step .generated-content') : null;
                    if (resultContainer) resultContainer.innerHTML = `<p><strong>Titre :</strong> ${generatedQuizData.title}</p>`;
                } catch (err) {
                    alert(err.message);
                } finally {
                    if (modalLoadingStep) modalLoadingStep.classList.add('hidden');
                    if (modalResultStep) modalResultStep.classList.remove('hidden');
                }
            });
        }
        if (useQuizBtn) {
            useQuizBtn.addEventListener('click', async () => {
                const classId = assignClassSelect.value;
                if (!classId) return alert("Veuillez sélectionner une classe.");
                try {
                    const response = await fetch(`${backendUrl}/class/assign-quiz`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ quizData: generatedQuizData, classId, teacherEmail: currentUser.email })
                    });
                    if (!response.ok) throw new Error((await response.json()).error);
                    alert("Quiz assigné avec succès !");
                    if (quizModal) quizModal.classList.add('hidden');
                    await fetchAndDisplayClasses();
                } catch (error) { alert(`Erreur: ${error.message}`); }
            });
        }

        if (joinClassForm) {
            joinClassForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (joinClassError) joinClassError.textContent = '';
                const className = e.target.elements['class-code-input'].value;
                try {
                    const response = await fetch(`${backendUrl}/class/join`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ className, studentEmail: currentUser.email })
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error);
                    alert(data.message);
                    e.target.reset();
                    await fetchAndDisplayStudentClasses();
                } catch (error) {
                    if (joinClassError) joinClassError.textContent = error.message;
                }
            });
        }
        if (submitQuizBtn) {
            submitQuizBtn.addEventListener('click', async () => {
                let score = 0;
                const userAnswers = [];

                currentQuizData.questions.forEach((q, index) => {
                    const selectedInput = document.querySelector(`input[name="question-${index}"]:checked`);
                    const answerIndex = selectedInput ? parseInt(selectedInput.value) : -1;
                    userAnswers.push(answerIndex);
                    if (answerIndex === q.correct_answer_index) {
                        score++;
                    }
                });

                const resultData = { classId: currentClassId, quizId: currentQuizData.id, quizTitle: currentQuizData.title, studentEmail: currentUser.email, score: score, totalQuestions: currentQuizData.questions.length, answers: userAnswers };
    
                try {
                    await fetch(`${backendUrl}/quiz/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(resultData) });
                } catch (error) { console.error("Le score n'a pas pu être envoyé.", error); }

                if (quizContainer) quizContainer.classList.add('quiz-feedback');
                if (quizQuestionsContainer) quizQuestionsContainer.innerHTML = `<div class="quiz-feedback-header"><h3>Correction - Votre score : ${score}/${currentQuizData.questions.length}</h3><div class="spinner"></div><p>AIDA prépare les explications...</p></div>`;
                if (submitQuizBtn) submitQuizBtn.classList.add('hidden');

                const feedbackPromises = currentQuizData.questions.map((q, index) => {
                    const userAnswerIndex = userAnswers[index];
                    if (userAnswerIndex !== -1 && userAnswerIndex !== q.correct_answer_index) {
                        return fetch(`${backendUrl}/aida/feedback`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ question: q.question_text, wrongAnswer: q.options[userAnswerIndex], correctAnswer: q.options[q.correct_answer_index] })
                        }).then(res => res.json());
                    }
                    return Promise.resolve(null);
                });

                const feedbacks = await Promise.all(feedbackPromises);
                if (quizQuestionsContainer) quizQuestionsContainer.innerHTML = `<div class="quiz-feedback-header"><h3>Correction - Votre score : ${score}/${currentQuizData.questions.length}</h3></div>`;

                currentQuizData.questions.forEach((q, index) => {
                    const questionElement = document.createElement('div');
                    questionElement.className = 'quiz-question';
                    const userAnswerIndex = userAnswers[index];
                    let feedbackHTML = '';
                    if (feedbacks[index] && feedbacks[index].feedback) {
                        feedbackHTML = `<div class="aida-feedback">${feedbacks[index].feedback}</div>`;
                    }
                    const optionsHTML = q.options.map((option, i) => {
                        let className = '';
                        if (i === q.correct_answer_index) className = 'correct-answer';
                        else if (i === userAnswerIndex) className = 'wrong-answer';
                        return `<label class="${className}">${option}</label>`;
                    }).join('');
                    questionElement.innerHTML = `<p><strong>${index + 1}. ${q.question_text}</strong></p><div class="quiz-options">${optionsHTML}</div>${feedbackHTML}`;
                    if (quizQuestionsContainer) quizQuestionsContainer.appendChild(questionElement);
                });

                if (quizResult) {
                    quizResult.innerHTML = `<button id="back-to-dashboard" class="btn-secondary">Retourner au tableau de bord</button>`;
                    quizResult.classList.remove('hidden');
                    const backBtn = quizResult.querySelector('#back-to-dashboard');
                    if (backBtn) backBtn.addEventListener('click', async () => {
                        await fetchAndDisplayStudentClasses();
                        changePage('student-dashboard');
                    });
                }
            });
        }
        if (backToTeacherDashboardBtn) {
            backToTeacherDashboardBtn.addEventListener('click', () => changePage('teacher-dashboard'));
        }
    }

    function setupModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
            const closeBtn = modal.querySelector('.close-modal');
            if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
        });
    }

    function init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
        initializeAppState();
        setupEventListeners();
        setupModals();
    }

    init();
});


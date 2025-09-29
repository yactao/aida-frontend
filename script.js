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


    // --- VARIABLES GLOBALES ---
    const backendUrl = 'https://aida-backend-bqd0fnd2a3c7dadf.francecentral-01.azurewebsites.net/api';
    let currentUser = null;
    let generatedContentData = null;
    let programmesData = null;
    let currentClassData = null;
    let currentQuizData = null; // Pour le quiz en cours de l'élève
    let currentClassId = null; // Pour le quiz en cours de l'élève

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
            if (assignClassSelect) assignClassSelect.innerHTML = '<option value="">-- Sélectionnez une classe --</option>';
            if (noClassesMessage) noClassesMessage.style.display = classes.length === 0 ? 'block' : 'none';
            
            classes.forEach(cls => {
                const classCard = document.createElement('div');
                classCard.className = 'dashboard-card clickable';
                classCard.innerHTML = `<h4><i class="fa-solid fa-users"></i> ${cls.className}</h4><p>${cls.students.length} élève(s)</p><p>${(cls.quizzes || []).length} contenu(s)</p>`;
                classCard.addEventListener('click', () => showClassDetails(cls.id, cls.className));
                classListContainer.appendChild(classCard);
                assignClassSelect?.add(new Option(cls.className, cls.id));
            });
        } catch(e) {
            console.error("Erreur de chargement des classes", e);
            if(noClassesMessage) noClassesMessage.textContent = "Impossible de charger les classes.";
            if(noClassesMessage) noClassesMessage.style.display = 'block';
        }
    }
    
    async function showClassDetails(classId, className) {
        changePage('class-details-page');
        if (classDetailsTitle) classDetailsTitle.textContent = `Détails de la classe : ${className}`;
        if (classDetailsContent) classDetailsContent.innerHTML = '<div class="spinner"></div>';

        try {
            const response = await fetch(`${backendUrl}/class/details/${classId}`);
            currentClassData = await response.json(); // Stocke les données de la classe
            
            if (classDetailsContent) classDetailsContent.innerHTML = ''; // Nettoyer

            // Section des contenus assignés
            const contentsSection = document.createElement('div');
            contentsSection.className = 'class-details-section';
            contentsSection.innerHTML = '<h3>Contenus Assignés</h3>';
            const contentList = document.createElement('ul');
            contentList.className = 'content-list';
            if (currentClassData.quizzes && currentClassData.quizzes.length > 0) {
                currentClassData.quizzes.forEach(content => {
                    const li = document.createElement('li');
                    li.innerHTML = `${content.title} <button class="btn-secondary btn-small" data-content-id="${content.id}">Voir</button>`;
                    contentList.appendChild(li);
                });
            } else {
                contentList.innerHTML = '<p>Aucun contenu assigné pour cette classe.</p>';
            }
            contentsSection.appendChild(contentList);
            classDetailsContent?.appendChild(contentsSection);

            // Section des résultats
            const resultsSection = document.createElement('div');
            resultsSection.className = 'class-details-section';
            resultsSection.innerHTML = '<h3>Résultats des Élèves</h3>';
             if (currentClassData.results && currentClassData.results.length > 0) {
                const resultsList = document.createElement('ul');
                resultsList.className = 'results-list';
                // Regrouper les résultats par élève pour une meilleure lisibilité
                const studentResults = currentClassData.results.reduce((acc, result) => {
                    acc[result.studentEmail] = acc[result.studentEmail] || [];
                    acc[result.studentEmail].push(result);
                    return acc;
                }, {});

                for (const studentEmail in studentResults) {
                    const studentLi = document.createElement('li');
                    studentLi.innerHTML = `<strong>${studentEmail.split('@')[0]}</strong>`;
                    const quizzesTaken = document.createElement('ul');
                    studentResults[studentEmail].forEach(result => {
                        const quizLi = document.createElement('li');
                        quizLi.innerHTML = `${result.quizTitle}: ${result.score}/${result.totalQuestions} <button class="btn-secondary btn-small" data-result-id="${result.resultId}">Voir détails</button>`;
                        quizzesTaken.appendChild(quizLi);
                    });
                    studentLi.appendChild(quizzesTaken);
                    resultsList.appendChild(studentLi);
                }
                resultsSection.appendChild(resultsList);
             } else {
                 resultsSection.innerHTML += '<p>Aucun élève n\'a encore terminé de contenu.</p>';
             }
            classDetailsContent?.appendChild(resultsSection);

        } catch (error) {
            if (classDetailsContent) classDetailsContent.innerHTML = "<p>Erreur lors du chargement des détails de la classe.</p>";
            console.error("Erreur chargement détails classe:", error);
        }
    }

    function displayContentForTeacher(contentId) {
        const content = currentClassData?.quizzes.find(q => q.id === contentId);
        if (!content) {
            alert("Contenu introuvable.");
            return;
        }
        // Afficher une alerte simple pour la prévisualisation
        alert(`Prévisualisation de : ${content.title}\n\nType: ${content.type}\n\n` + JSON.stringify(content, null, 2));
    }

    function displayStudentResultDetails(resultId) {
        const result = currentClassData?.results.find(r => r.resultId === resultId);
        const content = currentClassData?.quizzes.find(q => q.id === result?.quizId);
        if (!result || !content) {
            alert("Détails du résultat ou contenu introuvables.");
            return;
        }

        const modal = document.getElementById('result-details-modal');
        const modalTitle = document.getElementById('result-modal-title');
        const modalContent = document.getElementById('result-modal-content');

        if(modalTitle) modalTitle.textContent = `Réponses de ${result.studentEmail.split('@')[0]} au quiz "${result.quizTitle}"`;
        let contentHTML = `<h3>Score: ${result.score}/${result.totalQuestions}</h3><hr/>`;
        
        content.questions.forEach((q, index) => {
            const studentAnswerIndex = result.answers[index];
            const isCorrect = studentAnswerIndex == q.correct_answer_index;
            contentHTML += `<h4>Question ${index + 1}: ${q.question_text}</h4>`;
            q.options.forEach((opt, optIndex) => {
                let className = '';
                if (optIndex == studentAnswerIndex) { // Réponse de l'élève
                    className = isCorrect ? 'correct-answer' : 'wrong-answer';
                } else if (optIndex == q.correct_answer_index) { // Bonne réponse (si l'élève n'a pas répondu ça)
                    className = 'correct-answer';
                }
                contentHTML += `<div class="quiz-option-review ${className}">${opt}</div>`;
            });
            contentHTML += '<br/>';
        });
        if(modalContent) modalContent.innerHTML = contentHTML;
        modal?.classList.remove('hidden');
    }

    async function fetchAndDisplayStudentContent() {
        if (!currentUser || !studentModuleList) return;
        if (studentWelcome) studentWelcome.textContent = `Bonjour ${currentUser.email.split('@')[0]} !`;
        try {
            const response = await fetch(`${backendUrl}/student/classes/${currentUser.email}`);
            const classes = await response.json();
            studentModuleList.innerHTML = '';
            if (joinClassPanel) joinClassPanel.classList.toggle('hidden', classes.length > 0);
            
            if (classes.length === 0) {
                studentModuleList.innerHTML = '<div class="dashboard-card"><h4>En attente de votre première classe</h4><p>Rejoignez une classe avec votre professeur pour voir les modules.</p></div>';
                return;
            }

            let hasContent = false;
            classes.forEach(cls => {
                if (cls.quizzes && cls.quizzes.length > 0) {
                    hasContent = true;
                    cls.quizzes.forEach(content => {
                        const card = document.createElement('div');
                        card.className = 'dashboard-card';
                        card.innerHTML = `<h4>${content.title}</h4><p>Classe: ${cls.className}</p><button class="btn-main">Commencer</button>`;
                        card.querySelector('button')?.addEventListener('click', () => startContent(content, cls.id));
                        studentModuleList.appendChild(card);
                    });
                }
            });

            if (!hasContent) {
                studentModuleList.innerHTML = '<div class="dashboard-card"><h4>Aucun module disponible</h4><p>Votre professeur n\'a pas encore assigné de contenu pour vos classes.</p></div>';
            }

        } catch (error) { 
            console.error("Erreur de récupération des modules de l'élève:", error); 
            studentModuleList.innerHTML = '<p>Impossible de charger vos modules.</p>';
        }
    }

    function startContent(contentData, classId) {
        currentQuizData = contentData; // Peut être un quiz ou un exercice
        currentClassId = classId;

        if (!contentData || !contentViewer || !contentTitle) {
            console.error("Données de contenu ou éléments d'affichage manquants.");
            return;
        }

        contentTitle.textContent = contentData.title;
        contentViewer.innerHTML = '';
        submitQuizBtn?.classList.add('hidden');
        quizResult?.classList.add('hidden');
        
        switch(contentData.type) {
            case 'quiz':
                displayQuiz(contentData);
                break;
            case 'exercices':
                displayExercices(contentData);
                break;
            default:
                contentViewer.innerHTML = `<p>Ce type de contenu ('${contentData.type}') n'est pas encore supporté.</p>`;
        }
        changePage('content-page');
    }

    function displayQuiz(quizData) {
        quizData.questions.forEach((q, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'quiz-question';
            const optionsHTML = q.options.map((option, i) => `<label><input type="radio" name="question-${index}" value="${i}"> ${option}</label>`).join('');
            questionElement.innerHTML = `<p><strong>${index + 1}. ${q.question_text}</strong></p><div class="quiz-options">${optionsHTML}</div>`;
            contentViewer?.appendChild(questionElement);
        });
        submitQuizBtn?.classList.remove('hidden');
        submitQuizBtn?.removeEventListener('click', submitCurrentContent); // S'assurer qu'il n'y a qu'un seul listener
        submitQuizBtn?.addEventListener('click', submitCurrentContent);
    }

    function displayExercices(exercicesData) {
        exercicesData.content.forEach((exo, index) => {
            const exerciceElement = document.createElement('div');
            exerciceElement.className = 'exercice-item';
            exerciceElement.innerHTML = `
                <h4>Exercice ${index + 1}</h4>
                <p>${exo.enonce}</p>
                <button class="btn-secondary show-correction-btn">Voir la correction</button>
                <div class="correction hidden">${exo.correction}</div>
            `;
            exerciceElement.querySelector('.show-correction-btn')?.addEventListener('click', (e) => {
                e.target.nextElementSibling.classList.toggle('hidden');
                e.target.textContent = e.target.nextElementSibling.classList.contains('hidden') ? 'Voir la correction' : 'Masquer la correction';
            });
            contentViewer?.appendChild(exerciceElement);
        });
        // Pas de bouton soumettre pour les exercices, ils sont auto-corrigés
        submitQuizBtn?.classList.add('hidden');
        if(backToDashboardBtn) backToDashboardBtn.classList.remove('hidden'); // S'assurer que le bouton retour est là
    }

    async function submitCurrentContent() {
        if (!currentQuizData || !currentClassId || !currentUser) return;

        let score = 0;
        const userAnswers = [];

        // Logique spécifique pour les quiz
        if (currentQuizData.type === 'quiz' && currentQuizData.questions) {
            currentQuizData.questions.forEach((q, index) => {
                const selectedInput = document.querySelector(`input[name="question-${index}"]:checked`);
                const answerIndex = selectedInput ? parseInt(selectedInput.value) : -1;
                userAnswers.push(answerIndex);
                if (answerIndex == q.correct_answer_index) {
                    score++;
                }
            });

            // Envoyer les résultats au backend
            const resultData = {
                classId: currentClassId,
                quizId: currentQuizData.id,
                quizTitle: currentQuizData.title,
                studentEmail: currentUser.email,
                score: score,
                totalQuestions: currentQuizData.questions.length,
                answers: userAnswers
            };

            try {
                await fetch(`${backendUrl}/quiz/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(resultData)
                });
            } catch (error) {
                console.error("Erreur lors de l'envoi du score:", error);
            }

            // Afficher la correction
            if (contentViewer) contentViewer.classList.add('quiz-feedback'); // Ajoute une classe pour le style de correction
            
            if (contentViewer) contentViewer.innerHTML = `<div class="quiz-feedback-header"><h3>Correction - Votre score : ${score}/${currentQuizData.questions.length}</h3></div>`;

            currentQuizData.questions.forEach((q, index) => {
                const questionElement = document.createElement('div');
                questionElement.className = 'quiz-question';
                
                const optionsHTML = q.options.map((option, i) => {
                    let className = '';
                    if (i === q.correct_answer_index) {
                        className = 'correct-answer';
                    } else if (i === userAnswers[index]) {
                        className = 'wrong-answer';
                    }
                    return `<label class="${className}">${option}</label>`;
                }).join('');
    
                questionElement.innerHTML = `<p><strong>${index + 1}. ${q.question_text}</strong></p><div class="quiz-options">${optionsHTML}</div>`;
                contentViewer?.appendChild(questionElement);
            });

            if (quizResult) {
                quizResult.innerHTML = `<button id="back-to-dashboard-from-quiz" class="btn-main">Retourner au tableau de bord</button>`;
                quizResult.classList.remove('hidden');
                document.getElementById('back-to-dashboard-from-quiz')?.addEventListener('click', () => changePage('student-dashboard'));
            }
            submitQuizBtn?.classList.add('hidden');
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
        modalLoadingStep.classList.add('hidden'); // Assurez-vous que l'étape de chargement est masquée initialement
        modalResultStep.classList.add('hidden');
        if (generatedContentEditor) generatedContentEditor.value = ''; // Nettoyer l'éditeur
        if (assignClassSelect) assignClassSelect.value = ''; // Réinitialiser la sélection de classe
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
            if (!response.ok) throw new Error(`Fichier non trouvé: ${fileMap[cycle]}`);
            programmesData = await response.json();
            populateSelect(levelSelect, Object.keys(programmesData), "-- Choisir la classe --");
        } catch (e) { 
            console.error("Erreur chargement programmes pour le cycle:", cycle, e); 
            alert(`Impossible de charger le programme pour le cycle "${cycle}". Vérifiez que le fichier "${fileMap[cycle]}" existe et est accessible.`);
        }
    }

    // --- Animation d'Introduction AIDA ---
    function setupIntroAnimation() {
        if (!aidaIntroAnimation) return;

        const animationElements = [
            { icon: 'fa-user-graduate', color: '#4A90E2', text: "Pour les élèves" },
            { icon: 'fa-chalkboard-user', color: '#50E3C2', text: "Pour les enseignants" },
            { icon: 'fa-school', color: '#F5A623', text: "Pour les établissements" },
            { icon: 'fa-book-open', color: '#8E44AD', text: "Créez des ressources" },
            { icon: 'fa-chart-line', color: '#D35400', text: "Suivez les progrès" },
            { icon: 'fa-lightbulb', color: '#27AE60', text: "Apprenez en vous amusant" },
        ];
        let currentIndex = 0;

        function animateStep() {
            aidaIntroAnimation.innerHTML = ''; // Nettoyer l'étape précédente
            if (currentIndex < animationElements.length) {
                const element = animationElements[currentIndex];
                const iconElement = document.createElement('i');
                iconElement.className = `fa-solid ${element.icon} animation-element`;
                iconElement.style.color = element.color;
                iconElement.style.left = `${Math.random() * 80 + 10}%`;
                iconElement.style.top = `${Math.random() * 80 + 10}%`;
                aidaIntroAnimation.appendChild(iconElement);

                const textElement = document.createElement('span');
                textElement.className = 'animation-text';
                textElement.textContent = element.text;
                textElement.style.color = element.color;
                aidaIntroAnimation.appendChild(textElement);

                setTimeout(() => {
                    iconElement.classList.add('visible');
                    textElement.classList.add('visible');
                }, 100);

                setTimeout(() => {
                    iconElement.classList.remove('visible');
                    textElement.classList.remove('visible');
                    currentIndex++;
                    animateStep();
                }, 2000); // Chaque étape dure 2 secondes
            } else {
                // Fin de l'animation, afficher le logo final
                aidaIntroAnimation.innerHTML = `
                    <div class="final-logo">
                        <span class="logo-icon">A</span>
                        <span class="logo-text">AIDA</span>
                        <span class="logo-tagline">ÉDUCATION</span>
                    </div>
                `;
                aidaIntroAnimation.querySelector('.final-logo')?.classList.add('visible');
                 // Après la fin de l'animation, masquer le conteneur et afficher le hero-content
                setTimeout(() => {
                    aidaIntroAnimation.parentElement?.classList.add('hidden');
                    document.querySelector('.hero-content')?.classList.remove('hidden');
                }, 1000); // Rester visible 1 seconde avant de cacher
            }
        }
        
        // Initialiser l'animation cachée, puis la démarrer
        if(document.querySelector('.hero-content')) {
            document.querySelector('.hero-content').classList.add('hidden');
        }
        aidaIntroAnimation.parentElement?.classList.remove('hidden'); // S'assurer que le conteneur est visible
        animateStep();
    }


    function setupEventListeners() {
        homeLink?.addEventListener('click', (e) => { e.preventDefault(); initializeAppState(); });
        registerBtn?.addEventListener('click', (e) => { e.preventDefault(); changePage('auth-page'); });
        
        document.querySelectorAll('#home .selection-card').forEach(card => {
            if (card.tagName !== 'A') { // Ne pas ajouter le listener aux liens directs comme Playground
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

        // Listeners pour le tableau de bord enseignant
        openClassModalBtn?.addEventListener('click', () => classModal?.classList.remove('hidden'));
        createClassForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorEl = createClassForm.querySelector('.error-message');
            if(errorEl) errorEl.textContent = '';
            const className = createClassForm.elements['class-name-input'].value;
            if (!className) {
                if(errorEl) errorEl.textContent = "Le nom de la classe est requis.";
                return;
            }
            try {
                const response = await fetch(`${backendUrl}/classes/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ className, teacherEmail: currentUser.email }) });
                if (!response.ok) throw new Error((await response.json()).error);
                await fetchAndDisplayClasses();
                classModal?.classList.add('hidden');
                createClassForm.reset();
            } catch (error) {
                if(errorEl) errorEl.textContent = error.message;
            }
        });
        
        openResourceModalBtn?.addEventListener('click', () => {
            generationModal?.classList.remove('hidden');
            initializeResourceModal();
            // Assurez-vous que les classes sont chargées pour le select d'assignation
            fetchAndDisplayClasses(); 
        });

        // Listeners pour la génération de ressources
        cycleSelect?.addEventListener('change', () => loadProgrammesForCycle(cycleSelect.value));
        levelSelect?.addEventListener('change', () => {
            notionSelect.innerHTML = '<option value="">-- D\'abord choisir une matière --</option>';
            notionSelect.disabled = true;
            const level = levelSelect.value;
            if (level && programmesData && programmesData[level]) {
                const subjects = Object.keys(programmesData[level]).map(key => ({ key: key, name: programmesData[level][key].nom }));
                populateSelect(subjectSelect, subjects, "-- Choisir la matière --", true);
            } else {
                populateSelect(subjectSelect, [], "-- D'abord choisir une classe --");
            }
        });
        
        subjectSelect?.addEventListener('change', () => {
            const selectedLevel = levelSelect.value;
            const selectedSubject = subjectSelect.value;
            if (selectedLevel && selectedSubject && programmesData && programmesData[selectedLevel]?.[selectedSubject]) {
                const subjectData = programmesData[selectedLevel][selectedSubject];
                let allNotions = [];
                Object.keys(subjectData).forEach(mainNotionKey => {
                    if (mainNotionKey === 'nom') return; // 'nom' est une propriété, pas une notion
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
            } else {
                populateSelect(notionSelect, [], "-- D'abord choisir une matière --");
            }
        });

        notionSelect?.addEventListener('change', () => {
            if(resourceFormButton) resourceFormButton.disabled = !notionSelect.value;
        });

        resourceForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            modalFormStep?.classList.add('hidden');
            modalLoadingStep?.classList.remove('hidden');

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
                
                if (generatedContentEditor) generatedContentEditor.value = data.text_representation;
                generatedContentData = data.structured_content; // Garder le JSON en mémoire
                
                modalLoadingStep?.classList.add('hidden');
                modalResultStep?.classList.remove('hidden');
            } catch (err) {
                alert("Erreur de génération: " + err.message);
                initializeResourceModal();
            }
        });
        
        confirmAssignBtn?.addEventListener('click', async () => {
            const classId = assignClassSelect.value;
            if (!classId) return alert("Veuillez sélectionner une classe.");
            const modifiedText = generatedContentEditor?.value;

            try {
                // Étape 1: Convertir le texte modifié en JSON si nécessaire
                let finalContent = generatedContentData; // Par défaut, on utilise le JSON original
                if (modifiedText !== generatedContentData.text_representation) { // Si le texte a été modifié
                    const conversionResponse = await fetch(`${backendUrl}/convert/text-to-json`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: modifiedText, contentType: generatedContentData.type })
                    });
                    finalContent = await conversionResponse.json();
                    if (!conversionResponse.ok) throw new Error(finalContent.error || "Erreur de conversion.");
                }

                // Étape 2: Assigner le contenu (JSON) à la classe
                const assignResponse = await fetch(`${backendUrl}/class/assign-content`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contentData: finalContent, classId, teacherEmail: currentUser.email })
                });
                if (!assignResponse.ok) throw new Error((await assignResponse.json()).error);
                alert("Contenu assigné avec succès !");
                generationModal?.classList.add('hidden');
                await fetchAndDisplayClasses();
            } catch (error) { alert(`Erreur lors de l'assignation: ${error.message}`); }
        });


        // Listeners pour le tableau de bord élève
        joinClassForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorEl = joinClassForm.querySelector('.error-message');
            if(errorEl) errorEl.textContent = '';
            const className = joinClassForm.elements['class-code-input'].value;
            if (!className) {
                if(errorEl) errorEl.textContent = "Le nom de la classe est requis.";
                return;
            }
            try {
                const response = await fetch(`${backendUrl}/class/join`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ className, studentEmail: currentUser.email })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error);
                alert(data.message);
                joinClassForm.reset();
                await fetchAndDisplayStudentContent();
            } catch (error) { 
                if(errorEl) errorEl.textContent = error.message;
            }
        });

        // Listeners pour les détails de classe et les résultats
        classDetailsContent?.addEventListener('click', (e) => {
            if (e.target.matches('button[data-result-id]')) {
                displayStudentResultDetails(e.target.getAttribute('data-result-id'));
            } else if (e.target.matches('button[data-content-id]')) {
                displayContentForTeacher(e.target.getAttribute('data-content-id'));
            }
        });
        backToTeacherDashboardBtn?.addEventListener('click', () => changePage('teacher-dashboard'));
        backToDashboardBtn?.addEventListener('click', () => {
            if(currentUser?.role === 'teacher') changePage('teacher-dashboard');
            else changePage('student-dashboard');
        });

        // Listener pour la soumission de contenu (quiz/exercices)
        submitQuizBtn?.addEventListener('click', submitCurrentContent);
    }

    // --- POINT D'ENTRÉE ---
    function init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
        // Seulement lancer l'animation d'intro si on est sur la page d'accueil et qu'on n'est pas déjà connecté
        if (pages[0]?.classList.contains('active') && !currentUser) {
            setupIntroAnimation();
        } else {
            // Si déjà connecté ou pas sur home, on affiche directement le contenu
            document.querySelector('.hero-content')?.classList.remove('hidden');
            document.querySelector('.intro-animation-container')?.classList.add('hidden');
            initializeAppState();
        }
        setupEventListeners();
        // setupModals(); // Assurez-vous que cette fonction gère la fermeture correctement
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
    
    function startQuiz(quizData, classId) {
        currentQuizData = quizData;
        currentClassId = classId;

        if (!quizData || !Array.isArray(quizData.questions)) {
            alert("Désolé, ce quiz ne peut pas être chargé car ses questions sont manquantes.");
            console.error("Erreur de données de quiz :", quizData);
            return;
        }

        // Réinitialiser l'affichage du quiz
        if (contentViewer) contentViewer.classList.remove('quiz-feedback'); // Enlève le style de correction
        if (contentTitle) contentTitle.textContent = quizData.title;
        if (contentViewer) contentViewer.innerHTML = '';
        if (quizResult) quizResult.classList.add('hidden');
        if (submitQuizBtn) submitQuizBtn.classList.remove('hidden');
        
        quizData.questions.forEach((q, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'quiz-question';
            const optionsHTML = q.options.map((option, i) => `<label><input type="radio" name="question-${index}" value="${i}"> ${option}</label>`).join('');
            questionElement.innerHTML = `<p><strong>${index + 1}. ${q.question_text}</strong></p><div class="quiz-options">${optionsHTML}</div>`;
            contentViewer?.appendChild(questionElement);
        });
        changePage('content-page');
    }

    init();
});


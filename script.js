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
    
    // Modales
    const generationModal = document.getElementById('generation-modal');
    const assignmentModal = document.getElementById('assignment-modal');
    const manageClassModal = document.getElementById('manage-class-modal');
    
    const resourceForm = document.getElementById('resource-form');
    const modalFormStep = document.getElementById('modal-form-step');
    const modalLoadingStep = document.getElementById('modal-loading-step');
    
    const assignClassSelect = document.getElementById('assign-class-select');
    const studentWelcome = document.getElementById('student-welcome');
    
    const studentTodoList = document.getElementById('student-todo-list');
    const studentCompletedList = document.getElementById('student-completed-list');
    
    const contentTitle = document.getElementById('content-title');
    const contentViewer = document.getElementById('content-viewer');
    const speakContentBtn = document.getElementById('speak-content-btn');
    const submitQuizBtn = document.getElementById('submit-quiz-btn');
    const quizResult = document.getElementById('quiz-result');

    const classDetailsTitle = document.getElementById('class-details-title');
    const classDetailsContent = document.getElementById('class-details-content');
    const backToTeacherDashboardBtn = document.getElementById('back-to-teacher-dashboard');
    const manageClassBtn = document.getElementById('manage-class-btn');
    
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
    
    const backToClassDetailsBtn = document.getElementById('back-to-class-details');
    const studentResultsTitle = document.getElementById('student-results-title');
    const studentResultsContent = document.getElementById('student-results-content');
    
    // Sélecteurs de la modale de gestion
    const manageClassModalTitle = document.getElementById('manage-class-modal-title');
    const studentListManagement = document.getElementById('student-list-management');
    const addStudentForm = document.getElementById('add-student-form');
    const deleteClassBtn = document.getElementById('delete-class-btn');
    const deleteClassConfirmation = document.getElementById('delete-class-confirmation');
    const confirmDeleteClassBtn = document.getElementById('confirm-delete-class-btn');
    const cancelDeleteClassBtn = document.getElementById('cancel-delete-class-btn');


    // --- VARIABLES GLOBALES ---
    let currentUser = null;
    let generatedContentData = null; 
    let programmesData = null;
    let currentClassData = null;

    // --- SYNTHÈSE VOCALE ---
    function getTextFromContentViewer() {
        let text = contentTitle.textContent + '. ';
        contentViewer.querySelectorAll('.quiz-question, .question-feedback, .revision-content').forEach(el => {
            text += el.innerText + '. ';
        });
        return text;
    }

    function speakText(text, buttonElement) {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            buttonElement.classList.remove('speaking');
            return;
        }
        if (text) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'fr-FR';
            utterance.onstart = () => buttonElement.classList.add('speaking');
            utterance.onend = () => buttonElement.classList.remove('speaking');
            speechSynthesis.speak(utterance);
        }
    }

    // --- NAVIGATION ET UI ---
    function changePage(targetId) {
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(targetId)?.classList.add('active');
        speechSynthesis.cancel();
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
                classCard.innerHTML = `<h4><i class="fa-solid fa-users"></i> ${cls.className}</h4><p>${(cls.students || []).length} élève(s)</p><p>${(cls.quizzes || []).length} contenu(s)</p>`;
                classCard.addEventListener('click', () => showClassDetails(cls.id, cls.className, true));
                classListContainer.appendChild(classCard);
                assignClassSelect.add(new Option(cls.className, cls.id));
            });
        } catch (error) { console.error("Erreur de récupération des classes:", error); }
    }
    
    async function showClassDetails(classId, className, forceRefresh = false) {
        changePage('class-details-page');
        classDetailsTitle.textContent = `Détails de la classe : ${className}`;
        
        if (forceRefresh || !currentClassData || currentClassData.id !== classId) {
            classDetailsContent.innerHTML = '<div class="spinner"></div>';
            try {
                const response = await fetch(`${backendUrl}/class/details/${classId}`);
                if (!response.ok) throw new Error((await response.json()).error);
                currentClassData = await response.json();
            } catch (error) {
                 console.error("Erreur lors de l'affichage des détails de la classe:", error);
                classDetailsContent.innerHTML = `<p class="error-message">Erreur lors du chargement des détails.</p>`;
                return;
            }
        }
           
        classDetailsContent.innerHTML = ''; 
    
        const studentsGrid = document.createElement('div');
        studentsGrid.className = 'details-grid';
        
        if (currentClassData.studentsWithResults && currentClassData.studentsWithResults.length > 0) {
             currentClassData.studentsWithResults.forEach(student => {
                const card = document.createElement('div');
                card.className = 'details-card student-card';
                card.innerHTML = `
                    <div class="card-title"><i class="fa-solid fa-user"></i> ${student.email.split('@')[0]}</div>
                    <div class="card-info">${student.results.length} test(s) complété(s)</div>
                    <button class="btn-secondary" data-student-email="${student.email}">Voir les résultats</button>
                `;
                studentsGrid.appendChild(card);
            });
        } else {
            studentsGrid.innerHTML = '<p>Aucun élève dans cette classe pour le moment.</p>';
        }
        classDetailsContent.appendChild(studentsGrid);
    }
    
    function showStudentResults(studentEmail) {
        const studentData = currentClassData.studentsWithResults.find(s => s.email === studentEmail);
        if (!studentData) return;

        changePage('student-results-page');
        studentResultsTitle.textContent = `Résultats de ${studentEmail.split('@')[0]}`;
        studentResultsContent.innerHTML = '';

        const resultsByType = { quiz: [], exercices: [], revision: [] };
        
        studentData.results.forEach(result => {
            const type = result.type || 'quiz'; // Fallback au cas où le type ne serait pas enregistré
            if (!resultsByType[type]) resultsByType[type] = [];
            resultsByType[type].push(result);
        });

        if(Object.values(resultsByType).every(arr => arr.length === 0)) {
            studentResultsContent.innerHTML = '<p>Cet élève n\'a complété aucun test pour le moment.</p>';
            return;
        }

        Object.keys(resultsByType).forEach(type => {
            if (resultsByType[type].length > 0) {
                const section = document.createElement('div');
                section.className = 'class-details-section';
                section.innerHTML = `<h3>${type.charAt(0).toUpperCase() + type.slice(1)}s</h3>`;
                const grid = document.createElement('div');
                grid.className = 'details-grid';
                resultsByType[type].forEach(result => {
                     const card = document.createElement('div');
                    card.className = 'details-card result-card';
                    const scorePercentage = result.totalQuestions > 0 ? (result.score / result.totalQuestions) * 100 : 0;
                    card.innerHTML = `
                        <div class="card-title">${result.quizTitle}</div>
                        <div class="score-display">
                            <span class="score">${result.score}/${result.totalQuestions}</span>
                            <div class="score-bar"><div class="score-fill" style="width: ${scorePercentage}%;"></div></div>
                        </div>
                        <button class="btn-secondary" data-result-id="${result.resultId}">Détails</button>
                    `;
                    grid.appendChild(card);
                });
                section.appendChild(grid);
                studentResultsContent.appendChild(section);
            }
        });
    }

    function displayStudentResultDetails(resultId) {
        let result;
        for (const student of currentClassData.studentsWithResults) {
            result = student.results.find(r => r.resultId === resultId);
            if (result) break;
        }
        if (!result) return;

        const content = currentClassData.quizzes.find(q => q.id === result.quizId);
        if (!content || !content.questions) return;

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
                if (optIndex == studentAnswerIndex) className = isCorrect ? 'correct' : 'incorrect';
                else if (optIndex == q.correct_answer_index) className = 'correct';
                contentHTML += `<div class="answer ${className}">${opt}</div>`;
            });
        });
        modalContent.innerHTML = contentHTML;
        modal.classList.remove('hidden');
    }
    
    // --- GESTION DE CLASSE ---
    
    function openManageClassModal() {
        manageClassModalTitle.textContent = `Gérer la classe "${currentClassData.className}"`;
        studentListManagement.innerHTML = '';
        
        (currentClassData.studentsWithResults || []).forEach(student => {
            const studentItem = document.createElement('div');
            studentItem.className = 'student-list-item';
            studentItem.innerHTML = `<span>${student.email}</span><button class="remove-student-btn" data-student-email="${student.email}">&times;</button>`;
            studentListManagement.appendChild(studentItem);
        });
        
        manageClassModal.classList.remove('hidden');
    }
    
    async function handleRemoveStudent(studentEmail) {
        try {
            document.getElementById('remove-student-error').textContent = '';
            const response = await fetch(`${backendUrl}/class/remove-student`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classId: currentClassData.id, teacherEmail: currentUser.email, studentEmail })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            
            // Mettre à jour les données locales et rafraîchir
            currentClassData.studentsWithResults = currentClassData.studentsWithResults.filter(s => s.email !== studentEmail);
            openManageClassModal(); // Rafraîchir la modale
        } catch (error) {
            document.getElementById('remove-student-error').textContent = error.message;
        }
    }
    
    async function handleAddStudent(studentEmail) {
         try {
            document.getElementById('add-student-error').textContent = '';
            const response = await fetch(`${backendUrl}/class/add-student`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classId: currentClassData.id, teacherEmail: currentUser.email, studentEmail })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            
            currentClassData.studentsWithResults.push({ email: studentEmail, results: [] });
            openManageClassModal();
            addStudentForm.reset();
        } catch (error) {
            document.getElementById('add-student-error').textContent = error.message;
        }
    }
    
    async function handleDeleteClass() {
        try {
            document.getElementById('delete-class-error').textContent = '';
            const response = await fetch(`${backendUrl}/class/${currentClassData.id}/${currentUser.email}`, { method: 'DELETE' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            
            manageClassModal.classList.add('hidden');
            await fetchAndDisplayClasses(); // Rafraîchir la liste des classes
            changePage('teacher-dashboard');
            
        } catch(error) {
            document.getElementById('delete-class-error').textContent = error.message;
        }
    }


    // --- LOGIQUE ÉLÈVE ---
    async function fetchAndDisplayStudentContent() {
        if (!currentUser) return;
        try {
            const response = await fetch(`${backendUrl}/student/classes/${currentUser.email}`);
            const data = await response.json();
            studentTodoList.innerHTML = '';
            studentCompletedList.innerHTML = '';

            const { todo, completed } = data;

            if(todo && todo.length > 0) {
                todo.forEach(content => createStudentCard(content, studentTodoList));
            } else {
                studentTodoList.innerHTML = '<p>Bravo, tu as tout terminé !</p>';
            }

            if(completed && completed.length > 0) {
                completed.forEach(content => createStudentCard(content, studentCompletedList));
            } else {
                studentCompletedList.innerHTML = '<p>Aucun exercice terminé pour le moment.</p>';
            }

        } catch (error) { console.error("Erreur de récupération des modules:", error); }
    }

    function createStudentCard(content, container) {
        const card = document.createElement('div');
        card.className = 'dashboard-card-student';
        const isCompleted = content.status === 'completed';

        const dateToShow = isCompleted ? content.completedAt : content.assignedAt;
        const formattedDate = new Date(dateToShow).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const dateLabel = isCompleted ? 'Terminé le' : 'Reçu le';

        let subject = 'autre';
        if (content.title.toLowerCase().includes('math')) subject = 'maths';
        if (content.title.toLowerCase().includes('français')) subject = 'francais';
        if (content.title.toLowerCase().includes('science')) subject = 'sciences';
        if (content.title.toLowerCase().includes('histoire')) subject = 'histoire';

        card.innerHTML = `
            <div class="card-header">
                <span class="subject-tag tag-${subject}">${subject.charAt(0).toUpperCase() + subject.slice(1)}</span>
                ${content.isNewest && !isCompleted ? '<span class="new-tag">Nouveau</span>' : ''}
            </div>
            <div class="card-content">
                <h4>${content.title}</h4>
                <p>Classe: ${content.className}</p>
            </div>
            <div class="card-footer">
                <span class="card-date">${dateLabel} ${formattedDate}</span>
                <button class="btn-secondary ${isCompleted ? 'btn-termine' : ''}" ${isCompleted ? 'disabled' : ''}>
                    ${isCompleted ? 'Terminé' : 'Commencer'}
                </button>
            </div>
        `;

        if (!isCompleted) {
            card.querySelector('button').addEventListener('click', () => displayContent(content, content.classId));
        }
        container.appendChild(card);
    }
    
    function displayContent(contentData, classId) {
        contentTitle.textContent = contentData.title;
        contentViewer.innerHTML = '';
        submitQuizBtn.classList.add('hidden');
        quizResult.classList.add('hidden');
        
        const isTeacherPreview = currentUser.role === 'teacher';

        switch(contentData.type) {
            case 'quiz':
                displayQuiz(contentData, classId, isTeacherPreview);
                break;
            case 'revision':
                const formattedContent = contentData.content
                    .replace(/### (.*)/g, '<h3>$1</h3>')
                    .replace(/## (.*)/g, '<h2>$1</h2>')
                    .replace(/\* (.*)/g, '<li>$1</li>')
                    .replace(/\n/g, '<br>');
                contentViewer.innerHTML = `<div class="revision-content">${formattedContent}</div>`;
                break;
            case 'exercices':
                 contentViewer.innerHTML = `<div class="revision-content">${contentData.content.replace(/\n/g, '<br>')}</div>`;
                break;
            default:
                contentViewer.innerHTML = `<p>${contentData.content || "Ce type de contenu n'est pas encore supporté."}</p>`;
        }
        changePage('content-page');
    }
    
    function displayQuiz(quizData, classId, isTeacherPreview) {
        quizData.questions.forEach((q, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'quiz-question';
            const optionsHTML = q.options.map((option, i) => `<label><input type="radio" name="question-${index}" value="${i}" ${isTeacherPreview ? 'disabled' : ''}> ${option}</label>`).join('');
            questionElement.innerHTML = `<p><strong>${index + 1}. ${q.question_text}</strong></p><div class="quiz-options">${optionsHTML}</div>`;
            contentViewer.appendChild(questionElement);
        });
        
        if (!isTeacherPreview) {
            submitQuizBtn.classList.remove('hidden');
            submitQuizBtn.onclick = () => submitQuiz(quizData, classId);
        }
    }

    async function submitQuiz(quizData, classId) {
        const userAnswers = [];
        quizData.questions.forEach((q, index) => {
            const selectedInput = document.querySelector(`input[name="question-${index}"]:checked`);
            userAnswers.push(selectedInput ? parseInt(selectedInput.value) : -1);
        });

        submitQuizBtn.classList.add('hidden');
        contentViewer.innerHTML = '';

        for (let i = 0; i < quizData.questions.length; i++) {
            const q = quizData.questions[i];
            const studentAnswerIndex = userAnswers[i];
            const isCorrect = studentAnswerIndex == q.correct_answer_index;

            const feedbackElement = document.createElement('div');
            feedbackElement.className = `question-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
            
            let optionsHTML = q.options.map((option, idx) => {
                let className = '';
                if (idx == studentAnswerIndex) className = isCorrect ? 'correct' : 'incorrect';
                else if (idx == q.correct_answer_index) className = 'correct';
                return `<div class="answer ${className}">${option}</div>`;
            }).join('');

            feedbackElement.innerHTML = `<p><strong>${i + 1}. ${q.question_text}</strong></p>${optionsHTML}`;

            if (!isCorrect) {
                const explanationSpinner = document.createElement('div');
                explanationSpinner.className = 'spinner';
                feedbackElement.appendChild(explanationSpinner);

                try {
                    const response = await fetch(`${backendUrl}/generate/explanation`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            question: q.question_text,
                            studentAnswer: q.options[studentAnswerIndex] || "Aucune réponse",
                            correctAnswer: q.options[q.correct_answer_index]
                        })
                    });
                    const data = await response.json();
                    explanationSpinner.remove();
                    const explanationDiv = document.createElement('div');
                    explanationDiv.className = 'aida-explanation';
                    explanationDiv.innerHTML = `💡 **AIDA dit :** ${data.explanation}`;
                    feedbackElement.appendChild(explanationDiv);
                } catch (error) {
                    explanationSpinner.remove();
                    console.error("Erreur explication:", error);
                }
            }
            contentViewer.appendChild(feedbackElement);
        }

        try {
            let score = userAnswers.reduce((acc, ans, idx) => acc + (ans == quizData.questions[idx].correct_answer_index ? 1 : 0), 0);
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
                    answers: userAnswers,
                    type: quizData.type
                })
            });
            await fetchAndDisplayStudentContent();
        } catch (error) {
            console.error("Erreur lors de l'envoi du score:", error);
        }
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
            const response = await fetch(`/${fileMap[cycle]}`); 
            if (!response.ok) throw new Error(`Fichier non trouvé: ${fileMap[cycle]}`);
            programmesData = await response.json();
            populateSelect(levelSelect, Object.keys(programmesData), "-- Choisir la classe --");
        } catch (e) { 
            console.error("Erreur chargement programmes pour le cycle:", cycle, e); 
            alert(`Impossible de charger le programme pour le cycle "${cycle}". Vérifiez que le fichier "${fileMap[cycle]}" existe dans le dossier "public" de votre backend.`);
        }
    }

    function setupEventListeners() {
        homeLink.addEventListener('click', (e) => { e.preventDefault(); initializeAppState(); });
        startButton.addEventListener('click', (e) => { e.preventDefault(); changePage(startButton.getAttribute('data-target')); });
        registerBtn.addEventListener('click', (e) => { e.preventDefault(); changePage('auth-page'); });
        backToDashboardBtn.addEventListener('click', () => {
            if(currentUser.role === 'teacher') changePage('teacher-dashboard');
            else changePage('student-dashboard');
        });

        speakContentBtn.addEventListener('click', () => {
            const textToRead = getTextFromContentViewer();
            speakText(textToRead, speakContentBtn);
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
        backToClassDetailsBtn.addEventListener('click', () => showClassDetails(currentClassData.id, currentClassData.className, false));


        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
            modal.querySelector('.close-modal')?.addEventListener('click', () => modal.classList.add('hidden'); });
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
            initializeResourceModal();
            generationModal.classList.remove('hidden');
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
                generatedContentData = data.structured_content;
                
                generationModal.classList.add('hidden');
                assignmentModal.classList.remove('hidden');
            } catch (err) {
                alert("Erreur de génération: " + err.message);
            } finally {
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
                assignmentModal.classList.add('hidden');
                await fetchAndDisplayClasses();
            } catch (error) { alert(`Erreur: ${error.message}`); }
        });

        classDetailsContent.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-student-email]');
            if (button) {
                showStudentResults(button.dataset.studentEmail);
            }
        });
        
        studentResultsContent.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-result-id]');
             if (button) {
                displayStudentResultDetails(button.dataset.resultId);
            }
        });
        
        manageClassBtn.addEventListener('click', openManageClassModal);
        
        studentListManagement.addEventListener('click', (e) => {
            if(e.target.classList.contains('remove-student-btn')) {
                handleRemoveStudent(e.target.dataset.studentEmail);
            }
        });
        
        addStudentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = addStudentForm.querySelector('input').value;
            handleAddStudent(email);
        });
        
        deleteClassBtn.addEventListener('click', () => {
            deleteClassBtn.classList.add('hidden');
            deleteClassConfirmation.classList.remove('hidden');
        });
        
        cancelDeleteClassBtn.addEventListener('click', () => {
            deleteClassBtn.classList.remove('hidden');
            deleteClassConfirmation.classList.add('hidden');
        });
        
        confirmDeleteClassBtn.addEventListener('click', handleDeleteClass);


    }

    // --- INITIALISATION ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    initializeAppState();
    setupEventListeners();
});


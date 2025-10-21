document.addEventListener('DOMContentLoaded', () => {
    const backendUrl = 'https://aida-backend-bqd0fnd2a3c7dadf.francecentral-01.azurewebsites.net';
    let currentUser = null;
    let teacherClasses = [];
    let generatedContent = null;
    let currentClassData = null;
    let programmes = {};
    let selectedCompetenceInfo = null;
    let studentDashboardData = null;
    let helpUsedInQuiz = false;
    let helpUsedInHomework = false; // Ajouté pour le suivi DM/Exercices
    
    const spinnerHtml = `<div class="spinner"><div class="dot1"></div><div class="dot2"></div><div class="dot3"></div></div>`;
    
    const main = document.querySelector('main');
    const modalContainer = document.getElementById('modal-container');
    const loginNavBtn = document.getElementById('login-nav-btn');
    // homeLink est utilisé pour le logo
    const homeLink = document.getElementById('home-link'); 
    
    // workspaceLink n'est plus dans la navigation principale de index.html, mais le garder ici
    const workspaceLink = document.getElementById('workspace-link'); 
    const libraryLink = document.getElementById('library-link');
    
    // AJOUT DES CONSTANTES ACADEMIE MRE
    const academieMRELink = document.getElementById('academie-mre-link'); 
    const startEtablissementBtn = document.getElementById('start-etablissement-btn');
    const startAcademieBtn = document.getElementById('start-academie-btn');
    
    const userMenuContainer = document.querySelector('.user-menu-container');
    const userNameDisplay = document.getElementById('user-name-display');
    const userAvatarDisplay = document.getElementById('user-avatar-display');
    const userInfoClickable = document.getElementById('user-info-clickable');
    const userDropdown = document.querySelector('.user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const themeToggleHeaderBtn = document.getElementById('theme-toggle-header-btn');
    const themeToggleDropdownBtn = document.getElementById('theme-toggle-dropdown-btn');
    const adminModuleLink = document.getElementById('admin-module-link');
    


    async function loadProgrammes() {
        try {
            const fetchProgram = async (fileName) => {
                const response = await fetch(`${backendUrl}/${fileName}`);
                if (!response.ok) { throw new Error(`Le fichier ${fileName} est introuvable ou illisible (statut: ${response.status}).`); }
                return response.json();
            };
            const [p, c, l] = await Promise.all([ fetchProgram('programmes-primaire.json'), fetchProgram('programmes-college.json'), fetchProgram('programmes-lycee.json') ]);
            programmes = { Primaire: p, Collège: c, Lycée: l };
            console.log("Programmes chargés avec succès.");
        } catch (e) {
            console.error("Erreur critique lors du chargement des programmes:", e);
            alert("Erreur critique : Impossible de charger les programmes scolaires. Détails : " + e.message);
            programmes = {}; 
        }
    }
    
    // **********************************************
    // EXPOSITION DES FONCTIONS ET UTILES (SHELL)
    // **********************************************

    // Fonctions essentielles globales pour tous les modules
    window.changePage = (id) => { main.querySelectorAll('.page').forEach(p=>p.classList.remove('active')); document.getElementById(id).classList.add('active'); };
    
    // CORRECTION APIREQUEST: Revert vers l'implémentation la plus simple pour éviter le double /api/
    window.apiRequest = async (endpoint, method = 'GET', body = null) => { 
        try { 
            const opts = { method, headers: { 'Content-Type': 'application/json' } }; 
            if (body) opts.body = JSON.stringify(body); 

            // Construction de l'URL propre: backendUrl + /api + endpoint (qui doit commencer par /)
            const url = `${backendUrl}/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

            const res = await fetch(url, opts); 

            if (!res.ok) { 
                const errText = await res.text(); 
                try { 
                    const err = JSON.parse(errText); 
                    throw new Error(err.error || 'Une erreur est survenue'); 
                } catch (e) { 
                    // Gérer l'erreur 404 renvoyée par le serveur backend (Cannot POST/GET /api/...)
                    if (errText.includes('Cannot POST') || errText.includes('<title>Error</title>') || errText.includes('Cannot GET')) {
                        console.error("Erreur de routage API détectée:", url, errText);
                        throw new Error("Erreur de routage API. Le serveur ne trouve pas l'endpoint spécifié (404/500).");
                    }
                    throw new Error(errText); 
                } 
            } 
            return res.status === 204 ? null : res.json(); 
        } catch (e) { 
            console.error(`API Error:`, e); 
            throw e; 
        } 
    };

    window.renderModal = (template) => { modalContainer.innerHTML = template; modalContainer.querySelector('.close-modal')?.addEventListener('click', () => modalContainer.innerHTML = ''); };
    window.getModalTemplate = (id, title, html) => { return `<div class="modal-overlay" id="${id}"><div class="modal-content"><button class="close-modal">&times;</button><h3>${title}</h3>${html}</div></div>`; };
    window.spinnerHtml = spinnerHtml;

    // Fonctions de dashboard exposées (Déclarées plus tard mais rendues globales ici)
    window.renderTeacherDashboard = renderTeacherDashboard;
    window.renderPlannerPage = renderPlannerPage;
    window.showGenerationModal = showGenerationModal;
    window.showAssignModal = showAssignModal;
    window.showEditModal = showEditModal;
    window.getAppreciationText = getAppreciationText;
    window.showCreateClassModal = showCreateClassModal;
    window.renderClassDetailsPage = renderClassDetailsPage;
    window.showValidationModal = showValidationModal;
    window.showValidatedResultModal = showValidatedResultModal;
    
    // **********************************************
    // FIN EXPOSITION
    // **********************************************


    function getSubjectInfo(title) {
        if (!title) return { name: 'Autre', cssClass: 'tag-autre' };
        const lowerTitle = title.toLowerCase();
        const subjects = {
            'Mathématiques': { cssClass: 'tag-maths', keywords: ['math', 'addition', 'soustraction', 'multiplication', 'division', 'calcul', 'géométrie', 'nombre', 'tables', 'problème', 'fraction'] },
            'Français': { cssClass: 'tag-francais', keywords: ['français', 'lecture', 'grammaire', 'conjugaison', 'orthographe', 'verbe', 'phrase', 'dictée', 'vocabulaire', 'rédaction', 'littérature'] },
            'Histoire-Géo': { cssClass: 'tag-histoire-géo', keywords: ['histoire', 'géographie', 'antiquité', 'moyen âge', 'révolution', 'guerre', 'empire', 'pays', 'capitale', 'continent'] },
            'Sciences': { cssClass: 'tag-sciences', keywords: ['science', 'svt', 'physique', 'chimie', 'vivant', 'atome', 'univers', 'biologie', 'technologie', 'corps humain', 'plante', 'animal'] },
        };
        for (const subjectName in subjects) { if (subjects[subjectName].keywords.some(keyword => lowerTitle.includes(keyword))) return { name: subjectName, cssClass: subjects[subjectName].cssClass }; }
        return { name: 'Autre', cssClass: 'tag-autre' };
    }

    function applyTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        const icon = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        if (themeToggleHeaderBtn) themeToggleHeaderBtn.innerHTML = icon;
        if (themeToggleDropdownBtn) themeToggleDropdownBtn.innerHTML = icon;
    }

    function toggleTheme() {
        const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    }

    function updateUI() {
        const loggedIn = !!currentUser;
        if (loginNavBtn) loginNavBtn.classList.toggle('hidden', loggedIn);
        if (themeToggleHeaderBtn) themeToggleHeaderBtn.classList.toggle('hidden', loggedIn);
        if (userMenuContainer) userMenuContainer.classList.toggle('hidden', !loggedIn);
        
        // Détection de l'univers actif
        const currentPath = document.querySelector('.page.active')?.id;
        const isAcademieActive = currentPath === 'academie-mre-page';
        // L'établissement est actif si on est sur le dashboard élève ou pages liées
        const isEtablissementActive = currentPath === 'student-dashboard-page' || currentPath === 'content-viewer-page' || currentPath === 'auth-page';

        // Styles de navigation et visibilité
        if (currentUser) {
            
            // Logique Élève
            if (currentUser.role === 'student') {
                // Cloisonnement : Masquer le lien Académie si dans l'espace Etablissement, et vice-versa
                if (academieMRELink) academieMRELink.classList.toggle('hidden', !loggedIn || isEtablissementActive);
                if (workspaceLink) workspaceLink.classList.toggle('hidden', !loggedIn || isAcademieActive);
                if (libraryLink) libraryLink.classList.add('hidden'); // Bibliothèque toujours cachée pour l'élève
            }
            
            // Logique Professeur
            if (currentUser.role === 'teacher') {
                if (academieMRELink) academieMRELink.classList.add('hidden');
                if (workspaceLink) workspaceLink.classList.add('hidden');
                if (libraryLink) libraryLink.classList.remove('hidden');
            }

        } else {
             // Non connecté: masquer tous les liens élèves/profs
            if (workspaceLink) workspaceLink.classList.add('hidden');
            if (academieMRELink) academieMRELink.classList.add('hidden');
            if (libraryLink) libraryLink.classList.add('hidden');
        }

        // Déplacer Admin Module dans le dropdown (géré par index.html)
        if (adminModuleLink) adminModuleLink.classList.toggle('hidden', currentUser?.role !== 'teacher');


        if (loggedIn) {
            if (userNameDisplay) userNameDisplay.textContent = currentUser.firstName;
            if (userAvatarDisplay) userAvatarDisplay.src = `${backendUrl}/avatars/${currentUser.avatar}`;
            
            // Logique de redirection après connexion ou rechargement
            if (currentUser.role === 'teacher') {
                renderTeacherDashboard();
            } else {
                const preferredUniverse = localStorage.getItem('preferredUniverse');
                localStorage.removeItem('preferredUniverse'); // Nettoyer après utilisation
                
                if (preferredUniverse === 'academie' && !isAcademieActive) {
                    loadAcademieMREModule();
                } else if (preferredUniverse === 'etablissement' && !isEtablissementActive) {
                    // Pour les élèves, l'univers Établissement est le dashboard
                    renderStudentDashboard();
                } else if (currentPath === 'auth-page') {
                    // Si on vient de l'auth page sans choix, on va au dashboard (par défaut établissement)
                    renderStudentDashboard();
                }
            }
        } else {
            changePage('home-page');
        }
    }
    
    function renderAuthPage() {
        const t = `<div class="card" style="max-width:400px;margin:2rem auto"><div id="login-form-container"><h3>Connexion</h3><form id="login-form"><div class=form-group><label for=login-email>Email</label><input type=email id=login-email required></div><div class=form-group><label for=login-password>Mot de passe</label><input type=password id=login-password required></div><button type=submit class="btn btn-main">Se connecter</button><p class=error-message id=login-error></p></form><p>Pas de compte ? <a href=# id=show-signup>Inscrivez-vous</a></p></div><div id=signup-form-container class=hidden><h3>Inscription</h3><form id=signup-form><div class=form-group><label for=signup-email>Email</label><input type=email id=signup-email required></div><div class=form-group><label for=signup-password>Mot de passe</label><input type=password id=signup-password required></div><div class=form-group><label for=signup-role>Je suis un(e)</label><select id=signup-role><option value=student>Élève</option><option value=teacher>Enseignant</option></select></div><button type=submit class="btn btn-main">S'inscrire</button><p class=error-message id=signup-error></p></form><p>Déjà un compte ? <a href=# id=show-login>Connectez-vous</a></p></div></div>`;
        document.getElementById('auth-page').innerHTML = t;
        document.getElementById('login-form').addEventListener('submit', handleLogin);
        document.getElementById('signup-form').addEventListener('submit', handleSignup);
        document.getElementById('show-signup').addEventListener('click', toggleAuthForms);
        document.getElementById('show-login').addEventListener('click', toggleAuthForms);
        changePage('auth-page');
    }

    async function handleLogin(e) { e.preventDefault(); try { const data = await apiRequest('/auth/login', 'POST', { email: document.getElementById('login-email').value, password: document.getElementById('login-password').value }); currentUser = data.user; localStorage.setItem('currentUser', JSON.stringify(currentUser)); updateUI(); } catch (err) { document.getElementById('login-error').textContent = err.message; } }
    async function handleSignup(e) { e.preventDefault(); try { const data = await apiRequest('/auth/signup', 'POST', { email: document.getElementById('signup-email').value, password: document.getElementById('signup-password').value, role: document.getElementById('signup-role').value }); currentUser = data.user; localStorage.setItem('currentUser', JSON.stringify(currentUser)); updateUI(); } catch (err) { document.getElementById('signup-error').textContent = err.message; } }
    function toggleAuthForms(e) { e.preventDefault(); document.getElementById('login-form-container').classList.toggle('hidden'); document.getElementById('signup-form-container').classList.toggle('hidden'); }
    
    function calculateCompletionRate(cls) {
        const studentCount = (cls.students || []).length;
        const contentCount = (cls.content || []).length;
        if (studentCount === 0 || contentCount === 0) return 0;
        const totalPossibleSubmissions = studentCount * contentCount;
        const submissionMap = new Map();
        (cls.results || []).forEach(result => {
            const key = `${result.studentEmail}-${result.contentId}`;
            submissionMap.set(key, true);
        });
        const actualSubmissions = submissionMap.size;
        return Math.round((actualSubmissions / totalPossibleSubmissions) * 100);
    }

    async function renderTeacherDashboard() {
        const p = document.getElementById('teacher-dashboard-page');
        p.innerHTML = `
            <div class="page-header">
                <h2>Bonjour ${currentUser.firstName}!</h2>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <button class="btn btn-secondary" id="open-planner-btn"><i class="fa-solid fa-calendar-days"></i> Planificateur de Cours</button>
                    <button class="btn btn-main" id="open-gen-modal"><i class="fa-solid fa-plus"></i> Nouveau Contenu</button> 
                    <button class="btn btn-secondary" id="open-class-modal"><i class="fa-solid fa-users"></i> Nouvelle Classe</button>
                </div>
            </div>
            <div id="class-grid" class="dashboard-grid">${spinnerHtml}</div>`;
        changePage('teacher-dashboard-page');
        p.querySelector('#open-class-modal').addEventListener('click', showCreateClassModal);
        // Les fonctions sont maintenant globales et accessibles
        p.querySelector('#open-gen-modal').addEventListener('click', () => showGenerationModal()); 
        p.querySelector('#open-planner-btn').addEventListener('click', renderPlannerPage); 

        teacherClasses = await apiRequest(`/teacher/classes?teacherEmail=${currentUser.email}`);
        
        if (currentUser.classOrder && Array.isArray(currentUser.classOrder)) {
            teacherClasses.sort((a, b) => {
                const indexA = currentUser.classOrder.indexOf(a.id);
                const indexB = currentUser.classOrder.indexOf(b.id);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
        }
        
        const grid = p.querySelector('#class-grid');
        grid.innerHTML = teacherClasses.length === 0 ? "<p>Aucune classe pour le moment. Créez-en une pour commencer !</p>" : "";
        
        const classCardsHtml = teacherClasses.map(c => {
            const completionRate = calculateCompletionRate(c);
            return `
            <div class="dashboard-card" data-class-id="${c.id}">
                <h4>${c.className}</h4>
                <p style="margin-top: 1rem;"><i class="fa-solid fa-users" style="margin-right: 8px; width: 20px;"></i> ${c.students.length} élève(s)</p>
                <p><i class="fa-solid fa-book-open" style="margin-right: 8px; width: 20px;"></i> ${(c.content || []).length} contenu(s) assigné(s)</p>
                <div style="margin-top: 1rem;">
                    <p style="font-size: 0.9rem; margin-bottom: 0.25rem;"><i class="fa-solid fa-check-double" style="margin-right: 8px; width: 20px;"></i> Taux de complétion</p>
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${completionRate}%;"></div>
                    </div>
                    <span style="font-weight: 600; font-size: 0.9rem;">${completionRate}%</span>
                </div>
            </div>`;
        }).join('');
        grid.innerHTML = classCardsHtml;

        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.dashboard-card');
            if (card && card.dataset.classId) {
                if (e.target.closest('button')) return;
                renderClassDetailsPage(card.dataset.classId);
            }
        });

        new Sortable(grid, {
            animation: 150,
            onEnd: async function (evt) {
                const orderedIds = Array.from(grid.children).map(card => card.dataset.classId);
                this.option('disabled', true);
                try {
                    const data = await apiRequest('/teacher/classes/reorder', 'POST', {
                        teacherEmail: currentUser.email,
                        classOrder: orderedIds
                    });
                    currentUser.classOrder = data.classOrder;
                } catch (error) {
                    alert("Erreur lors de la sauvegarde de l'ordre des classes.");
                    renderTeacherDashboard();
                } finally {
                    this.option('disabled', false);
                }
            }
        });
    }
    
    async function renderClassDetailsPage(id) {
        const page = document.getElementById('class-details-page');
        page.innerHTML = `<button id="back-to-teacher" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> Retour</button>${spinnerHtml}`;
        page.querySelector('#back-to-teacher').addEventListener('click', renderTeacherDashboard);
        changePage('class-details-page');
        currentClassData = await apiRequest(`/teacher/classes/${id}?teacherEmail=${currentUser.email}`);
        
        page.innerHTML = `
            <button id="back-to-teacher" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> Retour</button>
            <h2>${currentClassData.className}</h2>
            <div class="tabs">
                <button class="tab-button active" data-tab="students-panel">Élèves</button>
                <button class="tab-button" data-tab="contents-panel">Contenus</button>
                <button class="tab-button" data-tab="competencies-panel">Analyse par Compétence</button>
                <button class="tab-button" data-tab="corrections-panel">Corrections en attente <span id="pending-count" class="new-tag hidden"></span></button>
            </div>
            <div id="students-panel" class="tab-panel active">
                <div class="page-header" style="margin-bottom: 1.5rem;">
                    <h3>Élèves inscrits</h3>
                    <button id="open-add-student-modal-btn" class="btn btn-secondary"><i class="fa-solid fa-user-plus"></i> Ajouter un élève</button>
                </div>
                <div id="student-list" class="dashboard-grid"></div>
            </div>
            <div id="contents-panel" class="tab-panel"></div>
            <div id="competencies-panel" class="tab-panel">
                ${spinnerHtml}
            </div>
            <div id="corrections-panel" class="tab-panel"></div>`;
        
        renderStudentListPanel();
        renderContentListPanel();
        renderCorrectionsPanel();

        const pendingCorrections = (currentClassData.results || []).filter(r => r.status === 'pending_validation');
        const pendingCountSpan = page.querySelector('#pending-count');
        if (pendingCorrections.length > 0) {
            pendingCountSpan.textContent = pendingCorrections.length;
            pendingCountSpan.classList.remove('hidden');
        }
        
        page.querySelector('#back-to-teacher').addEventListener('click', renderTeacherDashboard);
        p.querySelector('#open-add-student-modal-btn').addEventListener('click', () => {
            renderModal(getModalTemplate('add-student-modal', 'Ajouter un élève', `
                <form id="add-student-form">
                    <div class="form-group">
                        <label for="student-email-input">Email de l'élève</label>
                        <input type="email" id="student-email-input" required>
                    </div>
                    <button type="submit" class="btn btn-main">Ajouter</button>
                    <p class="error-message" id="add-student-error"></p>
                </form>
            `));
            document.getElementById('add-student-form').addEventListener('submit', handleAddStudent);
        });

        page.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                page.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                page.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
                e.target.classList.add('active');
                const panelId = e.target.dataset.tab;
                document.getElementById(panelId).classList.add('active');

                if (panelId === 'competencies-panel') {
                    renderCompetencyReport(id);
                }
            });
        });
    }
    
    function renderContentListPanel() {
        const panel = document.getElementById('contents-panel');
        const contents = currentClassData.content || [];
        if (contents.length === 0) {
            panel.innerHTML = '<p>Aucun contenu assigné à cette classe pour le moment.</p>';
            return;
        }

        let html = '<div class="dashboard-grid">';
        contents.forEach(content => {
            const assignedDate = new Date(content.assignedAt).toLocaleDateString('fr-FR');
            html += `
                <div class="dashboard-card">
                    <div class="dashboard-card-title">
                         <h4>${content.title}</h4>
                         <div style="display: flex; gap: 0.5rem;">
                            <button class="btn-icon share-content-btn" data-content-id="${content.id}" title="Partager dans la bibliothèque"><i class="fa-solid fa-share-nodes"></i></button>
                            <button class="btn-icon delete-content-btn" data-content-id="${content.id}" title="Supprimer le contenu"><i class="fa-solid fa-trash-alt"></i></button>
                         </div>
                    </div>
                    <p>Type: ${content.type}</p>
                    <p>Assigné le: ${assignedDate}</p>
                </div>
            `;
        });
        html += '</div>';
        panel.innerHTML = html;

        panel.querySelectorAll('.delete-content-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const contentId = button.dataset.contentId;
                const content = contents.find(c => c.id === contentId);
                renderModal(getModalTemplate('delete-content-confirm', 'Confirmer la suppression', `
                    <p>Êtes-vous sûr de vouloir supprimer le contenu "<strong>${content.title}</strong>" ?</p>
                    <p>Cette action est irréversible et supprimera également tous les résultats des élèves pour ce devoir.</p>
                    <div style="display:flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
                        <button class="btn btn-secondary" id="cancel-delete">Annuler</button>
                        <button class="btn" style="background: var(--incorrect-color); color: white;" id="confirm-delete">Confirmer</button>
                    </div>
                `));
                document.getElementById('cancel-delete').addEventListener('click', () => modalContainer.innerHTML = '');
                document.getElementById('confirm-delete').addEventListener('click', () => handleDeleteContent(contentId));
            });
        });
        
        panel.querySelectorAll('.share-content-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const contentId = button.dataset.contentId;
                handlePublishContent(contentId);
            });
        });
    }
    
    async function handlePublishContent(contentId) {
        const content = currentClassData.content.find(c => c.id === contentId);
        if (!content) return;

        const subjectInfo = getSubjectInfo(content.title);
        
        renderModal(getModalTemplate('publish-confirm', 'Publier dans la bibliothèque', `
            <p>Vous êtes sur le point de partager "<strong>${content.title}</strong>" avec d'autres enseignants.</p>
            <p>Il sera publié dans la catégorie : <strong>${subjectInfo.name}</strong></p>
            <div style="display:flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
                <button class="btn btn-secondary" id="cancel-publish">Annuler</button>
                <button class="btn btn-main" id="confirm-publish">Confirmer et Publier</button>
            </div>
        `));
        
        document.getElementById('cancel-publish').addEventListener('click', () => modalContainer.innerHTML = '');
        document.getElementById('confirm-publish').addEventListener('click', async () => {
            try {
                await apiRequest('/library/publish', 'POST', {
                    contentData: content,
                    teacherName: currentUser.firstName,
                    subject: subjectInfo.name
                });
                modalContainer.innerHTML = '';
                renderModal(getModalTemplate('publish-success', 'Succès', '<p>Votre contenu a été publié avec succès !</p>'));
                setTimeout(() => modalContainer.innerHTML = '', 2000);
            } catch (error) {
                alert(`Erreur de publication: ${error.message}`);
            }
        });
    }

    async function handleDeleteContent(contentId) {
         try {
            await apiRequest(`/teacher/classes/${currentClassData.id}/content/${contentId}?teacherEmail=${currentUser.email}`, 'DELETE');
            modalContainer.innerHTML = '';
            renderClassDetailsPage(currentClassData.id); 
        } catch (error) {
            alert(`Erreur lors de la suppression du contenu: ${error.message}`);
        }
    }


    function renderCorrectionsPanel() {
        const panel = document.getElementById('corrections-panel');
        const pendingCorrections = (currentClassData.results || []).filter(r => r.status === 'pending_validation');

        if (pendingCorrections.length === 0) {
            panel.innerHTML = '<p>Aucun devoir à corriger pour le moment. Bravo !</p>';
            return;
        }

        let html = '<div class="dashboard-grid">';
        pendingCorrections.forEach(result => {
            const student = (currentClassData.studentsWithDetails || []).find(s => s.email === result.studentEmail);
            const studentName = student ? student.firstName : result.studentEmail;
            const submittedDate = new Date(result.submittedAt).toLocaleDateString('fr-FR');
            const resultString = JSON.stringify(result).replace(/"/g, '&quot;');
            html += `
                <div class="dashboard-card" data-result="${resultString}">
                    <h4>${result.title}</h4>
                    <p><strong>Élève :</strong> ${studentName}</p>
                    <p><strong>Soumis le :</strong> ${submittedDate}</p>
                    <div style="text-align: right; margin-top: 1rem;">
                        <button class="btn btn-secondary view-copy-btn">Voir la copie</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        panel.innerHTML = html;
        
        panel.querySelectorAll('.view-copy-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = e.target.closest('.dashboard-card');
                const resultData = JSON.parse(card.dataset.result);
                const content = (currentClassData.content || []).find(c => c.id === resultData.contentId);
                if(resultData && content) {
                    showValidationModal(resultData, content);
                }
            });
        });
    }
    
    function renderStudentListPanel() {
        let studentCardsHtml = (currentClassData.studentsWithDetails || []).map(student => {
            const studentResults = (currentClassData.results || []).filter(r => r.studentEmail === student.email);
            const assignedContentCount = (currentClassData.content || []).length;
            const completionRate = assignedContentCount > 0 ? (studentResults.length / assignedContentCount) * 100 : 0;
            return `<div class="dashboard-card" data-student-email="${student.email}">
                        <div class="dashboard-card-title">
                            <h4><img src="${backendUrl}/avatars/${student.avatar}" class="avatar"> ${student.firstName}</h4>
                            <button class="btn-icon delete-student-btn" data-student-email="${student.email}" title="Supprimer l'élève"><i class="fa-solid fa-trash-alt"></i></button>
                        </div>
                        <p>Taux de complétion: ${Math.round(completionRate)}%</p>
                        <p>${studentResults.length} / ${assignedContentCount} exercice(s) fait(s)</p>
                    </div>`;
        }).join('');
        
        const studentListContainer = document.getElementById('student-list');
        studentListContainer.innerHTML = (currentClassData.studentsWithDetails || []).length > 0 ? studentCardsHtml : "<p>Aucun élève dans cette classe pour le moment.</p>";
        
        studentListContainer.querySelectorAll('.dashboard-card').forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                if (e.target.closest('.delete-student-btn')) return;
                renderStudentDetailsPage(card.dataset.studentEmail);
            });
        });
        
        studentListContainer.querySelectorAll('.delete-student-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const studentEmail = button.dataset.studentEmail;
                const student = currentClassData.studentsWithDetails.find(s => s.email === studentEmail);
                renderModal(getModalTemplate('delete-student-confirm', 'Confirmer la suppression', `
                    <p>Êtes-vous sûr de vouloir supprimer <strong>${student.firstName} (${student.email})</strong> de cette classe ?</p>
                    <p>Cette action est irréversible et supprimera également tous ses résultats associés à cette classe.</p>
                    <div style="display:flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
                        <button class="btn btn-secondary" id="cancel-delete">Annuler</button>
                        <button class="btn" style="background: var(--incorrect-color); color: white;" id="confirm-delete">Confirmer la suppression</button>
                    </div>
                `));
                document.getElementById('cancel-delete').addEventListener('click', () => modalContainer.innerHTML = '');
                document.getElementById('confirm-delete').addEventListener('click', () => handleRemoveStudent(studentEmail));
            });
        });
    }

    async function handleRemoveStudent(studentEmail) {
        try {
            await apiRequest(`/teacher/classes/${currentClassData.id}/remove-student`, 'POST', { studentEmail, teacherEmail: currentUser.email });
            modalContainer.innerHTML = '';
            renderClassDetailsPage(currentClassData.id); 
        } catch (error) {
            alert(`Erreur lors de la suppression de l'élève: ${error.message}`);
        }
    }
    
    async function renderCompetencyReport(classId) {
        const panel = document.getElementById('competencies-panel');
        panel.innerHTML = spinnerHtml;
        try {
            const report = await apiRequest(`/teacher/classes/${classId}/competency-report?teacherEmail=${currentUser.email}`);
            if (report.length === 0) {
                panel.innerHTML = '<p>Aucun résultat pour analyser les compétences. Les élèves doivent d\'abord compléter des exercices.</p>';
                return;
            }
            
            let reportHtml = '<table><thead><tr><th>Compétence</th><th>Taux de réussite moyen</th></tr></thead><tbody>';
            report.forEach(item => {
                reportHtml += `<tr>
                    <td>${item.competence} <small>(${item.level})</small></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span>${item.averageScore}%</span>
                            <div class="progress-bar">
                                <div class="progress-bar-fill" style="width: ${item.averageScore}%;"></div>
                            </div>
                        </div>
                    </td>
                </tr>`;
            });
            reportHtml += '</tbody></table>';
            panel.innerHTML = reportHtml;

        } catch (error) {
            panel.innerHTML = '<p class="error-message">Impossible de charger le rapport.</p>';
        }
    }

    function renderStudentDetailsPage(studentEmail) {
        const page = document.getElementById('student-details-page');
        const student = currentClassData.studentsWithDetails.find(s => s.email === studentEmail);
        const studentResults = (currentClassData.results || []).filter(r => r.studentEmail === studentEmail);
        
        let resultsHtml = '';
        if (studentResults.length > 0) {
            const groupedResults = studentResults.reduce((acc, result) => {
                const content = (currentClassData.content || []).find(c => c.id === result.contentId);
                if (content) {
                    const subject = getSubjectInfo(content.title).name;
                    if (!acc[subject]) {
                        acc[subject] = [];
                    }
                    acc[subject].push(result);
                }
                return acc;
            }, {});

            for (const subject in groupedResults) {
                resultsHtml += `<h4 style="margin-top:1.5rem; margin-bottom:1rem; border-bottom: 2px solid var(--primary-color); padding-bottom:0.5rem;">${subject}</h4>`;
                resultsHtml += '<div class="dashboard-grid">';
                groupedResults[subject]
                    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                    .forEach(result => {
                        const content = (currentClassData.content || []).find(c => c.id === contentId);
                        if (content) {
                            let scoreHtml = '';
                            if (content.type === 'quiz') {
                                const scorePercentage = result.totalQuestions > 0 ? (result.score / result.totalQuestions) * 100 : 0;
                                scoreHtml = `
                                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                                    <strong>Score: ${result.score}/${result.totalQuestions}</strong>
                                    <div class="progress-bar">
                                        <div class="progress-bar-fill" style="width: ${scorePercentage}%;"></div>
                                    </div>
                                </div>`;
                            }
                            
                            const helpIcon = result.helpUsed ? `<i class="fa-solid fa-lightbulb" title="L'élève a demandé de l'aide pour ce devoir" style="font-size: 0.9rem; color: var(--warning-color); margin-left: 0.5rem;"></i>` : '';

                            resultsHtml += `
                                <div class="dashboard-card" style="cursor: default;">
                                    <h4>${result.title} ${helpIcon}</h4>
                                    <p style="margin-bottom: 1rem;">Terminé le: ${new Date(result.submittedAt).toLocaleDateString('fr-FR')}</p>
                                    ${scoreHtml}
                                    <button class="btn btn-secondary view-details" data-content-id="${result.contentId}">Voir les détails</button>
                                </div>`;
                        }
                    });
                resultsHtml += '</div>';
            }

        } else {
            resultsHtml = '<p>Aucun exercice terminé pour le moment.</p>';
        }

        page.innerHTML = `
            <button id="back-to-class-details" class="btn btn-secondary" style="margin-bottom: 2rem;"><i class="fa-solid fa-arrow-left"></i> Retour à la classe</button>
            <div class="card">
                <div class="page-header">
                    <h2><img src="${backendUrl}/avatars/${student.avatar}" class="avatar"> Profil de ${student.firstName}</h2>
                </div>
                <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Résultats des exercices terminés</h3>
                ${resultsHtml}
            </div>`;
        
        page.querySelector('#back-to-class-details').addEventListener('click', () => renderClassDetailsPage(currentClassData.id));
        page.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', (e) => {
                const contentId = e.target.closest('button').dataset.contentId;
                const result = studentResults.find(r => r.contentId === contentId);
                const content = (currentClassData.content || []).find(c => c.id === contentId);
                 if (result && content) {
                    if (result.status === 'validated') {
                        showValidatedResultModal(result, content);
                    } else {
                        showValidationModal(result, content);
                    }
                }
            });
        });

        changePage('student-details-page');
    }
    
    function showValidationModal(result, content) {
        let detailsHtml = '<h4>Réponses de l\'élève</h4>';
        if (content.type === 'quiz' && result.answers && Array.isArray(result.answers)) {
            content.questions.forEach((q, index) => {
                const studentAnswerIndex = result.answers[index];
                const correctAnswerIndex = q.correct_answer_index;
                const isCorrect = studentAnswerIndex === correctAnswerIndex;
                detailsHtml += `<div class="feedback-item ${isCorrect ? 'correct' : 'incorrect'}">
                                    <p><strong>Question ${index + 1}: ${q.question_text}</strong></p>
                                    <p>Réponse de l'élève : ${studentAnswerIndex > -1 ? q.options[studentAnswerIndex] : 'Aucune'}</p>
                                    ${!isCorrect ? `<p>Bonne réponse : ${q.options[correctAnswerIndex]}</p>` : ''}
                                </div>`;
            });
        } else if ((content.type === 'exercices' || content.type === 'dm') && result.answers && Array.isArray(result.answers)) {
            content.content.forEach((exo, index) => {
                const studentAnswer = result.answers[index] || "<i>Aucune réponse.</i>";
                detailsHtml += `
                    <div class="feedback-item">
                        <p><strong>Énoncé ${index + 1}:</strong> ${exo.enonce}</p>
                        <p><strong>Réponse :</strong></p>
                        <div class="student-answer-box">${studentAnswer.replace(/\n/g, '<br>')}</div>
                    </div>`;
            });
        } else {
             detailsHtml = `<p>Le détail des réponses n'est pas disponible pour ce type de devoir.</p>`;
        }

        const validationHtml = `
            <div class="validation-section">
                <h4>Valider la copie</h4>
                <form id="validation-form">
                    <div class="appreciation-grid">
                        <div class="appreciation-option">
                            <input type="radio" id="appreciation-acquis" name="appreciation" value="acquis" required>
                            <label for="appreciation-acquis">Acquis</label>
                        </div>
                        <div class="appreciation-option">
                            <input type="radio" id="appreciation-en_cours" name="appreciation" value="en_cours" required>
                            <label for="appreciation-en_cours">En cours d'acquisition</label>
                        </div>
                        <div class="appreciation-option">
                            <input type="radio" id="appreciation-non_acquis" name="appreciation" value="non_acquis" required>
                            <label for="appreciation-non-acquis">Non acquis</label>
                        </div>
                         <div class="appreciation-option">
                            <input type="radio" id="appreciation-a_revoir" name="appreciation" value="a_revoir" required>
                            <label for="appreciation-a_revoir">À revoir</label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="teacher-comment">Commentaire (optionnel)</label>
                        <textarea id="teacher-comment" rows="3"></textarea>
                    </div>
                    <button type="submit" class="btn btn-main">Valider la correction</button>
                </form>
            </div>
        `;

        renderModal(getModalTemplate('validation-modal', `Correction pour : ${result.title}`, detailsHtml + validationHtml));
        
        document.getElementById('validation-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const appreciation = document.querySelector('input[name="appreciation"]:checked').value;
            const comment = document.getElementById('teacher-comment').value;

            await apiRequest('/teacher/validate-result', 'POST', {
                classId: currentClassData.id,
                teacherEmail: currentUser.email,
                studentEmail: result.studentEmail,
                contentId: result.contentId,
                appreciation,
                comment
            });

            modalContainer.innerHTML = '';
            renderClassDetailsPage(currentClassData.id);
        });
    }
    
    function getAppreciationText(appreciationKey) {
        const map = {
            acquis: 'Acquis',
            en_cours: "En cours d'acquisition",
            non_acquis: 'Non acquis',
            a_revoir: 'À revoir'
        };
        return map[appreciationKey] || 'Validé';
    }

    function showValidatedResultModal(result, content) {
        let detailsHtml = '<h4>Détail des réponses</h4>';
        if (content.type === 'quiz' && result.answers && Array.isArray(result.answers)) {
            content.questions.forEach((q, index) => {
                const studentAnswerIndex = result.answers[index];
                const correctAnswerIndex = q.correct_answer_index;
                const isCorrect = studentAnswerIndex === correctAnswerIndex;
                detailsHtml += `<div class="feedback-item ${isCorrect ? 'correct' : 'incorrect'}">
                                    <p><strong>Question ${index + 1}: ${q.question_text}</strong></p>
                                    <p>Réponse de l'élève : ${studentAnswerIndex > -1 ? q.options[studentAnswerIndex] : 'Aucune'}</p>
                                    ${!isCorrect ? `<p>Bonne réponse : ${q.options[correctAnswerIndex]}</p>` : ''}
                                </div>`;
            });
        } else if ((content.type === 'exercices' || content.type === 'dm') && result.answers && Array.isArray(result.answers)) {
            content.content.forEach((exo, index) => {
                const studentAnswer = result.answers[index] || "<i>Aucune réponse.</i>";
                detailsHtml += `
                    <div class="feedback-item">
                        <p><strong>Énoncé ${index + 1}:</strong> ${exo.enonce}</p>
                        <p><strong>Réponse de l'élève :</strong></p>
                        <div class="student-answer-box">${studentAnswer.replace(/\n/g, '<br>')}</div>
                    </div>`;
            });
        } else {
             detailsHtml = `<p>Le détail des réponses n'est pas disponible pour ce devoir.</p>`;
        }

        let feedbackHtml = `
            <div class="validation-section">
                <h4>Retour du professeur</h4>
                <p><strong>Appréciation :</strong> ${getAppreciationText(result.appreciation)}</p>
                ${result.teacherComment ? `<p><strong>Commentaire :</strong> ${result.teacherComment}</p>` : ''}
            </div>
        `;
        
        renderModal(getModalTemplate('validated-result-modal', `Résultat pour : ${result.title}`, detailsHtml + feedbackHtml));
    }

    async function handleAddStudent(e) { 
        e.preventDefault(); 
        const email = document.getElementById('student-email-input').value; 
        const errP = document.getElementById('add-student-error'); 
        try { 
            if(errP) errP.textContent = ''; 
            await apiRequest(`/teacher/classes/${currentClassData.id}/add-student`, 'POST', { studentEmail: email, teacherEmail: currentUser.email });
            modalContainer.innerHTML = ''; 
            renderClassDetailsPage(currentClassData.id); 
        } catch (err) { 
            if(errP) err.textContent = err.message; 
        } 
    }
    function showCreateClassModal() { renderModal(getModalTemplate('create-class-modal', 'Nouvelle Classe', `<form id=create-class-form><div class=form-group><label for=class-name-input>Nom</label><input type=text id=class-name-input required></div><button type=submit class="btn btn-main">Créer</button></form>`)); document.getElementById('create-class-form').addEventListener('submit', async e => { e.preventDefault(); await apiRequest('/teacher/classes', 'POST', { className: document.getElementById('class-name-input').value, teacherEmail: currentUser.email }); modalContainer.innerHTML = ''; renderTeacherDashboard(); }); }
    
    async function renderStudentDashboard() {
        const page = document.getElementById('student-dashboard-page');
        page.innerHTML = spinnerHtml;
        changePage('student-dashboard-page');
        
        try {
            studentDashboardData = await apiRequest(`/student/dashboard?studentEmail=${currentUser.email}`);
            
            let todoHtml = '<h3>À faire</h3>';
            if (studentDashboardData.todo.length === 0) {
                todoHtml += "<p>Bravo, tu es à jour !</p>";
            } else {
                todoHtml += '<div class="dashboard-grid">';
                studentDashboardData.todo.forEach(item => {
                    todoHtml += createStudentCard(item, 'todo');
                });
                todoHtml += '</div>';
            }

            let pendingHtml = '<h3 style="margin-top: 2rem;">En attente de validation</h3>';
            if (studentDashboardData.pending.length === 0) {
                pendingHtml += "<p>Aucun devoir en attente de correction.</p>";
            } else {
                pendingHtml += '<div class="dashboard-grid">';
                studentDashboardData.pending.forEach(item => {
                    todoHtml += createStudentCard(item, 'pending');
                });
                pendingHtml += '</div>';
            }

            let completedHtml = `
                <div class="page-header" style="margin-top: 2rem;">
                    <h3>Archives</h3>
                    <div id="archive-filters">
                        <button class="btn btn-secondary active" data-filter="all">Tout</button>
                        <button class="btn btn-secondary" data-filter="month">Ce mois-ci</button>
                        <button class="btn btn-secondary" data-filter="week">Cette semaine</button>
                    </div>
                </div>
                <div id="student-completed-list"></div>`;

            // AJOUT DU LIEN PLAYGROUND/ESPACE DE TRAVAIL (Intégré au dashboard élève)
            const workspaceCard = `<div class="dashboard-card" style="cursor: pointer; border-top: 4px solid var(--secondary-color);" onclick="window.open('playground.html', '_blank')">
                                        <h4><i class="fa-solid fa-chalkboard-user"></i> Espace de Travail Libre</h4>
                                        <p>Accède à AIDA pour des discussions, des brainstormings ou l'analyse de documents.</p>
                                        <p style="text-align: right; margin-top: 1rem;"><button class="btn btn-secondary">Ouvrir</button></p>
                                    </div>`;

            page.innerHTML = `<h2>Bonjour ${currentUser.firstName}!</h2>
                            <h3 style="margin-bottom: 1rem;">Ton Espace</h3>
                            <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-bottom: 2rem;">
                                ${workspaceCard}
                            </div>
                            ${todoHtml}${pendingHtml}${completedHtml}`;
            
            renderFilteredArchives('all'); 
            
            page.querySelectorAll('#archive-filters').forEach(button => {
                button.addEventListener('click', (e) => {
                    if (e.target.tagName === 'BUTTON') {
                        page.querySelectorAll('#archive-filters button').forEach(btn => btn.classList.remove('active'));
                        e.target.classList.add('active');
                        renderFilteredArchives(e.target.dataset.filter);
                    }
                });
            });

            page.querySelectorAll('.start-btn').forEach(button => {
                 button.addEventListener('click', (e) => {
                    const content = studentDashboardData.todo.find(item => item.id === e.target.dataset.contentId);
                    if (content) renderContentViewer(content);
                });
            });

             page.querySelectorAll('.view-correction-btn').forEach(button => {
                 button.addEventListener('click', (e) => {
                    const contentId = e.target.dataset.contentId;
                    const content = studentDashboardData.completed.find(item => item.id === contentId);
                    if(content) showValidatedResultModal(content, content);
                });
            });

        } catch (error) {
            page.innerHTML = `<p class="error-message">Impossible de charger le tableau de bord.</p>`;
        }
    }
    
    function renderFilteredArchives(filter) {
        const container = document.getElementById('student-completed-list');
        if (!studentDashboardData || !studentDashboardData.completed || studentDashboardData.completed.length === 0) {
            container.innerHTML = "<p>Aucun devoir terminé pour le moment.</p>";
            return;
        }
        
        const now = new Date();
        const filteredItems = studentDashboardData.completed.filter(item => {
            const completedDate = new Date(item.completedAt);
            if (filter === 'week') {
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); 
                startOfWeek.setHours(0,0,0,0);
                return completedDate >= startOfWeek;
            }
            if (filter === 'month') {
                return completedDate.getFullYear() === now.getFullYear() && completedDate.getMonth() === now.getMonth();
            }
            return true; 
        });

        if (filteredItems.length === 0) {
            container.innerHTML = "<p>Aucun exercice terminé pour cette période.</p>";
            return;
        }

        const groupedBySubject = filteredItems.reduce((acc, item) => {
            const subject = getSubjectInfo(item.title).name;
            if (!acc[subject]) acc[subject] = [];
            acc[subject].push(item);
            return acc;
        }, {});

        let completedHtml = '';
        for (const subject in groupedBySubject) {
            completedHtml += `<h4 style="margin-top:1.5rem; margin-bottom:1rem; border-bottom: 2px solid var(--primary-color); padding-bottom:0.5rem;">${subject}</h4>`;
            completedHtml += '<div class="dashboard-grid">';
            groupedBySubject[subject]
                .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                .forEach(item => {
                    completedHtml += createStudentCard(item, 'completed');
                });
            completedHtml += '</div>';
        }
        container.innerHTML = completedHtml;
        
        container.querySelectorAll('.view-correction-btn').forEach(button => {
             button.addEventListener('click', (e) => {
                const contentId = e.target.dataset.contentId;
                const content = studentDashboardData.completed.find(item => item.id === contentId);
                if(content) showValidatedResultModal(content, content);
            });
        });
    }


    function createStudentCard(c, status) {
        const subjectInfo = getSubjectInfo(c.title);
        let dateInfoHtml = '';
        let buttonHtml = '';

        switch(status) {
            case 'todo':
                const dueDate = new Date(c.dueDate);
                const today = new Date(); today.setHours(0,0,0,0);
                const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
                let statusClass = 'status-ontime';
                let statusText = `À faire pour le ${dueDate.toLocaleDateString('fr-FR')}`;
                if (dueDate < today) {
                    statusClass = 'status-overdue';
                    statusText = `En retard (pour le ${dueDate.toLocaleDateString('fr-FR')})`;
                } else if (dueDate <= tomorrow) {
                    statusClass = 'status-due-soon';
                    statusText = `À rendre bientôt`;
                }
                dateInfoHtml = `<span class="deadline-status ${statusClass}">${statusText}</span>`;
                buttonHtml = `<button class="btn btn-main start-btn" data-content-id="${c.id}">Commencer</button>`;
                break;
            case 'pending':
                dateInfoHtml = `<span class="deadline-status status-pending">En attente de correction</span>`;
                buttonHtml = `<button class="btn btn-secondary" disabled>En attente</button>`;
                break;
            case 'completed':
                const appreciationText = c.appreciation ? getAppreciationText(c.appreciation) : 'Validé';
                dateInfoHtml = `<span class="deadline-status status-completed">${appreciationText}</span>`;
                buttonHtml = `<button class="btn btn-secondary view-correction-btn" data-content-id="${c.id}">Voir la correction</button>`;
                break;
        }

        return `
            <div class="dashboard-card-student">
                <div class="card-header">
                    <span class="subject-tag ${subjectInfo.cssClass}">${c.type.charAt(0).toUpperCase() + c.type.slice(1)}</span>
                    ${dateInfoHtml}
                </div>
                <div class="card-content">
                    <h4>${c.title}</h4>
                    <p>Classe: ${c.className}</p>
                </div>
                <div class="card-footer">
                    ${buttonHtml}
                </div>
            </div>`;
    }
    
    // Fonction générique pour afficher la modal d'aide d'AIDA (disponible globalement)
    window.showAidaHelpModal = async (prompt, apiEndpoint = '/ai/get-aida-help') => { // NOTE: endpoint SANS /api/
        renderModal(getModalTemplate('aida-help-modal', 'Aide d\'AIDA', `
            <div id="aida-chat-container">
                <div class="chat-message aida-message">
                    <p>Bonjour ! Pose-moi ta question ou donne-moi le sujet de l'exercice pour obtenir de l'aide sans la réponse.</p>
                </div>
                <div id="chat-history"></div>
                <form id="aida-chat-form" style="margin-top: 1rem;">
                    <textarea id="aida-chat-input" placeholder="Tape ta question ici..." rows="2" required>${prompt ? prompt : ''}</textarea>
                    <button type="submit" class="btn btn-main"><i class="fa-solid fa-paper-plane"></i> Envoyer</button>
                </form>
                <div id="aida-error" class="error-message"></div>
                <div id="aida-spinner" class="hidden" style="text-align: right; margin-top: 0.5rem;">${spinnerHtml}</div>
            </div>
        `));

        const chatForm = document.getElementById('aida-chat-form');
        const chatInput = document.getElementById('aida-chat-input');
        const chatHistory = document.getElementById('chat-history');
        const spinner = document.getElementById('aida-spinner');
        const errorDiv = document.getElementById('aida-error');
        
        const history = [];

        const appendMessage = (sender, text) => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${sender}-message`;
            msgDiv.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
            chatHistory.appendChild(msgDiv);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        };
        
        const sendMessage = async (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message) return;

            appendMessage('user', message);
            chatInput.value = '';
            spinner.classList.remove('hidden');
            errorDiv.textContent = '';
            
            history.push({ role: 'user', content: message });

            try {
                // Utilisation de l'endpoint dynamique (soit /ai/get-aida-help, soit /academie-mre/aida-chat)
                const response = await apiRequest(apiEndpoint, 'POST', { history: history });
                
                const aidaResponse = response.response;
                appendMessage('aida', aidaResponse);
                history.push({ role: 'assistant', content: aidaResponse });

            } catch (err) {
                errorDiv.textContent = 'Erreur: Aide indisponible.';
                history.pop(); 
            } finally {
                spinner.classList.add('hidden');
            }
        };

        chatForm.addEventListener('submit', sendMessage);
        
        if (prompt) {
            // Soumet le prompt initial sans attendre l'entrée de l'utilisateur
            sendMessage({ preventDefault: () => {}, target: chatForm });
        }
    };


    function renderContentViewer(c) {
        const p = document.getElementById('content-viewer-page');
        if (c.isEvaluated) {
            sessionStorage.setItem('isEvaluatedSession', 'true');
        } else {
            sessionStorage.removeItem('isEvaluatedSession');
        }
        
        helpUsedInQuiz = false;
        helpUsedInHomework = false;

        let html = '';
        let footerHtml = '';
        const isInteractiveHomework = c.type === 'exercices' || c.type === 'dm';

        if (c.type === 'quiz') {
             c.questions.forEach((q, i) => {
                html += `<div class="quiz-question">
                            <div class="question-header">
                                <p><strong>${q.question_text}</strong></p>
                                <button type="button" class="btn-help" data-question="${q.question_text}"><i class="fa-solid fa-lightbulb"></i> Aide</button>
                            </div>
                            <div class="quiz-options-grid">${q.options.map((o, j) => `
                                <label class="quiz-option">
                                    <input type="radio" name="q${i}" value="${j}" required>
                                    <div class="option-label">${o}</div>
                                </label>`).join('')}
                            </div>
                        </div>`;
            });
            footerHtml = `<button type="submit" class="btn btn-main">Valider mes réponses</button>`;
        } else if (isInteractiveHomework) {
            c.content.forEach((exo, i) => {
                html += `
                    <div class="exercice-block">
                        <h4>Exercice ${i + 1}</h4>
                        <p class="enonce">${exo.enonce}</p>
                        <textarea class="reponse-eleve" data-exercice-index="${i}" placeholder="Rédige ta réponse ici..."></textarea>
                    </div>
                `;
            });
            if (c.isEvaluated) {
                 footerHtml += `<button type="button" id="open-aida-help-btn" class="btn btn-secondary"><i class="fa-solid fa-lightbulb"></i> Obtenir de l'aide</button>`;
            }
            footerHtml += `<button type="submit" class="btn btn-main">Soumettre le devoir</button>`;
        } else { // Fiche de révision ou autre
            html = `<div class="revision-content">${c.content.replace(/\n/g, '<br>')}</div>`;
            footerHtml = `<button type="button" id="finish-exercise-btn" class="btn btn-main"><i class="fa-solid fa-check"></i> Marquer comme lu</button>`;
        }

        p.innerHTML = `<button id="back-to-student" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> Retour</button>
                         <div class="card" style="margin-top:1rem;">
                            <h2>${c.title}</h2>
                            <form id="content-form">
                                <div>${html}</div>
                                <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">${footerHtml}</div>
                            </form>
                         </div>`;
        
        const backBtn = p.querySelector('#back-to-student');
        backBtn.addEventListener('click', () => {
            sessionStorage.removeItem('isEvaluatedSession');
            renderStudentDashboard();
        });

        const form = p.querySelector('#content-form');

        if (c.type === 'quiz') {
            form.addEventListener('submit', e => { e.preventDefault(); handleSubmitQuiz(c); });
            form.querySelectorAll('.btn-help').forEach(b => b.addEventListener('click', handleHelpRequest));
        } else if (isInteractiveHomework) {
            form.addEventListener('submit', e => { e.preventDefault(); handleSubmitNonQuiz(c); });
            const aidaHelpBtn = p.querySelector('#open-aida-help-btn');
            if (aidaHelpBtn) {
                aidaHelpBtn.addEventListener('click', () => {
                    helpUsedInHomework = true;
                    // Utilise l'endpoint par défaut pour les devoirs classiques
                    showAidaHelpModal(`Aide pour le devoir : ${c.title}`); 
                });
            }
        } else {
            const finishBtn = p.querySelector('#finish-exercise-btn');
            if (finishBtn) {
                finishBtn.addEventListener('click', async () => {
                    sessionStorage.removeItem('isEvaluatedSession');
                    await apiRequest('/student/submit-quiz', 'POST', { 
                        studentEmail: currentUser.email, classId: c.classId, contentId: c.id, 
                        title: c.title, score: 0, totalQuestions: 0, answers: [], helpUsed: false, teacherEmail: c.teacherEmail
                    });
                    renderStudentDashboard();
                });
            }
        }
        changePage('content-viewer-page');
    }

    async function handleHelpRequest(e) { 
        e.preventDefault(); 
        helpUsedInQuiz = true;
        const q = e.target.closest('button').dataset.question; 
        
        // Utilisation de la modal d'aide générale (utilise l'endpoint par défaut)
        showAidaHelpModal(q);
    }

    async function handleSubmitQuiz(c) { 
        sessionStorage.removeItem('isEvaluatedSession');
        const answers = c.questions.map((q, i) => { const sel = document.querySelector(`input[name=q${i}]:checked`); return sel ? parseInt(sel.value) : -1; }); 
        const score = answers.reduce((acc, ans, i) => acc + (ans == c.questions[i].correct_answer_index ? 1 : 0), 0); 
        await apiRequest('/student/submit-quiz', 'POST', { 
            studentEmail: currentUser.email, classId: c.classId, contentId: c.id, title: c.title, 
            score, totalQuestions: c.questions.length, answers, helpUsed: helpUsedInQuiz, teacherEmail: c.teacherEmail
        }); 
        renderStudentDashboard();
    }
    
    async function handleSubmitNonQuiz(c) {
        sessionStorage.removeItem('isEvaluatedSession');
        const answerTextareas = document.querySelectorAll('#content-form .reponse-eleve');
        const answers = Array.from(answerTextareas).map(textarea => textarea.value);

        if (answers.every(answer => answer.trim() === '')) {
            alert("Veuillez répondre à au moins un exercice avant de soumettre.");
            return;
        }

        await apiRequest('/student/submit-quiz', 'POST', {
            studentEmail: currentUser.email, classId: c.classId, contentId: c.id, title: c.title,
            score: 0, totalQuestions: c.content.length, answers: answers, 
            helpUsed: helpUsedInHomework, 
            teacherEmail: c.teacherEmail
        });
        renderStudentDashboard();
    }
    
    // NOUVELLE FONCTION DE CHARGEMENT DYNAMIQUE (LAZY LOADING)
    function loadAcademieMREModule() {
        const pageId = 'academie-mre-page';
        const page = document.getElementById(pageId);
        
        // 1. Vérifie si le module est déjà chargé
        if (page.dataset.loaded === 'true') {
            changePage(pageId);
            return;
        }
    
        // 2. Affiche un état de chargement et change de page
        page.innerHTML = `<div style="text-align:center; padding: 5rem;">${spinnerHtml}<p style="margin-top:1rem;">Chargement de l'Académie MRE...</p></div>`;
        changePage(pageId);
        
        // 3. Charge dynamiquement le script et les styles
        Promise.all([
            // Charger le JS
            new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'modules/academie-mre.js'; 
                script.onload = () => {
                    page.dataset.loaded = 'true';
                    if (window.initAcademieMRE) {
                        // Lorsque le module est chargé, on appelle son initialisation puis on met à jour l'UI pour le cloisonnement
                        window.initAcademieMRE(); 
                        updateUI(); 
                        resolve();
                    } else {
                        reject(new Error("initAcademieMRE non défini."));
                    }
                };
                script.onerror = (e) => {
                    console.error("Erreur de chargement du script modules/academie-mre.js:", e);
                    reject(new Error("Le fichier modules/academie-mre.js n'a pas été trouvé (404). Vérifiez le déploiement."));
                };
                document.head.appendChild(script);
            }),
            // Charger le CSS (si non déjà chargé)
            new Promise((resolve) => {
                const cssPath = 'modules/academie-mre.css';
                if (document.querySelector(`link[href="${cssPath}"]`)) {
                    return resolve();
                }
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = cssPath;
                link.onload = resolve;
                link.onerror = (e) => {
                    console.warn(`Avertissement : Le fichier CSS ${cssPath} n'a pas été trouvé (404), mais l'application continue.`, e);
                    resolve();
                };
                document.head.appendChild(link);
            })
        ]).catch(err => {
            page.innerHTML = `<p class="error-message">Erreur critique lors du chargement du module Académie MRE: ${err.message}</p>`;
            console.error(err);
        });
    }
    
    
    async function renderLibraryPage() {
        const page = document.getElementById('library-page');
        changePage('library-page');
        page.innerHTML = `
            <div class="page-header">
                <h2><i class="fa-solid fa-book-bookmark"></i> Bibliothèque de Contenus</h2>
            </div>
            <form id="library-search-form" style="display:flex; gap:1rem; margin-bottom: 2rem;">
                <input type="text" id="library-search-input" placeholder="Rechercher par titre...">
                <select id="library-subject-filter">
                    <option value="">Toutes les matières</option>
                    <option>Mathématiques</option>
                    <option>Français</option>
                    <option>Histoire-Géo</option>
                    <option>Sciences</option>
                    <option>Autre</option>
                </select>
                <button type="submit" class="btn btn-main">Rechercher</button>
            </form>
            <div id="library-grid" class="dashboard-grid">${spinnerHtml}</div>
        `;
        const searchForm = document.getElementById('library-search-form');
        searchForm.addEventListener('submit', e => {
            e.preventDefault();
            loadLibraryContents();
        });

        loadLibraryContents();
    }
    
    async function loadLibraryContents() {
        const grid = document.getElementById('library-grid');
        grid.innerHTML = spinnerHtml;
        const searchTerm = document.getElementById('library-search-input').value;
        const subject = document.getElementById('library-subject-filter').value;
        
        try {
            const results = await apiRequest('/library?searchTerm=${searchTerm}&subject=${subject}');
            grid.innerHTML = '';
            if (results.length === 0) {
                grid.innerHTML = '<p>Aucun contenu trouvé. Essayez d\'autres mots-clés ou partagez le vôtre !</p>';
                return;
            }
            results.forEach(content => {
                const subjectInfo = getSubjectInfo(content.title);
                const card = document.createElement('div');
                card.className = 'dashboard-card';
                const contentString = JSON.stringify(content).replace(/"/g, '&quot;');
                card.innerHTML = `
                    <div class="dashboard-card-title"><h4>${content.title}</h4></div>
                    <p><span class="subject-tag ${subjectInfo.cssClass}">${subjectInfo.name}</span></p>
                    <p>Type: ${content.type}</p>
                    <p>Auteur: ${content.authorName}</p>
                    <div style="text-align:right; margin-top: 1rem;">
                       <button class="btn btn-secondary import-content-btn" data-content="${contentString}">Ajouter à une classe</button>
                    </div>
                `;
                grid.appendChild(card);
            });
            
            grid.querySelectorAll('.import-content-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const contentData = JSON.parse(e.target.dataset.content);
                    showAssignModal(contentData);
                });
            });

        } catch(error) {
            grid.innerHTML = '<p class="error-message">Impossible de charger la bibliothèque.</p>';
        }
    }
    
    async function init() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
        }

        if (window.location.hash === '#login' && !currentUser) {
            renderAuthPage();
            return;
        }
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
        await loadProgrammes();
        updateUI();
    }
    
    // GESTION DES ÉCOUTEURS GLOBALS (après DOMContentLoaded)
    
    // Le bouton de Connexion est toujours présent
    if (loginNavBtn) loginNavBtn.addEventListener('click', renderAuthPage);
    
    // GESTION DES BOUTONS DE LA PAGE D'ACCUEIL (startEtablissementBtn et startAcademieBtn)
    if (startEtablissementBtn) {
        startEtablissementBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentUser) {
                renderStudentDashboard(); 
            } else {
                localStorage.setItem('preferredUniverse', 'etablissement'); // Mémoriser le choix
                renderAuthPage(); 
            }
        });
    }

    if (startAcademieBtn) {
        startAcademieBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentUser) {
                loadAcademieMREModule(); 
            } else {
                localStorage.setItem('preferredUniverse', 'academie'); // Mémoriser le choix
                renderAuthPage();
            }
        });
    }
    
    // CORRECTION NAVIGATION ACCUEIL: Si l'utilisateur clique sur Accueil/Logo, il va à la page de choix.
    if (homeLink) {
        homeLink.addEventListener('click', (e) => { 
            e.preventDefault();
            // L'utilisateur doit choisir son univers s'il est un élève
            if (currentUser && currentUser.role === 'student') {
                changePage('home-page'); 
            } else if (currentUser && currentUser.role === 'teacher') {
                 renderTeacherDashboard(); // Les profs reviennent à leur dashboard
            } else {
                 changePage('home-page');
            }
        }); 
    }


    // CORRECTION NAVIGATION ESPACE DE TRAVAIL: Renvoie vers le dashboard élève standard
    if (workspaceLink) {
        workspaceLink.addEventListener('click', (e) => {
            e.preventDefault();
            renderStudentDashboard();
        });
    }

    // Bibliothèque et Académie MRE
    if (libraryLink) libraryLink.addEventListener('click', (e) => { e.preventDefault(); renderLibraryPage(); });
    if (academieMRELink) academieMRELink.addEventListener('click', (e) => { 
        e.preventDefault(); 
        loadAcademieMREModule(); 
    });

    // Déplacer Admin Module dans le dropdown (géré par index.html)
    if (adminModuleLink) {
         adminModuleLink.addEventListener('click', (e) => { 
             e.preventDefault(); 
             renderTeacherDashboard();
             if (userDropdown) userDropdown.classList.add('hidden'); // Fermer le menu après action
        });
    }


    if (logoutBtn) logoutBtn.addEventListener('click', () => { 
        currentUser = null; 
        localStorage.removeItem('currentUser');
        updateUI(); 
    });
    if (userInfoClickable) userInfoClickable.addEventListener('click', () => userDropdown.classList.toggle('hidden'));
    window.addEventListener('click', (e) => {
        if (userMenuContainer && !userMenuContainer.contains(e.target)) {
            userDropdown.classList.add('hidden');
        }
    });
    
    if (themeToggleHeaderBtn) themeToggleHeaderBtn.addEventListener('click', toggleTheme);
    if (themeToggleDropdownBtn) themeToggleDropdownBtn.addEventListener('click', toggleTheme);


    const wrapper = document.querySelector('#intro-animation-wrapper');
    const finalWrapper = document.querySelector('#aida-final-text');
    if (wrapper && finalWrapper) {
        setTimeout(() => {
            wrapper.style.display = 'none';
            finalWrapper.style.display = 'flex';
        }, 10000); 
    }
    
    init();
});

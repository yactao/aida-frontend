// src/aida_education.js - Logique complète de l'environnement AIDA Éducation
// VERSION DE CACHE : V2 (pour forcer le rechargement)

import { 
    apiRequest, 
    changePage, 
    renderModal, 
    getModalTemplate, 
    spinnerHtml, 
    getSubjectInfo, 
    getAppreciationText,
    showAidaHelpModal
} from './utils.js';
import { updateUI } from './ui_utils.js';

// --- Variables d'État Locales ---
let teacherClasses = [];
let generatedContent = null;
let currentClassData = null;
let selectedCompetenceInfo = null;
let studentDashboardData = null;
let helpUsedInQuiz = false;
let helpUsedInHomework = false;

// --- UTILS internes (Déplacées de l'ancien script.js) ---

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

function resetSelects(selects) { 
    selects.forEach(s => { s.innerHTML = '<option value="">-- Choisir --</option>'; s.disabled = true; }); 
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) generateBtn.disabled = true; 
}


// --- 1. FONCTIONS ENSEIGNANT (Dashboard, Classes, Corrections, Génération) ---
export async function renderTeacherDashboard() {
    const p = document.getElementById('teacher-dashboard-page');
    
    // Utilise i18next.t() pour le message d'accueil dynamique
    const greeting = i18next.t('teacherDashboard.greeting', { name: window.currentUser.firstName });

    p.innerHTML = `
        <div class="page-header">
            <h2>${greeting}</h2>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <button class="btn btn-secondary" id="open-planner-btn" data-i18n="teacherDashboard.plannerButton"><i class="fa-solid fa-calendar-days"></i> Planificateur de Cours</button>
                <button class="btn btn-main" id="open-gen-modal" data-i18n="teacherDashboard.newContentButton"><i class="fa-solid fa-plus"></i> Nouveau Contenu</button> 
                <button class="btn btn-secondary" id="open-class-modal" data-i18n="teacherDashboard.newClassButton"><i class="fa-solid fa-users"></i> Nouvelle Classe</button>
            </div>
        </div>
        <div id="class-grid" class="dashboard-grid">${spinnerHtml}</div>`;
    changePage('teacher-dashboard-page');
    
    p.querySelector('#open-class-modal').addEventListener('click', showCreateClassModal);
    p.querySelector('#open-gen-modal').addEventListener('click', () => showGenerationModal());
    p.querySelector('#open-planner-btn').addEventListener('click', renderPlannerPage);

    // NOUVEAU : Applique les traductions aux boutons statiques
    const elements = p.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        // Vérifie si l'élément n'est pas le conteneur dupliqué (problème potentiel de récursivité)
        if (el.id !== 'class-grid' && !el.closest('#class-grid')) {
             el.innerHTML = i18next.t(key) || el.innerHTML;
        }
    });

    try {
        teacherClasses = await apiRequest(`/teacher/classes?teacherEmail=${window.currentUser.email}`);
        
        if (window.currentUser.classOrder && Array.isArray(window.currentUser.classOrder)) {
            teacherClasses.sort((a, b) => {
                const indexA = window.currentUser.classOrder.indexOf(a.id);
                const indexB = window.currentUser.classOrder.indexOf(b.id);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
        }
        
        const grid = p.querySelector('#class-grid');
        // Utilise i18next.t() pour le message "Aucune classe"
        grid.innerHTML = teacherClasses.length === 0 ? `<p>${i18next.t('teacherDashboard.noClasses')}</p>` : "";
        
        const classCardsHtml = teacherClasses.map(c => {
            const completionRate = calculateCompletionRate(c);
            
            // CORRECTION : Utilise la clé de base (ex: 'studentsCount')
            // i18next choisira automatiquement '_one' ou '_other'
            const studentString = i18next.t('teacherDashboard.studentsCount', { count: c.students.length });
            const contentString = i18next.t('teacherDashboard.contentCount', { count: (c.content || []).length });
            const completionString = i18next.t('teacherDashboard.completionRate');

            return `
            <div class="dashboard-card" data-class-id="${c.id}">
                <h4>${c.className}</h4>
                <p style="margin-top: 1rem;"><i class="fa-solid fa-users" style="margin-right: 8px; width: 20px;"></i> ${studentString}</p>
                <p><i class="fa-solid fa-book-open" style="margin-right: 8px; width: 20px;"></i> ${contentString}</p>
                <div style="margin-top: 1rem;">
                    <p style="font-size: 0.9rem; margin-bottom: 0.25rem;"><i class="fa-solid fa-check-double" style="margin-right: 8px; width: 20px;"></i> ${completionString}</p>
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${completionRate}%;"></div>
                    </div>
                    <span style="font-weight: 600; font-size: 0.9rem;">${completionRate}%</span>
                </div>
            </div>`;
        }).join('');
        
        // Injecte le HTML
        grid.innerHTML = classCardsHtml;

        // Le listener est ajouté APRES l'injection du HTML, ce qui corrige le bug de clic
        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.dashboard-card');
            if (card && card.dataset.classId) {
                if (e.target.closest('button')) return;
                renderClassDetailsPage(card.dataset.classId);
            }
        });

        if (typeof Sortable !== 'undefined') {
             new Sortable(grid, {
                animation: 150,
                onEnd: async function (evt) {
                    const orderedIds = Array.from(grid.children).map(card => card.dataset.classId);
                    this.option('disabled', true);
                    try {
                        const data = await apiRequest('/teacher/classes/reorder', 'POST', {
                            teacherEmail: window.currentUser.email,
                            classOrder: orderedIds
                        });
                        window.currentUser.classOrder = data.classOrder;
                    } catch (error) {
                        alert("Erreur lors de la sauvegarde de l'ordre des classes.");
                        renderTeacherDashboard();
                    } finally {
                        this.option('disabled', false);
                    }
                }
            });
        }

    } catch (error) {
        p.querySelector('#class-grid').innerHTML = `<p class="error-message">Impossible de charger le tableau de bord: ${error.message}</p>`;
    }
}
async function showCreateClassModal() { 
    // MODIFIÉ : Récupère les traductions avant de générer le HTML
    const title = i18next.t('createClassModal.title');
    const label = i18next.t('createClassModal.label');
    const button = i18next.t('createClassModal.button');

    renderModal(getModalTemplate('create-class-modal', title, 
        `<form id="create-class-form">
            <div class="form-group">
                <label for="class-name-input">${label}</label>
                <input type="text" id="class-name-input" required>
            </div>
            <button type="submit" class="btn btn-main">${button}</button>
        </form>`
    )); 

    document.getElementById('create-class-form').addEventListener('submit', async e => { 
        e.preventDefault(); 
        try {
             await apiRequest('/teacher/classes', 'POST', { className: document.getElementById('class-name-input').value, teacherEmail: window.currentUser.email }); 
             window.modalContainer.innerHTML = ''; 
             renderTeacherDashboard(); 
        } catch (error) {
            alert("Erreur lors de la création de la classe: " + error.message);
        }
    }); 
}

export async function renderClassDetailsPage(id) {
    const page = document.getElementById('class-details-page');
    page.innerHTML = `<button id="back-to-teacher" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> Retour</button>${spinnerHtml}`;
    page.querySelector('#back-to-teacher').addEventListener('click', renderTeacherDashboard);
    changePage('class-details-page');
    
    try {
        currentClassData = await apiRequest(`/teacher/classes/${id}?teacherEmail=${window.currentUser.email}`);
        
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
        page.querySelector('#open-add-student-modal-btn').addEventListener('click', () => {
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

    } catch (error) {
         page.innerHTML = `<button id="back-to-teacher" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> Retour</button><p class="error-message" style="margin-top: 1rem;">Impossible de charger les détails de la classe: ${error.message}</p>`;
         page.querySelector('#back-to-teacher').addEventListener('click', renderTeacherDashboard);
    }
}

function renderStudentListPanel() {
    let studentCardsHtml = (currentClassData.studentsWithDetails || []).map(student => {
        const studentResults = (currentClassData.results || []).filter(r => r.studentEmail === student.email);
        const assignedContentCount = (currentClassData.content || []).length;
        const completionRate = assignedContentCount > 0 ? (studentResults.length / assignedContentCount) * 100 : 0;
        return `<div class="dashboard-card" data-student-email="${student.email}">
                    <div class="dashboard-card-title">
                        <h4><img src="${window.backendUrl}/avatars/${student.avatar}" class="avatar"> ${student.firstName}</h4>
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
            document.getElementById('cancel-delete').addEventListener('click', () => window.modalContainer.innerHTML = '');
            document.getElementById('confirm-delete').addEventListener('click', () => handleRemoveStudent(studentEmail));
        });
    });
}

async function handleAddStudent(e) { 
    e.preventDefault(); 
    const email = document.getElementById('student-email-input').value; 
    const errP = document.getElementById('add-student-error'); 
    try { 
        if(errP) errP.textContent = ''; 
        await apiRequest(`/teacher/classes/${currentClassData.id}/add-student`, 'POST', { studentEmail: email, teacherEmail: window.currentUser.email });
        window.modalContainer.innerHTML = ''; 
        renderClassDetailsPage(currentClassData.id); 
    } catch (err) { 
        if(errP) errP.textContent = err.message; 
    } 
}

async function handleRemoveStudent(studentEmail) {
    try {
        await apiRequest(`/teacher/classes/${currentClassData.id}/remove-student`, 'POST', { studentEmail, teacherEmail: window.currentUser.email });
        window.modalContainer.innerHTML = '';
        renderClassDetailsPage(currentClassData.id); 
    } catch (error) {
        alert(`Erreur lors de la suppression de l'élève: ${error.message}`);
    }
}

async function renderCompetencyReport(classId) {
    const panel = document.getElementById('competencies-panel');
    panel.innerHTML = spinnerHtml;
    try {
        const report = await apiRequest(`/teacher/classes/${classId}/competency-report?teacherEmail=${window.currentUser.email}`);
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
                <p>Êtes-vous sûr de vouloir supprimer <strong>${content.title}</strong>" ?</p>
                <p>Cette action est irréversible et supprimera également tous les résultats des élèves pour ce devoir.</p>
                <div style="display:flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
                    <button class="btn btn-secondary" id="cancel-delete">Annuler</button>
                    <button class="btn" style="background: var(--incorrect-color); color: white;" id="confirm-delete">Confirmer</button>
                </div>
            `));
            document.getElementById('cancel-delete').addEventListener('click', () => window.modalContainer.innerHTML = '');
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

async function handleDeleteContent(contentId) {
     try {
        await apiRequest(`/teacher/classes/${currentClassData.id}/content/${contentId}?teacherEmail=${window.currentUser.email}`, 'DELETE');
        window.modalContainer.innerHTML = '';
        renderClassDetailsPage(currentClassData.id); 
    } catch (error) {
        alert(`Erreur lors de la suppression du contenu: ${error.message}`);
    }
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
    
    document.getElementById('cancel-publish').addEventListener('click', () => window.modalContainer.innerHTML = '');
    document.getElementById('confirm-publish').addEventListener('click', async () => {
        try {
            await apiRequest('/library/publish', 'POST', {
                contentData: content,
                teacherName: window.currentUser.firstName,
                subject: subjectInfo.name
            });
            window.modalContainer.innerHTML = '';
            renderModal(getModalTemplate('publish-success', 'Succès', '<p>Votre contenu a été publié avec succès !</p>'));
            setTimeout(() => window.modalContainer.innerHTML = '', 2000);
        } catch (error) {
            alert(`Erreur de publication: ${error.message}`);
        }
    });
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
                        <label for="appreciation-non_acquis">Non acquis</label>
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

        try {
            await apiRequest('/teacher/validate-result', 'POST', {
                classId: currentClassData.id,
                teacherEmail: window.currentUser.email,
                studentEmail: result.studentEmail,
                contentId: result.contentId,
                appreciation,
                comment
            });

            window.modalContainer.innerHTML = '';
            renderClassDetailsPage(currentClassData.id);
        } catch (error) {
            alert("Erreur lors de la validation: " + error.message);
        }
    });
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
         detailsHtml = `<p>Le détail des réponses n'est pas disponible pour ce type de devoir.</p>`;
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
                    const content = (currentClassData.content || []).find(c => c.id === result.contentId); 

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
                <h2><img src="${window.backendUrl}/avatars/${student.avatar}" class="avatar"> Profil de ${student.firstName}</h2>
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

function showGenerationModal(prefillData = null) {
    if (Object.keys(window.programmes).length === 0) {
        alert("Les programmes scolaires n'ont pas pu être chargés. Impossible de générer du contenu.");
        return;
    }
    
    const h = `
        <div class="tabs">
            <button class="tab-button active" data-tab="from-program">Depuis le Programme</button>
            <button class="tab-button" data-tab="from-text">Depuis un Texte/Document</button>
        </div>
        <div id="from-program" class="tab-panel active">
            <form id="generation-form">
                <div class="form-group"><label>Type de contenu</label><select id="content-type-select"><option value="quiz">Quiz</option><option value="exercices">Fiche d'exercices</option><option value="revision">Fiche de révision</option><option value="dm">Devoir Maison</option></select></div>
                <div class="form-group" id="exercise-count-group"><label for="exercise-count" id="exercise-count-label">Nombre de questions</label><input type="number" id="exercise-count" value="3" min="1" max="15"></div>
                <div id="program-fields">
                    <div class="form-group"><label>Cycle</label><select id="cycle-select"><option value="">-- Choisir --</option></select></div>
                    <div class="form-group"><label>Niveau</label><select id="niveau-select" disabled><option value="">-- Choisir --</option></select></div>
                    <div class="form-group"><label>Matière</label><select id="matiere-select" disabled><option value="">-- Choisir --</option></select></div>
                    <div class="form-group"><label>Notion</label><select id="notion-select" disabled><option value="">-- Choisir --</option></select></div>
                    <div class="form-group"><label>Compétence</label><select id="competence-select" disabled><option value="">-- Choisir --</option></select></div>
                </div>
                <div id="free-competence-field" class="form-group hidden">
                    <label>Compétence Suggérée</label>
                    <input type="text" id="competence-input" placeholder="Sujet ou compétence libre...">
                </div>
                <button type="submit" class="btn btn-main" id="generate-btn">Générer</button>
            </form>
        </div>
        <div id="from-text" class="tab-panel">
             <form id="generate-from-upload-form">
                <div class="form-group"><label for="document-upload-input">Chargez un document (PDF, DOCX, PNG, JPG)</label><input type="file" id="document-upload-input" accept=".pdf,.docx,.png,.jpg,.jpeg" required></div>
                <div class="form-group"><label>Type de contenu à générer</label><select id="teacher-content-type-upload"><option value="quiz">Quiz</option><option value="exercices">Fiche d'exercices</option><option value="revision">Fiche de révision</option><option value="dm">Devoir Maison</option></select></div>
                <div class="form-group" id="exercise-count-group-upload"><label for="exercise-count-upload" id="exercise-count-label-upload">Nombre de questions</label><input type="number" id="exercise-count-upload" value="3" min="1" max="15"></div>
                <button type="submit" class="btn btn-main">Analyser et Générer</button>
            </form>
        </div>
        <div id="generation-spinner" class="hidden">${spinnerHtml}</div>`;
    
    renderModal(getModalTemplate('generation-modal', 'Générer du contenu pédagogique', h));
    
    const setupContentTypeListener = (typeSelectId, countGroupId, countLabelId) => {
        const typesWithCount = ['quiz', 'exercices', 'dm'];
        const typeSelect = document.getElementById(typeSelectId);
        const countGroup = document.getElementById(countGroupId);
        const countLabel = document.getElementById(countLabelId);
        typeSelect.addEventListener('change', () => {
            const selectedType = typeSelect.value;
            countGroup.classList.toggle('hidden', !typesWithCount.includes(selectedType));
            if(selectedType === 'quiz') countLabel.textContent = "Nombre de questions";
            else if (selectedType === 'exercices' || selectedType === 'dm') countLabel.textContent = "Nombre d'exercices";
        });
        typeSelect.dispatchEvent(new Event('change'));
    };
    setupContentTypeListener('content-type-select', 'exercise-count-group', 'exercise-count-label');
    setupContentTypeListener('teacher-content-type-upload', 'exercise-count-group-upload', 'exercise-count-label-upload');
    const cy = document.getElementById('cycle-select'), n = document.getElementById('niveau-select'), m = document.getElementById('matiere-select'), no = document.getElementById('notion-select'), co = document.getElementById('competence-select'), gen = document.getElementById('generate-btn');
    const competenceInput = document.getElementById('competence-input');

    Object.keys(window.programmes).forEach(c => cy.add(new Option(c, c)));
    cy.addEventListener('change', () => { resetSelects([n, m, no, co]); const s = cy.value; if (s) { Object.keys(window.programmes[s]).forEach(l => n.add(new Option(l, l))); n.disabled = false; } });
    n.addEventListener('change', () => { resetSelects([m, no, co]); const d = window.programmes[cy.value][n.value]; if (d) { Object.keys(d).forEach(k => m.add(new Option(d[k].nom, k))); m.disabled = false; } });
    m.addEventListener('change', () => { 
        resetSelects([no, co]); 
        const d = window.programmes[cy.value][n.value]?.[m.value]; 
        if (d) { 
            Object.keys(d).filter(k => k !== 'nom').forEach(nk => { 
                no.add(new Option(d[nk].nom, nk)); 
            }); 
            no.disabled = false; 
        } 
    });
    no.addEventListener('change', () => {
        resetSelects([co]);
        const d = window.programmes[cy.value][n.value]?.[m.value]?.[no.value];
        if (!d) return;

        if (d.sous_notions) {
            Object.values(d.sous_notions).forEach(sn => {
                (sn.competences || []).forEach(c => co.add(new Option(c, c)));
            });
        }
        else if (d.competences && Array.isArray(d.competences)) {
            d.competences.forEach(c => co.add(new Option(c, c)));
        }
        co.disabled = co.options.length <= 1;
    });
    co.addEventListener('change', () => { gen.disabled = !co.value; });
    competenceInput.addEventListener('input', () => { gen.disabled = !competenceInput.value; });

    document.getElementById('generation-form').addEventListener('submit', async e => {
        e.preventDefault();
        const form = e.currentTarget;
        let comp = '';
        let levelForInfo = '';

        const isFreeMode = !document.getElementById('free-competence-field').classList.contains('hidden');
        if (isFreeMode) {
            comp = competenceInput.value;
            levelForInfo = form.dataset.level || '';
        } else {
            comp = co.value;
            levelForInfo = n.value;
        }

        selectedCompetenceInfo = { level: levelForInfo, competence: comp };
        const contentType = document.getElementById('content-type-select').value;
        const exerciseCount = document.getElementById('exercise-count').value;
        
        const matiereSelect = document.getElementById('matiere-select');
        const selectedMatiereText = isFreeMode ? '' : matiereSelect.options[matiereSelect.selectedIndex].text;
        let language = null;
        if (selectedMatiereText.includes('Anglais')) {
            language = 'Anglais';
        } else if (selectedMatiereText.includes('Arabe')) {
            language = 'Arabe';
        } else if (selectedMatiereText.includes('Espagnol')) {
            language = 'Espagnol';
        }

        document.getElementById('generation-spinner').classList.remove('hidden');
        try {
            const d = await apiRequest('/ai/generate-content', 'POST', { competences: comp, contentType, exerciseCount, language });
            generatedContent = d.structured_content;
            showEditModal();
        } catch(err) {
            alert("Erreur: " + err.message);
        } finally {
            document.getElementById('generation-spinner').classList.add('hidden');
        }
    });
    
    // Correction du bouton Générer depuis Texte/Document
    document.getElementById('generate-from-upload-form').addEventListener('submit', async (e) => { 
        e.preventDefault(); 
        const spinner = document.getElementById('generation-spinner'); 
        spinner.classList.remove('hidden'); 
        const formData = new FormData(); 
        const fileInput = document.getElementById('document-upload-input');

        if (!fileInput.files.length) {
            alert("Veuillez charger un fichier.");
            spinner.classList.add('hidden');
            return;
        }

        formData.append('document', fileInput.files[0]); 
        formData.append('contentType', document.getElementById('teacher-content-type-upload').value); 
        formData.append('exerciseCount', document.getElementById('exercise-count-upload').value); 
        
        try { 
            // Fetch est utilisé ici car apiRequest ne gère pas nativement FormData
            const response = await fetch(`${window.backendUrl}/api/ai/generate-from-upload`, { method: 'POST', body: formData }); 
            const data = await response.json(); 
            if (!response.ok) throw new Error(data.error); 
            generatedContent = data.structured_content; 
            showEditModal();
        } catch (err) { 
            alert('Erreur: ' + err.message); 
        } finally { 
            spinner.classList.add('hidden'); 
        } 
    });

    const modal = document.getElementById('generation-modal');
    modal.querySelectorAll('.tab-button').forEach(button => { 
        button.addEventListener('click', (e) => { 
            modal.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active')); 
            modal.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active')); 
            e.target.classList.add('active'); 
            document.getElementById(e.target.dataset.tab).classList.add('active'); 
        }); 
    });

    // Tentative de préremplissage (pour le Planificateur)
    if (prefillData) {
        // CORRECTION: Logique de préremplissage et de bascule vers le champ libre
        document.getElementById('content-type-select').value = prefillData.type;
        document.getElementById('content-type-select').dispatchEvent(new Event('change'));

        let found = false;
        
        // Logique de recherche dans window.programmes omise ici, mais doit exister
        
        if (!found) {
            document.getElementById('program-fields').classList.add('hidden');
            const freeField = document.getElementById('free-competence-field');
            freeField.classList.remove('hidden');
            document.getElementById('competence-input').value = prefillData.competence;
            document.getElementById('generation-form').dataset.level = prefillData.level;
            document.getElementById('generate-btn').disabled = false;
        }
    }
}

function showEditModal() {
    let editHtml = `<form id="edit-form"><div class="form-group"><label>Titre</label><input type="text" id="edit-title" value="${generatedContent.title || ''}"></div>`;

    if (generatedContent.type === 'quiz' && Array.isArray(generatedContent.questions)) {
        generatedContent.questions.forEach((q, i) => {
            editHtml += `<div class="form-group"><label>Question ${i + 1}</label><input type="text" id="edit-q-${i}" value="${q.question_text || ''}"><label style="margin-top: 0.5rem;">Options</label>`;
            if (Array.isArray(q.options)) {
                editHtml += q.options.map((opt, j) => `<input type="text" id="edit-q-${i}-opt-${j}" value="${opt || ''}" style="margin-bottom: 0.5rem;">`).join('');
            }
            editHtml += `</div>`;
        });
    } else if ((generatedContent.type === 'exercices' || generatedContent.type === 'dm') && Array.isArray(generatedContent.content)) {
        generatedContent.content.forEach((ex, i) => {
            editHtml += `<div class="form-group"><label>Exercice ${i + 1}</label><textarea id="edit-ex-${i}" rows="3">${ex.enonce || ''}</textarea></div>`;
        });
    } else if (generatedContent.type === 'revision' && typeof generatedContent.content === 'string') {
        editHtml += `<div class="form-group"><label>Contenu de la fiche</label><textarea id="edit-revision-content" rows="10">${generatedContent.content || ''}</textarea></div>`;
    } else {
        editHtml += `<p class="error-message">Le contenu généré par l'IA a une structure inattendue. Vous pouvez le modifier manuellement ci-dessous.</p>`;
        editHtml += `<div class="form-group"><label>Contenu brut (JSON)</label><textarea rows="10" id="raw-json-edit">${JSON.stringify(generatedContent, null, 2)}</textarea></div>`;
    }
    editHtml += `<button type="submit" class="btn btn-main" id="generate-btn">Valider et Assigner</button></form>`;

    renderModal(getModalTemplate('edit-modal', 'Modifier et Valider le Contenu', editHtml));

    document.getElementById('edit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            const rawJsonTextarea = document.getElementById('raw-json-edit');
            if (rawJsonTextarea) {
                generatedContent = JSON.parse(rawJsonTextarea.value);
            } else {
                generatedContent.title = document.getElementById('edit-title').value;
                if (generatedContent.type === 'quiz' && Array.isArray(generatedContent.questions)) {
                    generatedContent.questions.forEach((q, i) => {
                        q.question_text = document.getElementById(`edit-q-${i}`).value;
                        if (Array.isArray(q.options)) {
                            q.options.forEach((opt, j) => { q.options[j] = document.getElementById(`edit-q-${i}-opt-${j}`).value; });
                        }
                    });
                } else if ((generatedContent.type === 'exercices' || generatedContent.type === 'dm') && Array.isArray(generatedContent.content)) {
                    generatedContent.content.forEach((ex, i) => {
                        ex.enonce = document.getElementById(`edit-ex-${i}`).value;
                    });
                } else if (generatedContent.type === 'revision') {
                    generatedContent.content = document.getElementById('edit-revision-content').value;
                }
            }
            showAssignModal();
        } catch (err) {
            alert("Le JSON modifié n'est pas valide. Veuillez le corriger avant de continuer.");
        }
    });
}

function showAssignModal(contentToAssign) { 
    const content = contentToAssign || generatedContent; 
    const defaultDueDate = new Date(); 
    defaultDueDate.setDate(defaultDueDate.getDate() + 7); 
    const formattedDefaultDate = defaultDueDate.toISOString().split('T')[0]; 
    const modalHtml = `<form id="assign-form">
        <div class="form-group"><label for="assign-class-select">Assigner à la classe</label><select id="assign-class-select" required></select></div>
        <div class="form-group"><label for="due-date-input">À faire pour le</label><input type="date" id="due-date-input" value="${formattedDefaultDate}" required></div>
        <div class="form-group checkbox-group"><input type="checkbox" id="is-evaluated-checkbox"><label for="is-evaluated-checkbox">Ce contenu est un devoir évalué</label></div>
        <button type="submit" class="btn btn-main">Assigner</button>
    </form>`; 
    renderModal(getModalTemplate('assign-modal', `Assigner "${content.title}"`, modalHtml)); 
    const select = document.getElementById('assign-class-select'); 
    teacherClasses.forEach(c => select.add(new Option(c.className, c.id))); 
    document.getElementById('assign-form').addEventListener('submit', async e => { 
        e.preventDefault(); 
        const classId = select.value; 
        const dueDate = document.getElementById('due-date-input').value; 
        const isEvaluated = document.getElementById('is-evaluated-checkbox').checked;
        if (!classId || !content || !dueDate) return; 
        try { 
            await apiRequest('/teacher/assign-content', 'POST', { 
                classId, 
                teacherEmail: window.currentUser.email,
                contentData: { ...content, dueDate, isEvaluated, competence: content.competence || selectedCompetenceInfo } 
            }); 
            window.modalContainer.innerHTML = ''; 
            renderModal(getModalTemplate('assign-confirm', 'Succès', '<p>Le contenu a bien été assigné !</p>')); 
            setTimeout(() => { window.modalContainer.innerHTML = ''; renderTeacherDashboard(); }, 2000); 
        } catch (error) { 
            alert("Erreur lors de l'assignation du contenu: " + error.message); 
        } 
    }); 
}

export async function renderPlannerPage() {
    const page = document.getElementById('planner-page');
    changePage('planner-page');
    page.innerHTML = `
        <div class="page-header">
            <h2><i class="fa-solid fa-calendar-days"></i> Planificateur de Cours</h2>
            <button id="back-to-teacher-dash" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> Retour</button>
        </div>
        <div class="card">
            <form id="planner-form">
                <div class="form-group"><label for="planner-theme">Thème de la séquence</label><input type="text" id="planner-theme" placeholder="Ex: L'Empire romain, Les fractions..." required></div>
                <div class="form-group"><label for="planner-level">Niveau de la classe</label><input type="text" id="planner-level" placeholder="Ex: 6ème, CE2, Seconde..." required></div>
                <div class="form-group"><label for="planner-sessions">Nombre de séances</label><input type="number" id="planner-sessions" value="3" min="1" max="10" required></div>
                <button type="submit" class="btn btn-main">Générer la séquence</button>
            </form>
        </div>
        <div id="planner-output" class="hidden">${spinnerHtml}</div>`;
    const outputContainer = document.getElementById('planner-output');
    page.querySelector('#back-to-teacher-dash').addEventListener('click', renderTeacherDashboard);
    page.querySelector('#planner-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        outputContainer.classList.remove('hidden');
        outputContainer.innerHTML = spinnerHtml;
        const theme = document.getElementById('planner-theme').value;
        const level = document.getElementById('planner-level').value;
        const numSessions = document.getElementById('planner-sessions').value;
        try {
            const data = await apiRequest('/ai/generate-lesson-plan', 'POST', { theme, level, numSessions });
            const plan = data.structured_plan;
            let outputHtml = `<h3>${plan.planTitle} (Niveau ${plan.level})</h3>`;

            plan.sessions.forEach((session, sessionIndex) => {
                session.resources = session.resources || [];
                outputHtml += `<div class="session-card">
                    <div class="session-header"><div class="session-number">${session.sessionNumber}</div><h4>${session.title}</h4></div>
                    <p><strong>Objectif :</strong> ${session.objective}</p>
                    <p><strong>Activités :</strong></p><ul>${session.activities.map(act => `<li>${act}</li>`).join('')}</ul>
                    <p><strong>Ressources AIDA :</strong></p><ul>`;
                
                session.resources.forEach((res, resIndex) => {
                     const resourceData = JSON.stringify(res).replace(/'/g, '&#39;');
                     outputHtml += `<li>
                                       <span>${res.type.charAt(0).toUpperCase() + res.type.slice(1)} : ${res.sujet}</span>
                                       <button class="btn btn-generate-planner" data-resource='${resourceData}' data-level="${plan.level}">
                                           <i class="fa-solid fa-wand-sparkles"></i> Générer
                                       </button>
                                   </li>`;
                });
                outputHtml += `</ul></div>`;
            });
            outputContainer.innerHTML = outputHtml;

            outputContainer.querySelectorAll('.btn-generate-planner').forEach(button => {
                button.addEventListener('click', (e) => {
                    const resourceString = e.currentTarget.dataset.resource;
                    if(resourceString) {
                        try {
                            const prefillData = JSON.parse(resourceString.replace(/&#39;/g, "'"));
                            prefillData.level = e.currentTarget.dataset.level;
                            showGenerationModal(prefillData);
                        } catch (err) {
                            console.error("Erreur lors de l'analyse des données de la ressource :", err, "String:", resourceString);
                            alert("Une erreur est survenue en essayant de lire les informations du contenu à générer.");
                        }
                    }
                });
            });
        } catch (error) { outputContainer.innerHTML = `<p class="error-message">Erreur lors de la génération du plan : ${error.message}</p>`; }
    });
}


// --- 2. FONCTIONS ÉLÈVE (Dashboard, Vues, Soumission) ---

export async function renderStudentDashboard() {
    const page = document.getElementById('student-dashboard-page');
    page.innerHTML = spinnerHtml;
    changePage('student-dashboard-page');
    
    try {
        studentDashboardData = await apiRequest(`/student/dashboard?studentEmail=${window.currentUser.email}`);
        
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
                pendingHtml += createStudentCard(item, 'pending');
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

        page.innerHTML = `<h2>Bonjour ${window.currentUser.firstName}!</h2>${todoHtml}${pendingHtml}${completedHtml}`;
        
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
        page.innerHTML = `<p class="error-message">Impossible de charger le tableau de bord étudiant: ${error.message}</p>`;
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

    // MODIFIÉ : Ajout de la classe dynamique "card-type-${c.type}"
    return `
        <div class="dashboard-card-student card-type-${c.type}">
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


// MODIFIÉ : Correction pour récupérer data-question ET data-question-text
async function handleHelpRequest(e) { 
    e.preventDefault(); 
    // Marque que l'aide a été utilisée (pour Quiz ou Devoir)
    helpUsedInQuiz = true; 
    helpUsedInHomework = true; 

    const button = e.target.closest('button');
    
    // CORRECTION : Récupère le texte de la question (Quiz ou Exercice)
    const q = button.dataset.question || button.dataset.questionText;
    
    // NOUVEAUTÉ : Récupère le niveau depuis le bouton
    const level = button.dataset.level || 'N/A';
    
    // Envoie les deux informations à la modale
    showAidaHelpModal(q, level);
}

// MODIFIÉ : Ajout de la restauration du lien header
async function handleSubmitQuiz(c) { 
    sessionStorage.removeItem('isEvaluatedSession');
    const answers = c.questions.map((q, i) => { const sel = document.querySelector(`input[name=q${i}]:checked`); return sel ? parseInt(sel.value) : -1; }); 
    const score = answers.reduce((acc, ans, i) => acc + (ans == c.questions[i].correct_answer_index ? 1 : 0), 0); 
    try {
        await apiRequest('/student/submit-quiz', 'POST', { 
            studentEmail: window.currentUser.email, classId: c.classId, contentId: c.id, title: c.title, 
            score, totalQuestions: c.questions.length, answers, helpUsed: helpUsedInQuiz, teacherEmail: c.teacherEmail
        }); 
        
        // CORRECTION : Réafficher le lien Espace de Travail du header
        const headerWorkspaceLink = document.getElementById('workspace-link');
        if (headerWorkspaceLink && window.currentUser.role === 'student') {
             headerWorkspaceLink.classList.remove('hidden');
        }
        
        renderStudentDashboard();
    } catch (error) {
        alert("Erreur lors de la soumission: " + error.message);
    }
}

// MODIFIÉ : Logique d'affichage des boutons d'aide (spécifique vs global)
function renderContentViewer(c) {
    const p = document.getElementById('content-viewer-page');
    
    // CORRECTION : Masquer le bouton Espace de Travail du Header
    const headerWorkspaceLink = document.getElementById('workspace-link');
    if (headerWorkspaceLink) headerWorkspaceLink.classList.add('hidden');
    
    // Mise à jour de la session pour la barre d'alerte (si elle est utilisée)
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

    // NOUVEAUTÉ : Récupération du niveau pour l'injecter dans les boutons
    const contentLevel = c.competence?.level || 'Niveau non spécifié';

    if (c.type === 'quiz') {
         c.questions.forEach((q, i) => {
            html += `<div class="quiz-question">
                        <div class="question-header">
                            <p><strong>${q.question_text}</strong></p>
                            
                            ${!c.isEvaluated ? `
                            <button type="button" class="btn-help" data-question="${q.question_text}" data-level="${contentLevel}">
                                <i class="fa-solid fa-lightbulb"></i> Aide
                            </button>
                            ` : ''}
                        </div>
                        <div class="quiz-options-grid">${q.options.map((o, j) => `
                            <label class="quiz-option">
                                <input type="radio" name="q${i}" value="${j}" required>
                                <div class="option-label">${o}</div>
                            </label>`).join('')}
                        </div>
                    </div>`;
        });
        
        // STRATÉGIE : Bouton d'aide global pour Quiz Évalué
        if (c.isEvaluated) {
             footerHtml += `<button type="button" id="open-aida-help-btn" class="btn btn-secondary" style="margin-right: auto;"><i class="fa-solid fa-lightbulb"></i> Obtenir de l'aide</button>`;
        }
        
        footerHtml += `<button type="submit" class="btn btn-main"><i class="fa-solid fa-paper-plane"></i> Soumettre le Quiz</button>`;
    
    } else if (isInteractiveHomework) {
        c.content.forEach((exo, i) => {
            html += `
                <div class="exercice-block">
                    <div class="question-header" style="justify-content: flex-start; gap: 20px;">
                        <h4>Exercice ${i + 1}</h4>
                        
                        ${!c.isEvaluated ? `
                        <button type="button" class="btn-help-exercice" data-question-index="${i}" data-question-text="${exo.enonce}" data-level="${contentLevel}">
                            <i class="fa-solid fa-lightbulb"></i> Aide
                        </button>
                        ` : ''}
                    </div>
                    <p class="enonce">${exo.enonce}</p>
                    <textarea class="reponse-eleve" data-exercice-index="${i}" placeholder="Rédige ta réponse ici..."></textarea>
                </div>
            `;
        });
        
        // STRATÉGIE : Le footer dépend de l'évaluation
        if (c.isEvaluated) {
             // Devoir Noté : Un seul bouton global
             footerHtml += `<button type="button" id="open-aida-help-btn" class="btn btn-secondary" style="margin-right: auto;"><i class="fa-solid fa-lightbulb"></i> Obtenir de l'aide</button>`;
        }
        // S'il n'est pas évalué, on ne met PAS le bouton "Espace de Travail" (correction précédente)
        
        footerHtml += `<button type="submit" class="btn btn-main"><i class="fa-solid fa-paper-plane"></i> Soumettre le devoir</button>`;
    
    } else { 
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
        
        // CORRECTION : Réafficher le lien Espace de Travail du header
        const headerWorkspaceLink = document.getElementById('workspace-link');
        if (headerWorkspaceLink && window.currentUser.role === 'student') {
            headerWorkspaceLink.classList.remove('hidden');
        }
        
        renderStudentDashboard();
    });

    const form = p.querySelector('#content-form');

    // --- Rétablissement des Listeners (APRÈS injection de p.innerHTML) ---

    if (c.type === 'quiz') {
        form.addEventListener('submit', e => { e.preventDefault(); handleSubmitQuiz(c); });
        
        // Le listener ne s'attachera qu'aux boutons qui existent (ceux non évalués)
        form.querySelectorAll('.btn-help').forEach(b => b.addEventListener('click', handleHelpRequest));
    
    } else if (isInteractiveHomework) {
        form.addEventListener('submit', e => { e.preventDefault(); handleSubmitNonQuiz(c); });
        
        // Le listener ne s'attachera qu'aux boutons qui existent (ceux non évalués)
        form.querySelectorAll('.btn-help-exercice').forEach(b => b.addEventListener('click', handleHelpRequest));
    }
    
    // Ce listener (pour le bouton global) ne s'attachera que s'il existe (devoir évalué)
    const aidaHelpBtn = p.querySelector('#open-aida-help-btn');
    if (aidaHelpBtn) {
        aidaHelpBtn.addEventListener('click', () => {
            helpUsedInHomework = true;
            // Envoie le titre global et le niveau
            showAidaHelpModal(`Aide pour le devoir : ${c.title}`, contentLevel);
        });
    }

    // ... (partie "finish-exercise-btn" inchangée) ...
    const finishBtn = p.querySelector('#finish-exercise-btn');
    if (finishBtn) {
        finishBtn.addEventListener('click', async () => {
            sessionStorage.removeItem('isEvaluatedSession');
            try {
                await apiRequest('/student/submit-quiz', 'POST', { 
                    studentEmail: window.currentUser.email, classId: c.classId, contentId: c.id, 
                    title: c.title, score: 0, totalQuestions: 0, answers: [], helpUsed: false, teacherEmail: c.teacherEmail
                });
                
                // CORRECTION : Réafficher le lien Espace de Travail du header
                const headerWorkspaceLink = document.getElementById('workspace-link');
                if (headerWorkspaceLink && window.currentUser.role === 'student') {
                     headerWorkspaceLink.classList.remove('hidden');
                }
    
                renderStudentDashboard();
            } catch (error) {
                alert("Erreur lors de la soumission: " + error.message);
            }
        });
    }

    changePage('content-viewer-page');
}

// MODIFIÉ : Ajout de la restauration du lien header
async function handleSubmitNonQuiz(c) {
    sessionStorage.removeItem('isEvaluatedSession');
    const answerTextareas = document.querySelectorAll('#content-form .reponse-eleve');
    const answers = Array.from(answerTextareas).map(textarea => textarea.value);

    if (answers.every(answer => answer.trim() === '')) {
        alert("Veuillez répondre à au moins un exercice avant de soumettre.");
        return;
    }

    try {
        await apiRequest('/student/submit-quiz', 'POST', {
            studentEmail: window.currentUser.email, classId: c.classId, contentId: c.id, title: c.title,
            score: 0, totalQuestions: c.content.length, answers: answers, 
            helpUsed: helpUsedInHomework, 
            teacherEmail: c.teacherEmail
        });
        
        // CORRECTION : Réafficher le lien Espace de Travail du header
        const headerWorkspaceLink = document.getElementById('workspace-link');
        if (headerWorkspaceLink && window.currentUser.role === 'student') {
             headerWorkspaceLink.classList.remove('hidden');
        }
        
        renderStudentDashboard();
    } catch (error) {
        alert("Erreur lors de la soumission: " + error.message);
    }
}


// --- 3. FONCTION BIBLIOTHÈQUE ---

export async function renderLibraryPage() {
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
        // CORRECTION: Utilisation de backticks (``)
        const results = await apiRequest(`/library?searchTerm=${searchTerm}&subject=${subject}`);
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
        grid.innerHTML = `<p class="error-message">Impossible de charger la bibliothèque: ${error.message}</p>`;
    }
}

// --- NOUVEAU MODULE : AIDE À LA CORRECTION ---

// Affiche la page du module de notation
function renderGradingModulePage() {
    const page = document.getElementById('grading-module-page');
    changePage('grading-module-page');
    
    page.innerHTML = `
        <div class="page-header">
            <h2><i class="fa-solid fa-magic-sparkles"></i> Module d'Aide à la Correction (Beta)</h2>
            <button class="btn btn-secondary" id="back-to-teacher-dash-grading"><i class="fa-solid fa-arrow-left"></i> Retour</button>
        </div>
        
        <div class="card">
            <p class="subtitle" style="margin-bottom: 1.5rem;">Uploadez une ou plusieurs copies d'élèves (PDF ou image) et fournissez le sujet ainsi que vos critères pour qu'AIDA génère des propositions d'évaluation.</p>
            
            <form id="grading-form">
                <div class="form-group">
                    <label for="grading-sujet"><strong>1. Sujet du devoir</strong></label>
                    <textarea id="grading-sujet" rows="3" required placeholder="Ex: Expliquez la différence entre l'analyse de texte et l'analyse de discours..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="grading-criteres"><strong>2. Critères de notation</strong> (fournissez le barème)</label>
                    <textarea id="grading-criteres" rows="3" required placeholder="Ex: Pertinence du contenu /10, Organisation /5, Langue et expression /5"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="grading-file"><strong>3. Copies des élèves</strong> (PDF, JPG, PNG)</label>
                    <input type="file" id="grading-file" accept=".pdf,.jpg,.jpeg,.png" required multiple>
                </div>
                
                <button type="submit" class="btn btn-main" style="width: 100%;">
                    <i class="fa-solid fa-wand-sparkles"></i> Lancer l'analyse
                </button>
            </form>
        </div>
        
        <div id="grading-results" style="margin-top: 2rem;">
            </div>
    `;
    
    page.querySelector('#back-to-teacher-dash-grading').addEventListener('click', renderTeacherDashboard);
    page.querySelector('#grading-form').addEventListener('submit', handleGradingAnalysis);
}

// Gère l'envoi du formulaire d'analyse (version 1 élève / N pages)
async function handleGradingAnalysis(e) {
    e.preventDefault();
    const resultsContainer = document.getElementById('grading-results');
    resultsContainer.innerHTML = spinnerHtml;

    const sujet = document.getElementById('grading-sujet').value;
    const criteres = document.getElementById('grading-criteres').value;
    const files = document.getElementById('grading-file').files; // Utilise .files (au pluriel)

    if (!files || files.length === 0 || !sujet || !criteres) {
        resultsContainer.innerHTML = `<p class="error-message">Veuillez remplir tous les champs et sélectionner au moins un fichier.</p>`;
        return;
    }

    const formData = new FormData();
    formData.append('sujet', sujet);
    formData.append('criteres', criteres);
    
    // Boucle pour ajouter tous les fichiers (pages)
    for (const file of files) {
        formData.append('copies', file); // 'copies' (au pluriel) doit correspondre au backend
    }

    try {
        const response = await fetch(`${window.backendUrl}/api/ai/grade-upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || 'Erreur du serveur lors de analyse.');
        }

        // MODIFIÉ : Attend un OBJET unique, pas un tableau
        const results = await response.json(); 
        
        // --- MODIFIÉ : Affichage formaté pour UN SEUL résultat ---
        
        // (Utilise 'results' directement, au lieu de 'eval')
        let html = `
            <div class="card" style="margin-bottom: 1.5rem;">
                <h3>Résultat de l'analyse AIDA</h3>
                <p class="subtitle">Pour la copie : ${files[0].name} (et ${files.length - 1} autre(s) page(s))</p>
                
                <h4 style="margin-top: 1.5rem;">Analyse Globale</h4>
                <p>${results.analyseGlobale ? results.analyseGlobale.replace(/\\n/g, '<br>') : 'N/A'}</p>
                
                <h4 style="margin-top: 1.5rem;">Évaluation Détaillée</h4>
        `;
        
        // Afficher les critères
        if (results.criteres && Array.isArray(results.criteres)) {
            html += '<ul>';
            results.criteres.forEach(critere => {
                html += `<li><strong>${critere.nom} (${critere.note}):</strong> ${critere.commentaire}</li>`;
            });
            html += '</ul>';
        } else {
            html += '<p>Aucun critère détaillé fourni.</p>';
        }

        html += `
                <h4 style="margin-top: 1.5rem;">Note Finale Suggérée</h4>
                <p style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${results.noteFinale || 'N/A'}</p>
                
                <h4 style="margin-top: 1.5rem;">Commentaire pour l'élève</h4>
                <div class="student-answer-box">${results.commentaireEleve ? results.commentaireEleve.replace(/\\n/g, '<br>') : 'N/A'}</div>
            </div>
        `;
        
        resultsContainer.innerHTML = html;

    } catch (err) {
        resultsContainer.innerHTML = `<p class="error-message">Erreur: ${err.message}</p>`;
    }
}
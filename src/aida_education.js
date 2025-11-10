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
    // MODIFIÉ : Traduction du placeholder
    const chooseText = i18next.t('genModal.choose');
    selects.forEach(s => { s.innerHTML = `<option value="">${chooseText}</option>`; s.disabled = true; }); 
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) generateBtn.disabled = true; 
}


// --- 1. FONCTIONS ENSEIGNANT (Dashboard, Classes, Corrections, Génération) ---
export async function renderTeacherDashboard() {
    const p = document.getElementById('teacher-dashboard-page');
    
    const greeting = i18next.t('teacherDashboard.greeting', { name: window.currentUser.firstName });

    p.innerHTML = `
        <div class="page-header">
            <h2>${greeting}</h2>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                
                <button class="btn btn-secondary" id="open-grading-module-btn" data-i18n="grading.title"><i class="fa-solid fa-magic-sparkles"></i> ${i18next.t('grading.title')}</button>
                
                <button class="btn btn-secondary" id="open-planner-btn" data-i18n="teacherDashboard.plannerButton"><i class="fa-solid fa-calendar-days"></i> ${i18next.t('teacherDashboard.plannerButton')}</button>
                <button class="btn btn-main" id="open-gen-modal" data-i18n="teacherDashboard.newContentButton"><i class="fa-solid fa-plus"></i> ${i18next.t('teacherDashboard.newContentButton')}</button> 
                <button class="btn btn-secondary" id="open-class-modal" data-i18n="teacherDashboard.newClassButton"><i class="fa-solid fa-users"></i> ${i18next.t('teacherDashboard.newClassButton')}</button>
            </div>
        </div>
        <div id="class-grid" class="dashboard-grid">${spinnerHtml}</div>`;
    changePage('teacher-dashboard-page');
    
    p.querySelector('#open-grading-module-btn').addEventListener('click', renderGradingModulePage);
    p.querySelector('#open-class-modal').addEventListener('click', showCreateClassModal);
    p.querySelector('#open-gen-modal').addEventListener('click', () => showGenerationModal());
    p.querySelector('#open-planner-btn').addEventListener('click', renderPlannerPage);

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
        grid.innerHTML = teacherClasses.length === 0 ? `<p data-i18n="teacherDashboard.noClasses">${i18next.t('teacherDashboard.noClasses')}</p>` : "";
        
        const classCardsHtml = teacherClasses.map(c => {
            const completionRate = calculateCompletionRate(c);
            
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
        
        grid.innerHTML = classCardsHtml;

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
    const backButtonText = i18next.t('classDetails.backButton');
    page.innerHTML = `<button id="back-to-teacher" class="btn btn-secondary" data-i18n="classDetails.backButton"><i class="fa-solid fa-arrow-left"></i> ${backButtonText}</button>${spinnerHtml}`;
    page.querySelector('#back-to-teacher').addEventListener('click', renderTeacherDashboard);
    changePage('class-details-page');
    
    try {
        currentClassData = await apiRequest(`/teacher/classes/${id}?teacherEmail=${window.currentUser.email}`);
        
        page.innerHTML = `
            <button id="back-to-teacher" class="btn btn-secondary" data-i18n="classDetails.backButton"><i class="fa-solid fa-arrow-left"></i> ${backButtonText}</button>
            <h2>${currentClassData.className}</h2>
            <div class="tabs">
                <button class="tab-button active" data-tab="students-panel" data-i18n="classDetails.tabStudents">${i18next.t('classDetails.tabStudents')}</button>
                <button class="tab-button" data-tab="contents-panel" data-i18n="classDetails.tabContent">${i18next.t('classDetails.tabContent')}</button>
                <button class="tab-button" data-tab="competencies-panel" data-i18n="classDetails.tabCompetencies">${i18next.t('classDetails.tabCompetencies')}</button>
                <button class="tab-button" data-tab="corrections-panel" data-i18n="classDetails.tabCorrections">${i18next.t('classDetails.tabCorrections')}</button> 
                <span id="pending-count" class="new-tag hidden"></span>
            </div>
            <div id="students-panel" class="tab-panel active">
                <div class="page-header" style="margin-bottom: 1.5rem;">
                    <h3 data-i18n="classDetails.studentsTitle">${i18next.t('classDetails.studentsTitle')}</h3>
                    <button id="open-add-student-modal-btn" class="btn btn-secondary" data-i18n="classDetails.addStudentButton"><i class="fa-solid fa-user-plus"></i> ${i18next.t('classDetails.addStudentButton')}</button>
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
            pendingCountSpan.textContent = `${pendingCorrections.length} ${i18next.t('classDetails.pendingCount')}`;
            pendingCountSpan.classList.remove('hidden');
            page.querySelector('[data-tab="corrections-panel"]').appendChild(pendingCountSpan);
        }
        
        page.querySelector('#back-to-teacher').addEventListener('click', renderTeacherDashboard);
        page.querySelector('#open-add-student-modal-btn').addEventListener('click', () => {
            const title = i18next.t('addStudentModal.title');
            const label = i18next.t('addStudentModal.label');
            const button = i18next.t('addStudentModal.button');
            
            renderModal(getModalTemplate('add-student-modal', title, `
                <form id="add-student-form">
                    <div class="form-group">
                        <label for="student-email-input">${label}</label>
                        <input type="email" id="student-email-input" required>
                    </div>
                    <button type="submit" class="btn btn-main">${button}</button>
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
         page.innerHTML = `<button id="back-to-teacher" class="btn btn-secondary" data-i18n="classDetails.backButton"><i class="fa-solid fa-arrow-left"></i> ${backButtonText}</button><p class="error-message" style="margin-top: 1rem;">Impossible de charger les détails de la classe: ${error.message}</p>`;
         page.querySelector('#back-to-teacher').addEventListener('click', renderTeacherDashboard);
    }
}

function renderStudentListPanel() {
    let studentCardsHtml = (currentClassData.studentsWithDetails || []).map(student => {
        const studentResults = (currentClassData.results || []).filter(r => r.studentEmail === student.email);
        const assignedContentCount = (currentClassData.content || []).length;
        const completionRate = assignedContentCount > 0 ? (studentResults.length / assignedContentCount) * 100 : 0;
        
        const completionString = i18next.t('classDetails.completionRate');
        const submissionsString = i18next.t('classDetails.submissionsCount', { count: studentResults.length, total: assignedContentCount });
        const deleteTitle = i18next.t('classDetails.deleteStudentTitle');

        return `<div class="dashboard-card" data-student-email="${student.email}">
                    <div class="dashboard-card-title">
                        <h4><img src="${window.backendUrl}/avatars/${student.avatar}" class="avatar"> ${student.firstName}</h4>
                        <button class="btn-icon delete-student-btn" data-student-email="${student.email}" title="${deleteTitle}"><i class="fa-solid fa-trash-alt"></i></button>
                    </div>
                    <p>${completionString}: ${Math.round(completionRate)}%</p>
                    <p>${submissionsString}</p>
                </div>`;
    }).join('');
    
    const studentListContainer = document.getElementById('student-list');
    studentListContainer.innerHTML = (currentClassData.studentsWithDetails || []).length > 0 ? studentCardsHtml : `<p data-i18n="classDetails.noStudents">${i18next.t('classDetails.noStudents')}</p>`;
    
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
            
            const title = i18next.t('deleteStudentModal.title');
            const confirmText = i18next.t('deleteStudentModal.confirmText', { name: student.firstName, email: student.email });
            const warning = i18next.t('deleteStudentModal.warning');
            const cancelButton = i18next.t('deleteStudentModal.cancelButton');
            const deleteButton = i18next.t('deleteStudentModal.deleteButton');

            renderModal(getModalTemplate('delete-student-confirm', title, `
                <p>${confirmText}</p>
                <p>${warning}</p>
                <div style="display:flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
                    <button class="btn btn-secondary" id="cancel-delete">${cancelButton}</button>
                    <button class="btn" style="background: var(--incorrect-color); color: white;" id="confirm-delete">${deleteButton}</button>
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
            panel.innerHTML = `<p data-i18n="classDetails.noCompetencyResults">${i18next.t('classDetails.noCompetencyResults')}</p>`;
            return;
        }
        
        let reportHtml = `<table><thead><tr><th data-i18n="classDetails.competencyHeader">${i18next.t('classDetails.competencyHeader')}</th><th data-i18n="classDetails.competencyRateHeader">${i18next.t('classDetails.competencyRateHeader')}</th></tr></thead><tbody>`;
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
        panel.innerHTML = `<p data-i18n="classDetails.noContent">${i18next.t('classDetails.noContent')}</p>`;
        return;
    }

    const shareTitle = i18next.t('classDetails.shareTitle');
    const deleteTitle = i18next.t('classDetails.deleteTitle');
    const typeLabel = i18next.t('library.typeLabel');
    const assignedLabel = i18next.t('classDetails.assignedLabel');

    let html = '<div class="dashboard-grid">';
    contents.forEach(content => {
        const assignedDate = new Date(content.assignedAt).toLocaleDateString();
        const typeDisplay = i18next.t(`contentTypes.${content.type.toLowerCase()}`, content.type);
        html += `
            <div class="dashboard-card">
                <div class="dashboard-card-title">
                     <h4>${content.title}</h4>
                     <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-icon share-content-btn" data-content-id="${content.id}" title="${shareTitle}"><i class="fa-solid fa-share-nodes"></i></button>
                        <button class="btn-icon delete-content-btn" data-content-id="${content.id}" title="${deleteTitle}"><i class="fa-solid fa-trash-alt"></i></button>
                     </div>
                </div>
                <p>${typeLabel} ${typeDisplay}</p>
                <p>${assignedLabel} ${assignedDate}</p>
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
            
            const title = i18next.t('deleteContentModal.title');
            const confirmText = i18next.t('deleteContentModal.confirmText', { title: content.title });
            const warning = i18next.t('deleteContentModal.warning');
            const cancelButton = i18next.t('deleteContentModal.cancelButton');
            const deleteButton = i18next.t('deleteContentModal.deleteButton');

            renderModal(getModalTemplate('delete-content-confirm', title, `
                <p>${confirmText}</p>
                <p>${warning}</p>
                <div style="display:flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
                    <button class="btn btn-secondary" id="cancel-delete">${cancelButton}</button>
                    <button class="btn" style="background: var(--incorrect-color); color: white;" id="confirm-delete">${deleteButton}</button>
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
    
    const title = i18next.t('publishModal.title');
    const confirmText = i18next.t('publishModal.confirmText', { title: content.title });
    const categoryText = i18next.t('publishModal.categoryText', { subject: subjectInfo.name });
    const cancelButton = i18next.t('publishModal.cancelButton');
    const submitButton = i18next.t('publishModal.submitButton');
    const successTitle = i18next.t('publishModal.successTitle');
    const successText = i18next.t('publishModal.successText');

    renderModal(getModalTemplate('publish-confirm', title, `
        <p>${confirmText}</p>
        <p>${categoryText}</p>
        <div style="display:flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
            <button class="btn btn-secondary" id="cancel-publish">${cancelButton}</button>
            <button class="btn btn-main" id="confirm-publish">${submitButton}</button>
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
            renderModal(getModalTemplate('publish-success', successTitle, `<p>${successText}</p>`));
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
        panel.innerHTML = `<p data-i18n="classDetails.noCorrections">${i18next.t('classDetails.noCorrections')}</p>`;
        return;
    }

    const studentLabel = i18next.t('classDetails.studentLabel');
    const submittedLabel = i18next.t('classDetails.submittedLabel');
    const viewCopyButton = i18next.t('classDetails.viewCopyButton');

    let html = '<div class="dashboard-grid">';
    pendingCorrections.forEach(result => {
        const student = (currentClassData.studentsWithDetails || []).find(s => s.email === result.studentEmail);
        const studentName = student ? student.firstName : result.studentEmail;
        const submittedDate = new Date(result.submittedAt).toLocaleDateString();
        const resultString = JSON.stringify(result).replace(/"/g, '&quot;');
        html += `
            <div class="dashboard-card" data-result="${resultString}">
                <h4>${result.title}</h4>
                <p><strong>${studentLabel} :</strong> ${studentName}</p>
                <p><strong>${submittedLabel} :</strong> ${submittedDate}</p>
                <div style="text-align: right; margin-top: 1rem;">
                    <button class="btn btn-secondary view-copy-btn">${viewCopyButton}</button>
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
    // MODIFIÉ : Utilisation des NOUVELLES clés (correction du bug)
    const studentAnswersTitle = i18next.t('validationModal.studentAnswersTitle');
    const questionLabel = i18next.t('validationModal.questionLabel');
    const studentAnswerLabel = i18next.t('validationModal.studentAnswerLabel');
    const noAnswerLabel = i18next.t('validationModal.noAnswerLabel');
    const correctAnswerLabel = i18next.t('validationModal.correctAnswerLabel');
    const statementLabel = i18next.t('validationModal.statementLabel');
    const answerLabel = i18next.t('validationModal.answerLabel');
    const noDetailLabel = i18next.t('validationModal.noDetailLabel');
    
    let detailsHtml = `<h4>${studentAnswersTitle}</h4>`;
    if (content.type === 'quiz' && result.answers && Array.isArray(result.answers)) {
        content.questions.forEach((q, index) => {
            const studentAnswerIndex = result.answers[index];
            const correctAnswerIndex = q.correct_answer_index;
            const isCorrect = studentAnswerIndex === correctAnswerIndex;
            detailsHtml += `<div class="feedback-item ${isCorrect ? 'correct' : 'incorrect'}">
                                <p><strong>${questionLabel} ${index + 1}: ${q.question_text}</strong></p>
                                <p>${studentAnswerLabel} : ${studentAnswerIndex > -1 ? q.options[studentAnswerIndex] : noAnswerLabel}</p>
                                ${!isCorrect ? `<p>${correctAnswerLabel} : ${q.options[correctAnswerIndex]}</p>` : ''}
                            </div>`;
        });
    } else if ((content.type === 'exercices' || content.type === 'dm') && result.answers && Array.isArray(result.answers)) {
        content.content.forEach((exo, index) => {
            const studentAnswer = result.answers[index] || `<i>${noAnswerLabel}</i>`;
            detailsHtml += `
                <div class="feedback-item">
                    <p><strong>${statementLabel} ${index + 1}:</strong> ${exo.enonce}</p>
                    <p><strong>${answerLabel} :</strong></p>
                    <div class="student-answer-box">${studentAnswer.replace(/\n/g, '<br>')}</div>
                </div>`;
        });
    } else {
         detailsHtml = `<p>${noDetailLabel}</p>`;
    }

    const validationTitle = i18next.t('validationModal.validationTitle');
    const commentLabel = i18next.t('validationModal.commentLabel');
    const submitButton = i18next.t('validationModal.submitButton');
    const appreciationAcquis = i18next.t('appreciations.acquis');
    const appreciationEnCours = i18next.t('appreciations.en_cours');
    const appreciationNonAcquis = i18next.t('appreciations.non_acquis');
    const appreciationARevoir = i18next.t('appreciations.a_revoir');

    const validationHtml = `
        <div class="validation-section">
            <h4>${validationTitle}</h4>
            <form id="validation-form">
                <div class="appreciation-grid">
                    <div class="appreciation-option">
                        <input type="radio" id="appreciation-acquis" name="appreciation" value="acquis" required>
                        <label for="appreciation-acquis">${appreciationAcquis}</label>
                    </div>
                    <div class="appreciation-option">
                        <input type="radio" id="appreciation-en_cours" name="appreciation" value="en_cours" required>
                        <label for="appreciation-en_cours">${appreciationEnCours}</label>
                    </div>
                    <div class="appreciation-option">
                        <input type="radio" id="appreciation-non_acquis" name="appreciation" value="non_acquis" required>
                        <label for="appreciation-non_acquis">${appreciationNonAcquis}</label>
                    </div>
                     <div class="appreciation-option">
                        <input type="radio" id="appreciation-a_revoir" name="appreciation" value="a_revoir" required>
                        <label for="appreciation-a_revoir">${appreciationARevoir}</label>
                    </div>
                </div>
                <div class="form-group">
                    <label for="teacher-comment">${commentLabel}</label>
                    <textarea id="teacher-comment" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-main">${submitButton}</button>
            </form>
        </div>
    `;

    renderModal(getModalTemplate('validation-modal', `${i18next.t('validationModal.modalTitlePrefix')} : ${result.title}`, detailsHtml + validationHtml));
    
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
    // MODIFIÉ : Utilisation des NOUVELLES clés (correction du bug)
    const studentAnswersTitle = i18next.t('validationModal.studentAnswersTitle');
    const questionLabel = i18next.t('validationModal.questionLabel');
    const studentAnswerLabel = i18next.t('validationModal.studentAnswerLabel');
    const noAnswerLabel = i18next.t('validationModal.noAnswerLabel');
    const correctAnswerLabel = i18next.t('validationModal.correctAnswerLabel');
    const statementLabel = i18next.t('validationModal.statementLabel');
    const answerLabel = i18next.t('validationModal.answerLabel');
    const noDetailLabel = i18next.t('validationModal.noDetailLabel');

    let detailsHtml = `<h4>${studentAnswersTitle}</h4>`;
    if (content.type === 'quiz' && result.answers && Array.isArray(result.answers)) {
        content.questions.forEach((q, index) => {
            const studentAnswerIndex = result.answers[index];
            const correctAnswerIndex = q.correct_answer_index;
            const isCorrect = studentAnswerIndex === correctAnswerIndex;
            detailsHtml += `<div class="feedback-item ${isCorrect ? 'correct' : 'incorrect'}">
                                <p><strong>${questionLabel} ${index + 1}: ${q.question_text}</strong></p>
                                <p>${studentAnswerLabel} : ${studentAnswerIndex > -1 ? q.options[studentAnswerIndex] : noAnswerLabel}</p>
                                ${!isCorrect ? `<p>${correctAnswerLabel} : ${q.options[correctAnswerIndex]}</p>` : ''}
                            </div>`;
        });
    } else if ((content.type === 'exercices' || content.type === 'dm') && result.answers && Array.isArray(result.answers)) {
        content.content.forEach((exo, index) => {
            const studentAnswer = result.answers[index] || `<i>${noAnswerLabel}</i>`;
            detailsHtml += `
                <div class="feedback-item">
                    <p><strong>${statementLabel} ${index + 1}:</strong> ${exo.enonce}</p>
                    <p><strong>${answerLabel} :</strong></p>
                    <div class="student-answer-box">${studentAnswer.replace(/\n/g, '<br>')}</div>
                </div>`;
        });
    } else {
         detailsHtml = `<p>${noDetailLabel}</p>`;
    }

    const feedbackTitle = i18next.t('validatedModal.feedbackTitle');
    const appreciationLabel = i18next.t('validatedModal.appreciationLabel');
    const commentLabel = i18next.t('validatedModal.commentLabel');

    let feedbackHtml = `
        <div class="validation-section">
            <h4>${feedbackTitle}</h4>
            <p><strong>${appreciationLabel} :</strong> ${getAppreciationText(result.appreciation)}</p>
            ${result.teacherComment ? `<p><strong>${commentLabel} :</strong> ${result.teacherComment}</p>` : ''}
        </div>
    `;
    
    renderModal(getModalTemplate('validated-result-modal', `${i18next.t('validatedModal.modalTitlePrefix')} : ${result.title}`, detailsHtml + feedbackHtml));
}

function renderStudentDetailsPage(studentEmail) {
    const page = document.getElementById('student-details-page');
    const student = currentClassData.studentsWithDetails.find(s => s.email === studentEmail);
    const studentResults = (currentClassData.results || []).filter(r => r.studentEmail === studentEmail);
    
    const backButton = i18next.t('studentDetails.backButton');
    const profileTitle = i18next.t('studentDetails.profileTitle', { name: student.firstName });
    const resultsTitle = i18next.t('studentDetails.resultsTitle');
    const noResults = i18next.t('studentDetails.noResults');
    const completedLabel = i18next.t('studentDetails.completedLabel');
    const scoreLabel = i18next.t('studentDetails.scoreLabel');
    const helpUsedTitle = i18next.t('studentDetails.helpUsedTitle');
    const viewDetailsButton = i18next.t('studentDetails.viewDetailsButton');
    
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
                                <strong>${scoreLabel}: ${result.score}/${result.totalQuestions}</strong>
                                <div class="progress-bar">
                                    <div class="progress-bar-fill" style="width: ${scorePercentage}%;"></div>
                                </div>
                            </div>`;
                        }
                        
                        const helpIcon = result.helpUsed ? `<i class="fa-solid fa-lightbulb" title="${helpUsedTitle}" style="font-size: 0.9rem; color: var(--warning-color); margin-left: 0.5rem;"></i>` : '';

                        resultsHtml += `
                            <div class="dashboard-card" style="cursor: default;">
                                <h4>${result.title} ${helpIcon}</h4>
                                <p style="margin-bottom: 1rem;">${completedLabel} ${new Date(result.submittedAt).toLocaleDateString()}</p>
                                ${scoreHtml}
                                <button class="btn btn-secondary view-details" data-content-id="${result.contentId}">${viewDetailsButton}</button>
                            </div>`;
                    }
                });
            resultsHtml += '</div>';
        }

    } else {
        resultsHtml = `<p>${noResults}</p>`;
    }

    page.innerHTML = `
        <button id="back-to-class-details" class="btn btn-secondary" style="margin-bottom: 2rem;"><i class="fa-solid fa-arrow-left"></i> ${backButton}</button>
        <div class="card">
            <div class="page-header">
                <h2><img src="${window.backendUrl}/avatars/${student.avatar}" class="avatar"> ${profileTitle}</h2>
            </div>
            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">${resultsTitle}</h3>
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
    
    const chooseText = i18next.t('genModal.choose');
    const h = `
        <div class="tabs">
            <button class="tab-button active" data-tab="from-program" data-i18n="genModal.tabProgram">${i18next.t('genModal.tabProgram')}</button>
            <button class="tab-button" data-tab="from-text" data-i18n="genModal.tabUpload">${i18next.t('genModal.tabUpload')}</button>
        </div>
        <div id="from-program" class="tab-panel active">
            <form id="generation-form">
                <div class="form-group">
                    <label data-i18n="genModal.contentTypeLabel">${i18next.t('genModal.contentTypeLabel')}</label>
                    <select id="content-type-select">
                        <option value="quiz" data-i18n="contentTypes.quiz">${i18next.t('contentTypes.quiz')}</option>
                        <option value="exercices" data-i18n="contentTypes.exercices">${i18next.t('contentTypes.exercices')}</option>
                        <option value="revision" data-i18n="contentTypes.revision">${i18next.t('contentTypes.revision')}</option>
                        <option value="dm" data-i18n="contentTypes.dm">${i18next.t('contentTypes.dm')}</option>
                    </select>
                </div>
                <div class="form-group" id="exercise-count-group">
                    <label for="exercise-count" id="exercise-count-label" data-i18n="genModal.countLabelQuiz">${i18next.t('genModal.countLabelQuiz')}</label>
                    <input type="number" id="exercise-count" value="3" min="1" max="15">
                </div>
                <div id="program-fields">
                    <div class="form-group"><label data-i18n="genModal.cycleLabel">${i18next.t('genModal.cycleLabel')}</label><select id="cycle-select"><option value="">${chooseText}</option></select></div>
                    <div class="form-group"><label data-i18n="genModal.levelLabel">${i18next.t('genModal.levelLabel')}</label><select id="niveau-select" disabled><option value="">${chooseText}</option></select></div>
                    <div class="form-group"><label data-i18n="genModal.subjectLabel">${i18next.t('genModal.subjectLabel')}</label><select id="matiere-select" disabled><option value="">${chooseText}</option></select></div>
                    <div class="form-group"><label data-i18n="genModal.notionLabel">${i18next.t('genModal.notionLabel')}</label><select id="notion-select" disabled><option value="">${chooseText}</option></select></div>
                    <div class="form-group"><label data-i18n="genModal.competenceLabel">${i18next.t('genModal.competenceLabel')}</label><select id="competence-select" disabled><option value="">${chooseText}</option></select></div>
                </div>
                <div id="free-competence-field" class="form-group hidden">
                    <label data-i18n="genModal.freeCompetenceLabel">${i18next.t('genModal.freeCompetenceLabel')}</label>
                    <input type="text" id="competence-input" placeholder="${i18next.t('genModal.freeCompetencePlaceholder')}">
                </div>
                <button type="submit" class="btn btn-main" id="generate-btn" data-i18n="genModal.generateButton">${i18next.t('genModal.generateButton')}</button>
            </form>
        </div>
        <div id="from-text" class="tab-panel">
             <form id="generate-from-upload-form">
                <div class="form-group"><label for="document-upload-input" data-i18n="genModal.uploadLabel">${i18next.t('genModal.uploadLabel')}</label><input type="file" id="document-upload-input" accept=".pdf,.docx,.png,.jpg,.jpeg" required></div>
                <div class="form-group">
                    <label data-i18n="genModal.uploadContentTypeLabel">${i18next.t('genModal.uploadContentTypeLabel')}</label>
                    <select id="teacher-content-type-upload">
                        <option value="quiz" data-i18n="contentTypes.quiz">${i18next.t('contentTypes.quiz')}</option>
                        <option value="exercices" data-i18n="contentTypes.exercices">${i18next.t('contentTypes.exercices')}</option>
                        <option value="revision" data-i18n="contentTypes.revision">${i18next.t('contentTypes.revision')}</option>
                        <option value="dm" data-i18n="contentTypes.dm">${i18next.t('contentTypes.dm')}</option>
                    </select>
                </div>
                <div class="form-group" id="exercise-count-group-upload">
                    <label for="exercise-count-upload" id="exercise-count-label-upload" data-i18n="genModal.countLabelQuiz">${i18next.t('genModal.countLabelQuiz')}</label>
                    <input type="number" id="exercise-count-upload" value="3" min="1" max="15">
                </div>
                <button type="submit" class="btn btn-main" data-i18n="genModal.uploadButton">${i18next.t('genModal.uploadButton')}</button>
            </form>
        </div>
        <div id="generation-spinner" class="hidden">${spinnerHtml}</div>`;
    
    renderModal(getModalTemplate('generation-modal', i18next.t('genModal.title'), h));
    
    const setupContentTypeListener = (typeSelectId, countGroupId, countLabelId) => {
        const typesWithCount = ['quiz', 'exercices', 'dm'];
        const typeSelect = document.getElementById(typeSelectId);
        const countGroup = document.getElementById(countGroupId);
        const countLabel = document.getElementById(countLabelId);
        typeSelect.addEventListener('change', () => {
            const selectedType = typeSelect.value;
            countGroup.classList.toggle('hidden', !typesWithCount.includes(selectedType));
            if(selectedType === 'quiz') {
                countLabel.textContent = i18next.t('genModal.countLabelQuiz');
                countLabel.dataset.i18n = 'genModal.countLabelQuiz';
            }
            else if (selectedType === 'exercices' || selectedType === 'dm') {
                 countLabel.textContent = i18next.t('genModal.countLabelExercices');
                 countLabel.dataset.i18n = 'genModal.countLabelExercices';
            }
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
        
        let language = i18next.language; // Utilise la langue globale par défaut
        if (selectedMatiereText.includes('Anglais')) language = 'en';
        else if (selectedMatiereText.includes('Arabe')) language = 'ar';
        else if (selectedMatiereText.includes('Espagnol')) language = 'es';

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
        formData.append('language', i18next.language); // Envoie la langue
        
        try { 
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

    if (prefillData) {
        document.getElementById('content-type-select').value = prefillData.type;
        document.getElementById('content-type-select').dispatchEvent(new Event('change'));

        let found = false;
        
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
    const titleLabel = i18next.t('editModal.titleLabel');
    const revisionLabel = i18next.t('editModal.revisionLabel');
    const structureError = i18next.t('editModal.structureError');
    const rawJsonLabel = i18next.t('editModal.rawJsonLabel');
    const submitButton = i18next.t('editModal.submitButton');
    
    let editHtml = `<form id="edit-form"><div class="form-group"><label>${titleLabel}</label><input type="text" id="edit-title" value="${generatedContent.title || ''}"></div>`;

    if (generatedContent.type === 'quiz' && Array.isArray(generatedContent.questions)) {
        const questionLabel = i18next.t('editModal.questionLabel');
        const optionsLabel = i18next.t('editModal.optionsLabel');
        generatedContent.questions.forEach((q, i) => {
            editHtml += `<div class="form-group"><label>${questionLabel.replace('{{index}}', i + 1)}</label><input type="text" id="edit-q-${i}" value="${q.question_text || ''}"><label style="margin-top: 0.5rem;">${optionsLabel}</label>`;
            if (Array.isArray(q.options)) {
                editHtml += q.options.map((opt, j) => `<input type="text" id="edit-q-${i}-opt-${j}" value="${opt || ''}" style="margin-bottom: 0.5rem;">`).join('');
            }
            editHtml += `</div>`;
        });
    } else if ((generatedContent.type === 'exercices' || generatedContent.type === 'dm') && Array.isArray(generatedContent.content)) {
        const exerciceLabel = i18next.t('editModal.exerciceLabel');
        generatedContent.content.forEach((ex, i) => {
            editHtml += `<div class="form-group"><label>${exerciceLabel.replace('{{index}}', i + 1)}</label><textarea id="edit-ex-${i}" rows="3">${ex.enonce || ''}</textarea></div>`;
        });
    } else if (generatedContent.type === 'revision' && typeof generatedContent.content === 'string') {
        editHtml += `<div class="form-group"><label>${revisionLabel}</label><textarea id="edit-revision-content" rows="10">${generatedContent.content || ''}</textarea></div>`;
    } else {
        editHtml += `<p class="error-message">${structureError}</p>`;
        editHtml += `<div class="form-group"><label>${rawJsonLabel}</label><textarea rows="10" id="raw-json-edit">${JSON.stringify(generatedContent, null, 2)}</textarea></div>`;
    }
    editHtml += `<button type="submit" class="btn btn-main" id="generate-btn">${submitButton}</button></form>`;

    renderModal(getModalTemplate('edit-modal', i18next.t('editModal.title'), editHtml));

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
    
    const classLabel = i18next.t('assignModal.classLabel');
    const dueDateLabel = i18next.t('assignModal.dueDateLabel');
    const evaluatedLabel = i18next.t('assignModal.evaluatedLabel');
    const submitButton = i18next.t('assignModal.submitButton');
    
    const modalHtml = `<form id="assign-form">
        <div class="form-group"><label for="assign-class-select">${classLabel}</label><select id="assign-class-select" required></select></div>
        <div class="form-group"><label for="due-date-input">${dueDateLabel}</label><input type="date" id="due-date-input" value="${formattedDefaultDate}" required></div>
        <div class="form-group checkbox-group"><input type="checkbox" id="is-evaluated-checkbox"><label for="is-evaluated-checkbox">${evaluatedLabel}</label></div>
        <button type="submit" class="btn btn-main">${submitButton}</button>
    </form>`; 
    
    renderModal(getModalTemplate('assign-modal', i18next.t('assignModal.title', { title: content.title }), modalHtml)); 
    
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
            renderModal(getModalTemplate('assign-confirm', i18next.t('assignModal.successTitle'), `<p>${i18next.t('assignModal.successText')}</p>`)); 
            setTimeout(() => { window.modalContainer.innerHTML = ''; renderTeacherDashboard(); }, 2000); 
        } catch (error) { 
            alert("Erreur lors de l'assignation du contenu: " + error.message); 
        } 
    }); 
}

export async function renderPlannerPage() {
    const page = document.getElementById('planner-page');
    changePage('planner-page');
    
    const title = i18next.t('planner.title');
    const backButton = i18next.t('planner.backButton');
    const themeLabel = i18next.t('planner.themeLabel');
    const themePlaceholder = i18next.t('planner.themePlaceholder');
    const levelLabel = i18next.t('planner.levelLabel');
    const levelPlaceholder = i18next.t('planner.levelPlaceholder');
    const sessionsLabel = i18next.t('planner.sessionsLabel');
    const submitButton = i18next.t('planner.submitButton');
    
    page.innerHTML = `
        <div class="page-header">
            <h2><i class="fa-solid fa-calendar-days"></i> ${title}</h2>
            <button id="back-to-teacher-dash" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> ${backButton}</button>
        </div>
        <div class="card">
            <form id="planner-form">
                <div class="form-group"><label for="planner-theme">${themeLabel}</label><input type="text" id="planner-theme" placeholder="${themePlaceholder}" required></div>
                <div class="form-group"><label for="planner-level">${levelLabel}</label><input type="text" id="planner-level" placeholder="${levelPlaceholder}" required></div>
                <div class="form-group"><label for="planner-sessions">${sessionsLabel}</label><input type="number" id="planner-sessions" value="3" min="1" max="10" required></div>
                <button type="submit" class="btn btn-main">${submitButton}</button>
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
            const data = await apiRequest('/ai/generate-lesson-plan', 'POST', { theme, level, numSessions, lang: i18next.language });
            const plan = data.structured_plan;
            let outputHtml = `<h3>${plan.planTitle} (Niveau ${plan.level})</h3>`;
            const generateButtonText = i18next.t('planner.generateButton');

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
                                           <i class="fa-solid fa-wand-sparkles"></i> ${generateButtonText}
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

// CORRIGÉ : Logique restaurée depuis le fichier utilisateur et traduite
export async function renderStudentDashboard() {
    const page = document.getElementById('student-dashboard-page');
    page.innerHTML = spinnerHtml;
    changePage('student-dashboard-page');
    
    try {
        studentDashboardData = await apiRequest(`/student/dashboard?studentEmail=${window.currentUser.email}`);
        
        const title = i18next.t('studentDashboard.title', { name: window.currentUser.firstName });
        const todoTitle = i18next.t('studentDashboard.todo');
        const pendingTitle = i18next.t('studentDashboard.pending');
        const archiveTitle = i18next.t('studentDashboard.archive');
        const filterAll = i18next.t('studentDashboard.filterAll');
        const filterMonth = i18next.t('studentDashboard.filterMonth');
        const filterWeek = i18next.t('studentDashboard.filterWeek');

        let todoHtml = `<h3>${todoTitle}</h3>`;
        if (studentDashboardData.todo.length === 0) {
            todoHtml += `<p data-i18n="studentDashboard.noTodo">${i18next.t('studentDashboard.noTodo')}</p>`;
        } else {
            todoHtml += '<div class="dashboard-grid">';
            studentDashboardData.todo.forEach(item => {
                todoHtml += createStudentCard(item, 'todo'); // Appelle la fonction corrigée
            });
            todoHtml += '</div>';
        }

        let pendingHtml = `<h3 style="margin-top: 2rem;">${pendingTitle}</h3>`;
        if (studentDashboardData.pending.length === 0) {
            pendingHtml += `<p data-i18n="studentDashboard.noPending">${i18next.t('studentDashboard.noPending')}</p>`;
        } else {
            pendingHtml += '<div class="dashboard-grid">';
            studentDashboardData.pending.forEach(item => {
                pendingHtml += createStudentCard(item, 'pending');
            });
            pendingHtml += '</div>';
        }

        let completedHtml = `
            <div class="page-header" style="margin-top: 2rem;">
                <h3>${archiveTitle}</h3>
                <div id="archive-filters">
                    <button class="btn btn-secondary active" data-filter="all">${filterAll}</button>
                    <button class="btn btn-secondary" data-filter="month">${filterMonth}</button>
                    <button class="btn btn-secondary" data-filter="week">${filterWeek}</button>
                </div>
            </div>
            <div id="student-completed-list"></div>`;

        page.innerHTML = `<h2>${title}</h2>${todoHtml}${pendingHtml}${completedHtml}`;
        
        renderFilteredArchives('all'); 
        
        page.querySelector('#archive-filters').addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                page.querySelectorAll('#archive-filters button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                renderFilteredArchives(e.target.dataset.filter);
            }
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

// CORRIGÉ : Logique restaurée et traduite
function renderFilteredArchives(filter) {
    const container = document.getElementById('student-completed-list');
    if (!studentDashboardData || !studentDashboardData.completed || studentDashboardData.completed.length === 0) {
        container.innerHTML = `<p data-i18n="studentDashboard.noArchive">${i18next.t('studentDashboard.noArchive')}</p>`;
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
        container.innerHTML = `<p data-i18n="studentDashboard.noArchivePeriod">${i18next.t('studentDashboard.noArchivePeriod')}</p>`;
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

// CORRIGÉ : Logique restaurée et traduite (corrige le bug de la date)
function createStudentCard(c, status) {
    const subjectInfo = getSubjectInfo(c.title);
    
    // Traduction du type
    const typeLabel = i18next.t(`contentTypes.${c.type.toLowerCase()}`, c.type.charAt(0).toUpperCase() + c.type.slice(1));
    const classLabel = i18next.t('studentCard.classLabel');

    let dateInfoHtml = '';
    let buttonHtml = '';

    switch(status) {
        case 'todo':
            const dueDate = new Date(c.dueDate);
            const today = new Date(); today.setHours(0,0,0,0);
            const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
            let statusClass = 'status-ontime';
            
            let statusText = i18next.t('studentCard.status_todo_date', { date: dueDate.toLocaleDateString() });
            if (dueDate < today) {
                statusClass = 'status-overdue';
                statusText = i18next.t('studentCard.status_late_date', { date: dueDate.toLocaleDateString() });
            } else if (dueDate <= tomorrow) {
                statusClass = 'status-due-soon';
                statusText = i18next.t('studentCard.status_due_soon');
            }
            dateInfoHtml = `<span class="deadline-status ${statusClass}">${statusText}</span>`;
            buttonHtml = `<button class="btn btn-main start-btn" data-content-id="${c.id}">${i18next.t('studentCard.button_start')}</button>`;
            break;
        case 'pending':
            dateInfoHtml = `<span class="deadline-status status-pending">${i18next.t('studentCard.status_pending')}</span>`;
            buttonHtml = `<button class="btn btn-secondary" disabled>${i18next.t('studentCard.status_pending')}</button>`;
            break;
        case 'completed':
            const appreciationText = c.appreciation ? getAppreciationText(c.appreciation) : i18next.t('studentCard.status_completed_simple');
            dateInfoHtml = `<span class="deadline-status status-completed">${appreciationText}</span>`;
            buttonHtml = `<button class="btn btn-secondary view-correction-btn" data-content-id="${c.id}">${i18next.t('studentCard.button_correction')}</button>`;
            break;
    }

    return `
        <div class="dashboard-card-student card-type-${c.type.toLowerCase()}">
            <div class="card-header">
                <span class="subject-tag ${subjectInfo.cssClass}">${typeLabel}</span>
                ${dateInfoHtml}
            </div>
            <div class="card-content">
                <h4>${c.title}</h4>
                <p>${classLabel}: ${c.className}</p>
            </div>
            <div class="card-footer">
                ${buttonHtml}
            </div>
        </div>`;
}


// CORRIGÉ : Appel à showAidaHelpModal
async function handleHelpRequest(e) { 
    e.preventDefault(); 
    helpUsedInQuiz = true; 
    helpUsedInHomework = true; 

    const button = e.target.closest('button');
    const q = button.dataset.question || button.dataset.questionText;
    const level = button.dataset.level || 'N/A';
    
    // Recrée un objet 'content' et 'assignment' partiel pour la modale
    const fakeContent = { title: q };
    // L'assignment est non-évalué car le bouton d'aide est spécifique à la question
    const fakeAssignment = { isEvaluated: false }; 
    showAidaHelpModal(fakeContent, fakeAssignment);
}

async function handleSubmitQuiz(c) { 
    sessionStorage.removeItem('isEvaluatedSession');
    const answers = c.questions.map((q, i) => { const sel = document.querySelector(`input[name=q${i}]:checked`); return sel ? parseInt(sel.value) : -1; }); 
    const score = answers.reduce((acc, ans, i) => acc + (ans == c.questions[i].correct_answer_index ? 1 : 0), 0); 
    try {
        await apiRequest('/student/submit-quiz', 'POST', { 
            studentEmail: window.currentUser.email, classId: c.classId, contentId: c.id, title: c.title, 
            score, totalQuestions: c.questions.length, answers, helpUsed: helpUsedInQuiz, teacherEmail: c.teacherEmail
        }); 
        
        const headerWorkspaceLink = document.getElementById('workspace-link');
        if (headerWorkspaceLink && window.currentUser.role === 'student') {
             headerWorkspaceLink.classList.remove('hidden');
        }
        
        renderStudentDashboard();
    } catch (error) {
        alert("Erreur lors de la soumission: " + error.message);
    }
}

// CORRIGÉ : Entièrement traduit
function renderContentViewer(c) {
    const p = document.getElementById('content-viewer-page');
    
    const headerWorkspaceLink = document.getElementById('workspace-link');
    if (headerWorkspaceLink) headerWorkspaceLink.classList.add('hidden');
    
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
    const contentLevel = c.competence?.level || 'Niveau non spécifié';

    const helpButtonText = i18next.t('contentViewer.helpButton');
    const submitQuizButton = i18next.t('contentViewer.submitButton');
    const submitHomeworkButton = i18next.t('contentViewer.submitButton');
    const markAsReadButton = i18next.t('contentViewer.markAsReadButton');

    if (c.type === 'quiz') {
         c.questions.forEach((q, i) => {
            html += `<div class="quiz-question">
                        <div class="question-header">
                            <p><strong>${q.question_text}</strong></p>
                            
                            ${!c.isEvaluated ? `
                            <button type="button" class="btn-help" data-question="${q.question_text}" data-level="${contentLevel}">
                                <i class="fa-solid fa-lightbulb"></i> ${helpButtonText}
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
        
        if (c.isEvaluated) {
             footerHtml += `<button type="button" id="open-aida-help-btn" class="btn btn-secondary" style="margin-right: auto;"><i class="fa-solid fa-lightbulb"></i> ${helpButtonText}</button>`;
        }
        
        footerHtml += `<button type="submit" class="btn btn-main"><i class="fa-solid fa-paper-plane"></i> ${submitQuizButton}</button>`;
    
    } else if (isInteractiveHomework) {
        c.content.forEach((exo, i) => {
            html += `
                <div class="exercice-block">
                    <div class="question-header" style="justify-content: flex-start; gap: 20px;">
                        <h4>${i18next.t('editModal.exerciceLabel', { index: i + 1 })}</h4>
                        
                        ${!c.isEvaluated ? `
                        <button type="button" class="btn-help-exercice" data-question-index="${i}" data-question-text="${exo.enonce}" data-level="${contentLevel}">
                            <i class="fa-solid fa-lightbulb"></i> ${helpButtonText}
                        </button>
                        ` : ''}
                    </div>
                    <p class="enonce">${exo.enonce}</p>
                    <textarea class="reponse-eleve" data-exercice-index="${i}" placeholder="${i18next.t('contentViewer.answerPlaceholder')}"></textarea>
                </div>
            `;
        });
        
        if (c.isEvaluated) {
             footerHtml += `<button type="button" id="open-aida-help-btn" class="btn btn-secondary" style="margin-right: auto;"><i class="fa-solid fa-lightbulb"></i> ${helpButtonText}</button>`;
        }
        
        footerHtml += `<button type="submit" class="btn btn-main"><i class="fa-solid fa-paper-plane"></i> ${submitHomeworkButton}</button>`;
    
    } else { 
        html = `<div class="revision-content">${c.content.replace(/\n/g, '<br>')}</div>`;
        footerHtml = `<button type="button" id="finish-exercise-btn" class="btn btn-main"><i class="fa-solid fa-check"></i> ${markAsReadButton}</button>`;
    }

    const backButton = i18next.t('contentViewer.backButton');
    
    p.innerHTML = `<button id="back-to-student" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> ${backButton}</button>
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
        
        const headerWorkspaceLink = document.getElementById('workspace-link');
        if (headerWorkspaceLink && window.currentUser.role === 'student') {
            headerWorkspaceLink.classList.remove('hidden');
        }
        
        renderStudentDashboard();
    });

    const form = p.querySelector('#content-form');

    if (c.type === 'quiz') {
        form.addEventListener('submit', e => { e.preventDefault(); handleSubmitQuiz(c); });
        form.querySelectorAll('.btn-help').forEach(b => b.addEventListener('click', handleHelpRequest));
    
    } else if (isInteractiveHomework) {
        form.addEventListener('submit', e => { e.preventDefault(); handleSubmitNonQuiz(c); });
        form.querySelectorAll('.btn-help-exercice').forEach(b => b.addEventListener('click', handleHelpRequest));
    }
    
    const aidaHelpBtn = p.querySelector('#open-aida-help-btn');
    if (aidaHelpBtn) {
        aidaHelpBtn.addEventListener('click', () => {
            helpUsedInHomework = true;
            // Trouve l'objet 'assignment' correspondant à ce 'content'
            const assignment = studentDashboardData.todo.find(item => item.id === c.id) || 
                             studentDashboardData.pending.find(item => item.id === c.id) || 
                             c;
            showAidaHelpModal(c, assignment);
        });
    }

    const finishBtn = p.querySelector('#finish-exercise-btn');
    if (finishBtn) {
        finishBtn.addEventListener('click', async () => {
            sessionStorage.removeItem('isEvaluatedSession');
            try {
                await apiRequest('/student/submit-quiz', 'POST', { 
                    studentEmail: window.currentUser.email, classId: c.classId, contentId: c.id, 
                    title: c.title, score: 0, totalQuestions: 0, answers: [], helpUsed: false, teacherEmail: c.teacherEmail
                });
                
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
            <h2 data-i18n="library.title"><i class="fa-solid fa-book-bookmark"></i> ${i18next.t('library.title')}</h2>
        </div>
        <form id="library-search-form" style="display:flex; gap:1rem; margin-bottom: 2rem;">
            <input type="text" id="library-search-input" placeholder="${i18next.t('library.searchPlaceholder')}">
            <select id="library-subject-filter">
                <option value="" data-i18n="library.allSubjects">${i18next.t('library.allSubjects')}</option>
                <option value="Mathématiques" data-i18n="subjects.maths">${i18next.t('subjects.maths')}</option>
                <option value="Français" data-i18n="subjects.francais">${i18next.t('subjects.francais')}</option>
                <option value="Histoire-Géo" data-i18n="subjects.histoire-geo">${i18next.t('subjects.histoire-geo')}</option>
                <option value="Sciences" data-i18n="subjects.sciences">${i18next.t('subjects.sciences')}</option>
                <option value="Autre" data-i18n="subjects.autre">${i18next.t('subjects.autre')}</option>
            </select>
            <button type="submit" class="btn btn-main" data-i18n="library.searchButton">${i18next.t('library.searchButton')}</button>
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
        const results = await apiRequest(`/library?searchTerm=${encodeURIComponent(searchTerm)}&subject=${encodeURIComponent(subject)}`);
        grid.innerHTML = '';
        if (results.length === 0) {
            grid.innerHTML = `<p data-i18n="library.noContent">${i18next.t('library.noContent')}</p>`;
            return;
        }
        
        const typeLabel = i18next.t('library.typeLabel');
        const authorLabel = i18next.t('library.authorLabel');
        const importButton = i18next.t('library.importButton');

        results.forEach(content => {
            const subjectInfo = getSubjectInfo(content.title);
            const card = document.createElement('div');
            card.className = 'dashboard-card';
            const contentString = JSON.stringify(content).replace(/"/g, '&quot;');
            const typeDisplay = i18next.t(`contentTypes.${content.type.toLowerCase()}`, content.type);
            card.innerHTML = `
                <div class="dashboard-card-title"><h4>${content.title}</h4></div>
                <p><span class="subject-tag ${subjectInfo.cssClass}">${subjectInfo.name}</span></p>
                <p>${typeLabel} ${typeDisplay}</p>
                <p>${authorLabel} ${content.authorName}</p>
                <div style="text-align:right; margin-top: 1rem;">
                   <button class="btn btn-secondary import-content-btn" data-content="${contentString}">${importButton}</button>
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

function renderGradingModulePage() {
    const page = document.getElementById('grading-module-page');
    changePage('grading-module-page');
    
    page.innerHTML = `
        <div class="page-header">
            <h2 data-i18n="grading.title"><i class="fa-solid fa-magic-sparkles"></i> ${i18next.t('grading.title')}</h2>
            <button class="btn btn-secondary" id="back-to-teacher-dash-grading" data-i18n="grading.backButton"><i class="fa-solid fa-arrow-left"></i> ${i18next.t('grading.backButton')}</button>
        </div>
        
        <div class="card">
            <p class="subtitle" style="margin-bottom: 1.5rem;" data-i18n="grading.subtitle">${i18next.t('grading.subtitle')}</p>
            
            <form id="grading-form">
                <div class="form-group">
                    <label for="grading-sujet" data-i18n="grading.subjectLabel"><strong>${i18next.t('grading.subjectLabel')}</strong></label>
                    <textarea id="grading-sujet" rows="3" required placeholder="${i18next.t('grading.subjectPlaceholder')}"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="grading-criteres" data-i18n="grading.criteriaLabel"><strong>${i18next.t('grading.criteriaLabel')}</strong></label>
                    <textarea id="grading-criteres" rows="3" required placeholder="${i18next.t('grading.criteriaPlaceholder')}"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="grading-file" data-i18n="grading.filesLabel"><strong>${i18next.t('grading.filesLabel')}</strong></label>
                    <input type="file" id="grading-file" accept=".pdf,.jpg,.jpeg,.png" required multiple>
                </div>
                
                <button type="submit" class="btn btn-main" style="width: 100%;" data-i18n="grading.submitButton">
                    <i class="fa-solid fa-wand-sparkles"></i> ${i18next.t('grading.submitButton')}
                </button>
            </form>
        </div>
        
        <div id="grading-results" style="margin-top: 2rem;">
            </div>
    `;
    
    page.querySelector('#back-to-teacher-dash-grading').addEventListener('click', renderTeacherDashboard);
    page.querySelector('#grading-form').addEventListener('submit', handleGradingAnalysis);
}

async function handleGradingAnalysis(e) {
    e.preventDefault();
    const resultsContainer = document.getElementById('grading-results');
    resultsContainer.innerHTML = spinnerHtml;

    const sujet = document.getElementById('grading-sujet').value;
    const criteres = document.getElementById('grading-criteres').value;
    const files = document.getElementById('grading-file').files;

    if (!files || files.length === 0 || !sujet || !criteres) {
        resultsContainer.innerHTML = `<p class="error-message" data-i18n="grading.errorFillFields">${i18next.t('grading.errorFillFields')}</p>`;
        return;
    }

    const formData = new FormData();
    formData.append('sujet', sujet);
    formData.append('criteres', criteres);
    formData.append('lang', i18next.language);
    
    for (const file of files) {
        formData.append('copies', file);
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

        const results = await response.json(); 
        
        const resultTitle = i18next.t('grading.resultTitle');
        const resultSubtitle = i18next.t('grading.resultSubtitle', { file: files[0].name, count: files.length > 0 ? files.length - 1 : 0 });
        const globalAnalysis = i18next.t('grading.globalAnalysis');
        const detailedAnalysis = i18next.t('grading.detailedAnalysis');
        const noCriteria = i18next.t('grading.noCriteria');
        const finalGrade = i18next.t('grading.finalGrade');
        const studentComment = i18next.t('grading.studentComment');
        
        let html = `
            <div class="card" style="margin-bottom: 1.5rem;">
                <h3>${resultTitle}</h3>
                <p class="subtitle">${resultSubtitle}</p>
                
                <h4 style="margin-top: 1.5rem;">${globalAnalysis}</h4>
                <p>${results.analyseGlobale ? results.analyseGlobale.replace(/\\n/g, '<br>') : 'N/A'}</p>
                
                <h4 style="margin-top: 1.5rem;">${detailedAnalysis}</h4>
        `;
        
        if (results.criteres && Array.isArray(results.criteres)) {
            html += '<ul>';
            results.criteres.forEach(critere => {
                html += `<li><strong>${critere.nom} (${critere.note}):</strong> ${critere.commentaire}</li>`;
            });
            html += '</ul>';
        } else {
            html += `<p>${noCriteria}</p>`;
        }

        html += `
                <h4 style="margin-top: 1.5rem;">${finalGrade}</h4>
                <p style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${results.noteFinale || 'N/A'}</p>
                
                <h4 style="margin-top: 1.5rem;">${studentComment}</h4>
                <div class="student-answer-box">${results.commentaireEleve ? results.commentaireEleve.replace(/\\n/g, '<br>') : 'N/A'}</div>
            </div>
        `;
        
        resultsContainer.innerHTML = html;

    } catch (err) {
        resultsContainer.innerHTML = `<p class="error-message">Erreur: ${err.message}</p>`;
    }
}
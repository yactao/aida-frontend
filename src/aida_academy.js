// src/aida_academy.js

import { changePage } from './utils.js';

// Définition des rôles de l'Académie
const ACADEMY_ROLES = {
    STUDENT: 'academy_student',
    TEACHER: 'academy_teacher',
    PARENT: 'academy_parent'
};

// --- Nouveaux Dashboards de l'Académie MRE ---

export async function renderAcademyStudentDashboard() {
    const page = document.getElementById('student-dashboard-page');
    changePage('student-dashboard-page'); 
    page.innerHTML = `
        <h2>Bienvenue ${window.currentUser.firstName} sur l'Académie MRE! 🌍</h2>
        <p>Ce tableau de bord est en cours de construction (Phase 1/3 - Modularisé).</p>
        <p>Rôle : Élève. Prochaine étape : Le sélecteur de scénarios.</p>
    `;
}

export async function renderAcademyTeacherDashboard() {
    const page = document.getElementById('teacher-dashboard-page');
    changePage('teacher-dashboard-page'); 
    page.innerHTML = `
        <h2>Bienvenue ${window.currentUser.firstName} sur l'Académie MRE!</h2>
        <p>Ce tableau de bord est en cours de construction (Phase 1/3 - Modularisé).</p>
        <p>Rôle : Enseignant. Prochaine étape : Outil de création/attribution de scénarios.</p>
    `;
}

export async function renderAcademyParentDashboard() {
    const page = document.getElementById('student-dashboard-page'); 
    changePage('student-dashboard-page'); 
    page.innerHTML = `
        <h2>Bienvenue ${window.currentUser.firstName} sur l'Académie MRE!</h2>
        <p>Ce tableau de bord est en cours de construction (Phase 1/3 - Modularisé).</p>
        <p>Rôle : Parent. Prochaine étape : Le suivi intelligent de la progression.</p>
    `;
}

// Futurs exports pour la Phase 1: renderScenarioViewer, prototypeScenario, etc.
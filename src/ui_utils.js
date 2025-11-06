// src/ui_utils.js

import { changePage } from './utils.js';
// Importation des fonctions de redirection pour les deux systèmes
import { renderTeacherDashboard, renderStudentDashboard } from './aida_education.js'; 
import { renderAcademyStudentDashboard, renderAcademyTeacherDashboard, renderAcademyParentDashboard } from './aida_academy.js'; 


export function updateUI() {
    const currentUser = window.currentUser;
    const loggedIn = !!currentUser;
    const backendUrl = window.backendUrl;
    
    // Éléments DOM nécessaires à cette fonction
    const loginNavBtn = document.getElementById('login-nav-btn');
    const themeToggleHeaderBtn = document.getElementById('theme-toggle-header-btn');
    const userMenuContainer = document.querySelector('.user-menu-container');
    const workspaceLink = document.getElementById('workspace-link');
    const libraryLink = document.getElementById('library-link');
    const adminModuleLink = document.getElementById('admin-module-link');
    const userNameDisplay = document.getElementById('user-name-display');
    const userAvatarDisplay = document.getElementById('user-avatar-display');

    // NOUVEAU : Récupérer le conteneur du menu de langue
    const languageMenuContainer = document.querySelector('.language-menu-container');


    loginNavBtn.classList.toggle('hidden', loggedIn);
    themeToggleHeaderBtn.classList.toggle('hidden', loggedIn);
    userMenuContainer.classList.toggle('hidden', !loggedIn);
    
    // NOUVEAU : Gérer la visibilité du menu de langue
    // Il doit être caché si l'utilisateur est connecté (loggedIn = true)
    if (languageMenuContainer) {
        languageMenuContainer.classList.toggle('hidden', loggedIn);
    }
    
    if (loggedIn) {
        const isAcademyUser = currentUser.role.startsWith('academy_');
        const isTeacher = currentUser.role === 'teacher';

        userNameDisplay.textContent = currentUser.firstName;
        userAvatarDisplay.src = `${backendUrl}/avatars/${currentUser.avatar}`;
        adminModuleLink.classList.toggle('hidden', !isTeacher && !isAcademyUser); 
        
        // Gestion de la navigation (AIDA Éducation vs Académie)
        if (isAcademyUser) {
            // L'Académie n'utilise pas ces liens de navigation classiques
            workspaceLink.classList.add('hidden');
            libraryLink.classList.add('hidden');

            if (currentUser.role === 'academy_student') renderAcademyStudentDashboard();
            else if (currentUser.role === 'academy_teacher') renderAcademyTeacherDashboard();
            else if (currentUser.role === 'academy_parent') renderAcademyParentDashboard();
        } else {
            // AIDA Éducation classique
            workspaceLink.classList.toggle('hidden', currentUser.role !== 'student'); 
            libraryLink.classList.toggle('hidden', currentUser.role !== 'teacher');
            if (isTeacher) renderTeacherDashboard();
            else renderStudentDashboard();
        }
    } else {
        // Logique de déconnexion (inchangée)
        workspaceLink.classList.add('hidden');
        libraryLink.classList.add('hidden');
        changePage('home-page');
    }
}
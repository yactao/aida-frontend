// src/main.js - Le nouveau point d'entrée modulaire

// --- Importations des modules ---
import { renderAuthPage, renderAcademyAuthPage } from './auth.js';
import { updateUI } from './ui_utils.js'; 
import { renderModal, getModalTemplate, loadProgrammes } from './utils.js';
import { renderLibraryPage } from './aida_education.js'; 


// --- Configuration Globale (Exposée à window pour l'accessibilité inter-modules) ---
// Définition de l'URL du backend pour être utilisée par tous les modules via window
window.backendUrl = 'https://aida-backend-bqd0fnd2a3c7dadf.francecentral-01.azurewebsites.net'; 
window.currentUser = null;
window.programmes = {};
window.modalContainer = document.getElementById('modal-container');

// Définir les éléments DOM pour les listeners
const loginNavBtn = document.getElementById('login-nav-btn');
const startAppBtn = document.getElementById('start-app-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfoClickable = document.getElementById('user-info-clickable');
const userDropdown = document.querySelector('.user-dropdown');
const userMenuContainer = document.querySelector('.user-menu-container');
const homeLink = document.getElementById('home-link');
const themeToggleHeaderBtn = document.getElementById('theme-toggle-header-btn');
const themeToggleDropdownBtn = document.getElementById('theme-toggle-dropdown-btn');


// --- Fonctions du Flux d'Application ---

// Fonction qui déclenche le choix de plateforme (AIDA Éducation vs Académie MRE)
function showLoginChoiceModal() {
    const modalHtml = `
        <div style="text-align: center;">
            <h3 style="margin-bottom: 2rem;">Veuillez choisir votre plateforme de connexion</h3>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <button class="btn btn-main" id="select-aida-education" style="padding: 15px 30px;">
                    <i class="fa-solid fa-graduation-cap"></i> AÏDA Éducation (Classes & Devoirs)
                </button>
                <button class="btn btn-secondary" id="select-academie-mre" style="padding: 15px 30px;">
                    <i class="fa-solid fa-globe"></i> Académie MRE (Immersion Linguistique)
                </button>
            </div>
        </div>
    `;
    renderModal(getModalTemplate('login-choice-modal', 'Bienvenue sur AÏDA', modalHtml));

    document.getElementById('select-aida-education').addEventListener('click', () => {
        modalContainer.innerHTML = '';
        renderAuthPage(); // Appel du module auth.js
    });
    document.getElementById('select-academie-mre').addEventListener('click', () => {
        modalContainer.innerHTML = '';
        renderAcademyAuthPage(); // Appel du module auth.js
    });
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

// Fonction d'initialisation de l'application
async function init() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        window.currentUser = JSON.parse(savedUser);
    }
    
    // Chargement du thème et des programmes
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    await loadProgrammes(); 
    
    // Mise à jour de l'interface en fonction de l'utilisateur
    updateUI(); 

    // --- Écouteurs de navigation et d'état ---
    loginNavBtn.addEventListener('click', showLoginChoiceModal);
    startAppBtn.addEventListener('click', showLoginChoiceModal);
    
    logoutBtn.addEventListener('click', () => { 
        window.currentUser = null; 
        localStorage.removeItem('currentUser');
        updateUI(); 
    });
    
    userInfoClickable.addEventListener('click', () => userDropdown.classList.toggle('hidden'));
    window.addEventListener('click', (e) => {
        if (userMenuContainer && !userMenuContainer.contains(e.target)) {
            userDropdown.classList.add('hidden');
        }
    });

    themeToggleHeaderBtn.addEventListener('click', toggleTheme);
    themeToggleDropdownBtn.addEventListener('click', toggleTheme);
    
    // Ajout du listener de la librairie (doit être importé de aida_education.js)
    const libraryLink = document.getElementById('library-link');
    if (libraryLink) {
        libraryLink.addEventListener('click', (e) => { e.preventDefault(); renderLibraryPage(); }); 
    }


    // Redirection de la home page après connexion (la logique des rôles est dans updateUI)
    homeLink.addEventListener('click', () => { 
        if(window.currentUser) {
            updateUI();
        } else { 
            changePage('home-page'); 
        } 
    });
    
    // Animation de la home page (restaurée depuis l'ancien script.js)
    const wrapper = document.querySelector('#intro-animation-wrapper');
    const finalWrapper = document.querySelector('#aida-final-text');
    if (wrapper && finalWrapper) {
        setTimeout(() => {
            wrapper.style.display = 'none';
            finalWrapper.style.display = 'flex';
        }, 10000); 
    }
}

document.addEventListener('DOMContentLoaded', init);
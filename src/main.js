// src/main.js - Le nouveau point d'entrée modulaire

// --- Importations des modules ---
import { renderAuthPage, renderAcademyAuthPage } from './auth.js';
import { updateUI } from './ui_utils.js'; 
import { renderModal, getModalTemplate, loadProgrammes } from './utils.js';
import { renderLibraryPage } from './aida_education.js'; 


// --- Configuration Globale (Exposée à window pour l'accessibilité inter-modules) ---
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

// NOUVEAU : Éléments DOM pour i18n
const languageSwitcherBtn = document.getElementById('language-switcher-btn');
const languageDropdown = document.getElementById('language-dropdown');
const languageMenuContainer = document.querySelector('.language-menu-container');
const currentLangDisplay = document.getElementById('current-language-display');


// --- NOUVEAU : Logique d'Internationalisation (i18next) ---

// Met à jour le texte de tous les éléments avec l'attribut [data-i18n]
async function updateTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        // Utilise .t() pour obtenir la traduction.
        // i18next gère les clés imbriquées (ex: "home.title")
        el.innerHTML = i18next.t(key) || el.innerHTML;
    });

    // Mettre à jour le texte du bouton principal
    const lang = i18next.language;
    if (currentLangDisplay) {
        if (lang === 'fr') currentLangDisplay.textContent = i18next.t('nav.lang_fr');
        else if (lang === 'en') currentLangDisplay.textContent = i18next.t('nav.lang_en');
        else if (lang === 'ar') currentLangDisplay.textContent = i18next.t('nav.lang_ar');
    }

    // Mettre à jour la classe 'active' dans le dropdown
    document.querySelectorAll('.language-option').forEach(opt => {
        // Supprime l'icône check de tous...
        const icon = opt.querySelector('i');
        if (icon) icon.style.opacity = 0;
        // Ajoute la classe 'active' au bon
        opt.classList.toggle('active', opt.dataset.lang === lang);
    });
    // ...et l'ajoute au bon
    const activeOption = document.querySelector(`.language-option[data-lang="${lang}"]`);
    if (activeOption && activeOption.querySelector('i')) {
        activeOption.querySelector('i').style.opacity = 1;
    }

    // Gérer la direction du texte (RTL) pour l'arabe
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
    // Gérer l'alignement du header pour RTL
    document.querySelector('header').style.direction = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelector('.main-nav').style.direction = lang === 'ar' ? 'rtl' : 'ltr';

    // (Nous devrons peut-être ajouter plus de styles RTL dans style.css plus tard)
}

// Initialise i18next
async function initI18n() {
    await i18next
        .use(i18nextHttpBackend)
        .init({
            lng: localStorage.getItem('language') || 'fr', // Langue par défaut
            fallbackLng: 'fr',
            backend: {
                loadPath: '/locales/{{lng}}.json', // Chemin vers vos fichiers de traduction
            },
            debug: false // Mettez à true pour voir les logs
        });
    
    // Applique les traductions au chargement
    await updateTranslations();

    // Ajoute les listeners pour le nouveau menu
    if (languageSwitcherBtn) {
        languageSwitcherBtn.addEventListener('click', () => {
            languageDropdown.classList.toggle('hidden');
        });
    }

    // Listener global pour fermer le dropdown
    window.addEventListener('click', (e) => {
        if (languageMenuContainer && !languageMenuContainer.contains(e.target)) {
            languageDropdown.classList.add('hidden');
        }
    });

    document.querySelectorAll('.language-option').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const lang = e.currentTarget.dataset.lang;
            if (lang === i18next.language) {
                languageDropdown.classList.add('hidden');
                return; 
            }
            
            await i18next.changeLanguage(lang);
            localStorage.setItem('language', lang);
            await updateTranslations();
            languageDropdown.classList.add('hidden');
        });
    });
}
// --- Fin de la logique i18n ---


// --- Logique pour les fonds d'écran dynamiques ---
const backgrounds = {
    light: [
        'assets/backgrounds/clouds-light.png',
        'assets/backgrounds/trees-light.png',
        'assets/backgrounds/mountains.png'
    ],
    dark: [
        'assets/backgrounds/clouds-dark.png',
        'assets/backgrounds/trees-dark.png',
        'assets/backgrounds/moon.png',
        'assets/backgrounds/mountains.png'
    ]
};

function setRandomBackgroundImage() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const bgList = isDarkMode ? backgrounds.dark : backgrounds.light;
    
    if (!bgList || bgList.length === 0) return;

    const randomIndex = Math.floor(Math.random() * bgList.length);
    const selectedImage = bgList[randomIndex];

    const dynamicBgDiv = document.getElementById('dynamic-background-image');
    if (dynamicBgDiv) {
        dynamicBgDiv.style.backgroundImage = `url('${selectedImage}')`;
    }
}


// --- Fonctions du Flux d'Application ---

// Fonction qui déclenche le choix de plateforme (AIDA Éducation vs Académie MRE)
function showLoginChoiceModal() {
    const modalHtml = `
        <div style="text-align: center;">
            <h3 style="margin-bottom: 2rem;" data-i18n="loginChoice.title">Veuillez choisir votre plateforme de connexion</h3>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <button class="btn btn-main" id="select-aida-education" style="padding: 15px 30px;">
                    <i class="fa-solid fa-graduation-cap"></i> <span data-i18n="loginChoice.education">AÏDA Éducation (Classes & Devoirs)</span>
                </button>
                <button class="btn btn-secondary" id="select-academie-mre" style="padding: 15px 30px;">
                    <i class="fa-solid fa-globe"></i> <span data-i18n="loginChoice.academy">Académie MRE (Immersion Linguistique)</span>
                </button>
            </div>
        </div>
    `;
    renderModal(getModalTemplate('login-choice-modal', 'Bienvenue sur AÏDA', modalHtml));

    // Traduit le contenu de la modale
    updateTranslations();

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
    setRandomBackgroundImage();
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
    
    // MODIFIÉ : Initialise i18next AVANT de charger le reste
    await initI18n(); 
    
    await loadProgrammes(); 
    
    // Mise à jour de l'interface en fonction de l'utilisateur
    updateUI(); 

    // Appelle la fonction de fond d'écran
    setRandomBackgroundImage();

    // --- Écouteurs de navigation et d'état ---
    loginNavBtn.addEventListener('click', showLoginChoiceModal);
    startAppBtn.addEventListener('click', showLoginChoiceModal);
    
    logoutBtn.addEventListener('click', () => { 
        window.currentUser = null; 
        localStorage.removeItem('currentUser');
        updateUI(); 
    });
    
    userInfoClickable.addEventListener('click', () => userDropdown.classList.toggle('hidden'));
    
    // MODIFIÉ : Le listener global de clic ferme aussi le dropdown de langue
    window.addEventListener('click', (e) => {
        if (userMenuContainer && !userMenuContainer.contains(e.target)) {
            userDropdown.classList.add('hidden');
        }
        // NOUVEAU
        if (languageMenuContainer && !languageMenuContainer.contains(e.target)) {
            languageDropdown.classList.add('hidden');
        }
    });

    themeToggleHeaderBtn.addEventListener('click', toggleTheme);
    themeToggleDropdownBtn.addEventListener('click', toggleTheme);
    
    const libraryLink = document.getElementById('library-link');
    if (libraryLink) {
        libraryLink.addEventListener('click', (e) => { e.preventDefault(); renderLibraryPage(); }); 
    }

    homeLink.addEventListener('click', () => { 
        if(window.currentUser) {
            updateUI();
        } else { 
            changePage('home-page'); 
        } 
    });
    
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
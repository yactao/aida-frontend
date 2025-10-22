// src/utils.js

const main = document.querySelector('main');

export const spinnerHtml = `<div class="spinner"><div class="dot1"></div><div class="dot2"></div><div class="dot3"></div></div>`;


export async function apiRequest(endpoint, method = 'GET', body = null) {
    try {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);
        
        let fullEndpoint = endpoint;

        // 1. Assurer que l'endpoint commence par '/api'
        if (!fullEndpoint.startsWith('/api')) {
             fullEndpoint = `/api${fullEndpoint}`;
        }
        
        // 2. Nettoyage final pour éviter les doubles barres obliques
        fullEndpoint = fullEndpoint.replace('//', '/');
        
        // CORRECTION CLÉ: Accéder à window.backendUrl (défini dans main.js)
        const res = await fetch(`${window.backendUrl}${fullEndpoint}`, opts); 
        
        if (!res.ok) {
            const errText = await res.text();
            try {
                const err = JSON.parse(errText);
                throw new Error(err.error || 'Une erreur est survenue');
            } catch (e) {
                // Remonter le message d'erreur brut (résout le problème 404/405)
                throw new Error(errText);
            }
        }
        return res.status === 204 ? null : res.json();
    } catch (e) {
        console.error(`API Error:`, e);
        throw e;
    }
}

export function changePage(id) {
    main.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

export function getModalTemplate(id, title, html) {
    return `<div class="modal-overlay" id="${id}"><div class="modal-content"><button class="close-modal">&times;</button><h3>${title}</h3>${html}</div></div>`;
}

export function renderModal(template) {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = template;
    modalContainer.querySelector('.close-modal')?.addEventListener('click', () => modalContainer.innerHTML = '');
}

export async function loadProgrammes() {
    try {
        const fetchProgram = async (fileName) => {
            // CORRECTION CLÉ: Accéder à window.backendUrl
            const response = await fetch(`${window.backendUrl}/${fileName}`);
            if (!response.ok) { throw new Error(`Le fichier ${fileName} est introuvable ou illisible (statut: ${response.status}).`); }
            return response.json();
        };
        const [p, c, l] = await Promise.all([ fetchProgram('programmes-primaire.json'), fetchProgram('programmes-college.json'), fetchProgram('programmes-lycee.json') ]);
        window.programmes = { Primaire: p, Collège: c, Lycée: l };
        console.log("Programmes chargés avec succès.");
    } catch (e) {
        console.error("Erreur critique lors du chargement des programmes:", e);
        window.programmes = {};
    }
}

// --- AJOUT DES FONCTIONS UTILITAIRES GÉNÉRIQUES ---

export function getSubjectInfo(title) {
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

export function getAppreciationText(appreciationKey) {
    const map = {
        acquis: 'Acquis',
        en_cours: "En cours d'acquisition",
        non_acquis: 'Non acquis',
        a_revoir: 'À revoir'
    };
    return map[appreciationKey] || 'Validé';
}
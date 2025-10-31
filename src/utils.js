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
                // Remonter le message d'erreur brut
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


// --- AJOUT DE LA FONCTION D'AIDE MODALE ( showAidaHelpModal ) ---

// Fonction générique pour afficher la modal d'aide d'AIDA 
// MODIFIÉ : Accepte 'level' comme deuxième argument
export async function showAidaHelpModal(prompt, level = 'N/A') {
    // NOTE: Utilise les fonctions exportées: renderModal, getModalTemplate, apiRequest
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
    
    // 'level' (issu de la portée de showAidaHelpModal) est utilisé ici
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
            // Appel à la route Back-End pour l'aide
            // MODIFIÉ : Envoi du 'level' avec l'historique
            const response = await apiRequest('/api/ai/get-aida-help', 'POST', {
                history: history,
                level: level // Envoi du niveau au backend
            });
            
            const aidaResponse = response.response;
            appendMessage('aida', aidaResponse);
            history.push({ role: 'assistant', content: aidaResponse });

        } catch (err) {
            errorDiv.textContent = 'Erreur: Aide indisponible (' + err.message + ')';
            history.pop(); 
        } finally {
            spinner.classList.add('hidden');
        }
    };

    chatForm.addEventListener('submit', sendMessage);
    
    if (prompt) {
        // CORRECTION: Déclencher directement la fonction de soumission de manière asynchrone
        // sans passer par un événement dispatché, pour plus de stabilité.
        (async () => {
            const initialMessage = chatInput.value.trim();
            if (initialMessage) {
                // Simuler l'envoi direct du premier message
                await sendMessage({ preventDefault: () => {} }); 
            }
        })();
    }
}

// --- AJOUT DES FONCTIONS UTILITAIRES GÉNÉRIQUES (Anciennes) ---

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
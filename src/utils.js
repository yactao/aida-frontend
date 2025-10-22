// src/utils.js

const main = document.querySelector('main');
// NOTE: backendUrl est maintenant défini dans main.js et accessible via window.backendUrl
const getBackendUrl = () => window.backendUrl;
export const spinnerHtml = `<div class="spinner"><div class="dot1"></div><div class="dot2"></div><div class="dot3"></div></div>`;


export async function apiRequest(endpoint, method = 'GET', body = null) {
    try {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);
        
        let fullEndpoint = endpoint;

 
        if (!fullEndpoint.startsWith('/api')) {
            
             fullEndpoint = `/api${fullEndpoint}`;
        }
        
        fullEndpoint = fullEndpoint.replace('//', '/');
        
        const res = await fetch(`${getBackendUrl()}${fullEndpoint}`, opts);
        
        if (!res.ok) {
            const errText = await res.text();
            try {
                const err = JSON.parse(errText);
                throw new Error(err.error || 'Une erreur est survenue');
            } catch (e) {
                // Remonter le message d'erreur brut (souvent HTML en cas de 404)
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
// src/aida_academy.js - Logique complète pour l'Académie d'Arabe Littéraire (Mode Dynamique)

import { changePage, spinnerHtml, apiRequest, renderModal, getModalTemplate } from './utils.js';

// --- Variables d'état vocal pour le module ---
let recognition;
let currentAudio = null;
let currentListenBtn = null; 

// --- DONNÉES SIMULÉES (SUPPRIMÉES) ---
// const simulatedStudentsData = [...] // Données simulées supprimées


// --- Fonctions de Configuration et d'Aide ---

// Fonction pour définir la personnalité de l'IA (le "system prompt")
function getAcademySystemPrompt(scenario) {
    // Détection dynamique du mode Répétiteur par ID pour la logique de prompt
    const isRepeaterMode = scenario.id === 'scen-0'; 

    return `Tu es un tuteur expert en immersion linguistique. Ton rôle actuel est celui de "${scenario.characterName}" dans le contexte suivant : "${scenario.context}". La conversation doit se dérouler **UNIQUEMENT en Arabe Littéraire (Al-Fusha)**. 
    
    // Instructions spécifiques au mode Répétiteur
    ${isRepeaterMode ? 
        "TON OBJECTIF PRINCIPAL est de fournir une phrase ou un mot, puis d'attendre que l'élève le **répète le plus fidèlement possible**. Tu dois féliciter pour la réussite ('ممتاز!') et encourager pour l'échec ('حاول مجدداً.'). Passe à la phrase cible suivante seulement après la réussite." 
        : 
        "Tes objectifs sont de converser et de guider l'élève vers l'accomplissement des objectifs du scénario."
    }

    // INSTRUCTIONS CLÉS POUR LE FORMATAGE et l'IA :
    // 1. Ton message doit commencer par la phrase en Arabe Littéraire.
    // 2. À la suite de la phrase (sur la même ligne), tu dois ajouter la phonétique et la traduction, EN UTILISANT CE FORMAT STRICT:
    //    <PHONETIQUE>Ta transcription phonétique</PHONETIQUE> <TRADUCTION>Ta traduction française</TRADUCTION>
    // 3. N'utilise pas d'autres balises dans ta réponse.
    
    Tes objectifs clés sont :
    1.  **Incarnation du Personnage** : Maintiens le rôle.
    2.  **Pédagogie et Soutien** : Les corrections doivent se concentrer sur la **Grammaire et Vocabulaire de l'Arabe Littéraire**.
    3.  **Suivi des Objectifs** : ${scenario.objectives.join(', ')}.
    4.  **Focalisation Fusha** : Concentre les interactions sur l'usage pratique de l'**Arabe Littéraire**.
    5.  **Format de Réponse** : Réponds toujours en tant que le personnage.`;
}


// --- 2. Fonctions Vocales (Push-to-Talk et TTS) ---

function setupSpeechRecognition(micBtn, userInput, chatForm) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        micBtn.disabled = true;
        micBtn.title = "La reconnaissance vocale n'est pas supportée par votre navigateur.";
        return;
    }
    recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA'; 
    recognition.interimResults = false;
    recognition.continuous = false; 
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
    };
    
    recognition.onstart = () => {
        micBtn.classList.add('recording');
        micBtn.innerHTML = '<i class="fa-solid fa-square"></i>'; 
    };
    
    recognition.onend = () => {
        micBtn.classList.remove('recording');
        micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>'; 
    };
    
    recognition.onerror = (event) => {
        console.error("Erreur de reconnaissance vocale:", event.error);
        micBtn.classList.remove('recording');
        micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
    };
}

function startListening() {
    if (recognition && !recognition.recognizing) {
        recognition.start();
    }
}

function stopListening() {
    if (recognition) {
        recognition.stop();
    }
}

async function togglePlayback(text, buttonEl) {
    // Correction TTS: Extraire le texte Arabe Pur pour la lecture
    let textToRead = text;
    const firstTagIndex = Math.min(
        text.indexOf('<PHONETIQUE>') > -1 ? text.indexOf('<PHONETIQUE>') : Infinity,
        text.indexOf('<TRADUCTION>') > -1 ? text.indexOf('<TRADUCTION>') : Infinity
    );
    if (firstTagIndex !== Infinity) {
        textToRead = text.substring(0, firstTagIndex).trim();
    }
    
    if (currentListenBtn === buttonEl) {
        if(currentAudio) currentAudio.pause();
        buttonEl.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        buttonEl.classList.remove('active-speaker');
        currentAudio = null;
        currentListenBtn = null;
        return;
    }

    if (currentAudio) {
        currentAudio.pause();
        if (currentListenBtn) {
            currentListenBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            currentListenBtn.classList.remove('active-speaker');
        }
    }

    currentListenBtn = buttonEl;
    buttonEl.innerHTML = `<div class="spinner-dots" style="transform: scale(0.6);"><span></span><span></span><span></span></div>`;

    try {
        const voice = 'ar-XA-Wavenet-B'; 
        const rate = 1.0;
        const pitch = 0.0;

        const response = await apiRequest('/api/ai/synthesize-speech', 'POST', { text: textToRead, voice, rate, pitch });
        
        const audioBlob = await (await fetch(`data:audio/mp3;base64,${response.audioContent}`)).blob(); 
        const audioUrl = URL.createObjectURL(audioBlob);
        
        currentAudio = new Audio(audioUrl);
        currentAudio.play();
        
        buttonEl.innerHTML = '<i class="fa-solid fa-stop"></i>';
        buttonEl.classList.add('active-speaker');

        currentAudio.onended = () => {
            buttonEl.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            buttonEl.classList.remove('active-speaker');
            currentAudio = null;
            currentListenBtn = null;
        };

    } catch (error) {
        console.error("Erreur lors de la lecture de l'audio neuronal:", error);
        buttonEl.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        currentListenBtn = null;
        alert(`Impossible de jouer la voix du Serveur. Erreur: ${error.message}`);
    }
}


// --- 3. Logique de Bilan et de Sauvegarde (avec Parsing Robuste) ---

async function endScenarioSession(scenario, history) {
    const spinner = document.getElementById('scenario-spinner');
    const errorDisplay = document.getElementById('scenario-error');
    const chatForm = document.getElementById('scenario-chat-form');
    
    chatForm.style.pointerEvents = 'none';
    spinner.classList.remove('hidden');
    
    const finalPrompt = { 
        role: 'user', 
        content: `La session est terminée. Votre dernière réponse doit être un **JSON valide** contenant le bilan de l'élève. Le JSON doit avoir la structure suivante : 
        { "summaryTitle": "Bilan de Session", "score": "N/A", "completionStatus": "Completed", "feedback": ["..."], "newVocabulary": [{"word": "...", "translation": "..."}] }
        Le feedback doit se concentrer sur les erreurs de Grammaire/Vocabulaire Arabe Littéraire observées dans notre conversation. Ne donnez aucune autre réponse que le JSON.`
    };
    
    history.push(finalPrompt);

    try {
        const response = await apiRequest('/api/academy/ai/chat', 'POST', { history, response_format: { type: "json_object" } });
        
        history.pop(); 
        
        let report;
        try {
            // LOGIQUE DE PARSING ROBUSTE: Extrait le JSON
            const jsonString = response.reply.match(/\{[\s\S]*\}/)?.[0];
            
            if (!jsonString) {
                throw new Error("Aucun objet JSON structuré n'a pu être détecté.");
            }
            
            report = JSON.parse(jsonString); 
        } catch(e) {
            console.error("Erreur critique de parsing JSON du rapport IA:", e, "Réponse brute:", response.reply);
            report = { summaryTitle: "Bilan Indisponible (Erreur Critique)", completionStatus: "Erreur", feedback: [`L'IA n'a pas pu générer le rapport structuré. Détails: ${e.message}`], newVocabulary: [] };
        }
        
        // 2. Sauvegarder la Session (Backend)
        try {
             await apiRequest('/api/academy/session/save', 'POST', {
                userId: window.currentUser.id,
                scenarioId: scenario.id,
                report: report,
                fullHistory: history 
            });
        } catch (e) {
            console.warn("Erreur lors de la sauvegarde du bilan (Vérifiez server.js):", e.message);
        }

        // 3. Afficher le Bilan à l'élève
        showSessionReportModal(report);

    } catch (err) {
        errorDisplay.textContent = `Erreur lors de la génération du bilan: ${err.message}`;
    } finally {
        spinner.classList.add('hidden');
    }
}

function showSessionReportModal(report) {
    // Assurer que les tableaux existent avant le .map
    const vocabHtml = (report.newVocabulary || []).map(v => `<li><strong>${v.word}</strong>: ${v.translation}</li>`).join('') || '<li>Aucun nouveau vocabulaire relevé.</li>';
    const feedbackHtml = (report.feedback || []).map(f => `<li>${f}</li>`).join('') || '<li>Aucun point de feedback majeur.</li>';
    
    const html = `
        <div style="padding: 1rem;">
            <h3 style="color: var(--primary-color); margin-bottom: 1rem;">${report.summaryTitle}</h3>
            <p><strong>Statut :</strong> ${report.completionStatus}</p>
            
            <h4 style="margin-top: 1.5rem;">Points de Feedback Pédagogique :</h4>
            <ul style="list-style-type: disc; padding-left: 20px;">${feedbackHtml}</ul>
            
            <h4 style="margin-top: 1.5rem;">Vocabulaire Arabe Littéraire Relevé :</h4>
            <ul style="list-style-type: none; padding-left: 0;">${vocabHtml}</ul>
            
            <button class="btn btn-main" style="width: 100%; margin-top: 2rem;" onclick="window.modalContainer.innerHTML=''; window.location.reload();">
                <i class="fa-solid fa-arrow-right"></i> Retour au tableau de bord
            </button>
        </div>
    `;

    renderModal(getModalTemplate('session-report-modal', 'Bilan de votre Session', html));
}


// --- 4. Outil de Création de Scénarios (pour l'Enseignant) ---

function getScenarioCreatorTemplate() {
    return `
        <form id="scenario-creator-form">
            <div class="form-group">
                <label for="scen-title">Titre du Scénario</label>
                <input type="text" id="scen-title" required placeholder="Ex: Commander des légumes au marché">
            </div>
            <div class="form-group">
                <label for="scen-context">Contexte (Pour l'IA)</label>
                <textarea id="scen-context" rows="2" required placeholder="Ex: Vous êtes un vendeur de fruits et légumes au souk d'Amman."></textarea>
            </div>
            <div class="form-group">
                <label for="scen-objectives">Objectifs de l'Élève (Séparés par une virgule)</label>
                <input type="text" id="scen-objectives" required placeholder="Ex: Saluer, Demander le prix, Négocier un peu, Dire au revoir">
            </div>
            <div class="form-group">
                <label for="scen-intro">Phrase d'Introduction de l'IA (Doit contenir les balises d'aide)</label>
                <textarea id="scen-intro" rows="4" required 
                    placeholder="Ex: أهلاً، ماذا تريد؟ <PHONETIQUE>Ahlan, mādhā turīd?</PHONETIQUE> <TRADUCTION>Bonjour, que voulez-vous ?</TRADUCTION>"></textarea>
                <small id="intro-warning" style="color: var(--incorrect-color);">**ATTENTION :** La phrase d'introduction doit contenir les balises &lt;PHONETIQUE&gt; et &lt;TRADUCTION&gt;.</small>
            </div>
            
            <button type="submit" class="btn btn-main" style="width: 100%; margin-top: 1rem;">
                <i class="fa-solid fa-save"></i> Enregistrer le Scénario
            </button>
            <p id="creator-error" class="error-message" style="margin-top: 10px;"></p>
        </form>
    `;
}

function renderScenarioCreatorModal() {
    const title = "Créer un Nouveau Scénario d'Immersion";
    const content = getScenarioCreatorTemplate();
    renderModal(getModalTemplate('scenario-creator-modal', title, content));
    
    const form = document.getElementById('scenario-creator-form');
    const errorDisplay = document.getElementById('creator-error');
    const introField = document.getElementById('scen-intro');
    const warningText = document.getElementById('intro-warning');
    const submitBtn = form.querySelector('button[type="submit"]');

    function validateIntroFormat() {
        const text = introField.value;
        const hasPhonetic = text.includes('<PHONETIQUE>') && text.includes('</PHONETIQUE>');
        const hasTranslation = text.includes('<TRADUCTION>') && text.includes('</TRADUCTION>');
        
        if (hasPhonetic && hasTranslation) {
            warningText.textContent = "Format du message d'introduction validé. 👍";
            warningText.style.color = 'var(--success-color)';
            submitBtn.disabled = false;
        } else {
            warningText.textContent = "**ATTENTION :** La phrase d'introduction doit contenir les balises <PHONETIQUE> et <TRADUCTION>.";
            warningText.style.color = 'var(--incorrect-color)'; 
        }
    }

    introField.addEventListener('input', validateIntroFormat);
    validateIntroFormat();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDisplay.textContent = '';
        submitBtn.disabled = true;

        const objectivesArray = document.getElementById('scen-objectives').value
            .split(',').map(o => o.trim()).filter(o => o.length > 0);

        const newScenarioData = {
            title: document.getElementById('scen-title').value,
            context: document.getElementById('scen-context').value,
            characterIntro: document.getElementById('scen-intro').value,
            objectives: objectivesArray,
            language: "Arabe Littéraire (Al-Fusha)", 
            level: "Personnalisé"
        };
        
        try {
            const response = await apiRequest('/api/academy/scenarios/create', 'POST', newScenarioData);
            
            errorDisplay.style.color = 'var(--success-color)';
            errorDisplay.textContent = `Scénario "${response.scenario.title}" créé! Actualisation...`;
            
            setTimeout(() => {
                window.modalContainer.innerHTML = '';
                // Rafraîchir le bon dashboard (élève ou enseignant)
                if (window.currentUser.role === 'academy_student') {
                    renderAcademyStudentDashboard();
                } else {
                    renderAcademyTeacherDashboard();
                }
            }, 1500);

        } catch (err) {
            errorDisplay.style.color = 'var(--incorrect-color)';
            errorDisplay.textContent = `Erreur de création: ${err.message}`;
            submitBtn.disabled = false;
        }
    });
}

// --- Nouvelle fonction pour afficher la gestion des scénarios créés par le professeur ---
async function renderTeacherScenarioManagement(page) {
    let availableScenarios = [];
    try {
        // Récupérer tous les scénarios
        availableScenarios = await apiRequest('/api/academy/scenarios', 'GET'); 
    } catch (e) {
        page.querySelector('.scenario-management-section').innerHTML = `<h3 class="error-message">Erreur : Impossible de charger les scénarios.</h3>`;
        return;
    }
    
    // Filtrage: Ne montrer que les scénarios custom créés par l'enseignant
    // NOTE: Actuellement, nous filtrons par ID pour exclure les prototypes 'scen-0' et 'scen-1'
    const customScenarios = availableScenarios.filter(s => s.id.startsWith('scen-') && s.id !== 'scen-0' && s.id !== 'scen-1');

    let html = `
        <h3>Gestion des Scénarios Personnalisés (${customScenarios.length})</h3>
        <p class="subtitle">Assignez ces scénarios à vos élèves pour les rendre disponibles sur leur tableau de bord.</p>
        
        <div class="dashboard-grid scenario-management-grid" style="margin-top: 1rem;">
    `;

    if (customScenarios.length === 0) {
        html += `<p style="margin-top: 1rem; color: var(--text-color-secondary);">Aucun scénario créé. Utilisez le bouton "Créer un Scénario" ci-dessus.</p>`;
    } else {
        customScenarios.forEach(scen => {
            // Affichage de l'aperçu du scénario (sans bouton "Commencer" pour le prof)
            const introPreview = scen.characterIntro.replace(/<PHONETIQUE>.*?<\/PHONETIQUE>|<TRADUCTION>.*?<\/TRADUCTION>/g, '').trim();
            
            html += `
                <div class="dashboard-card" data-scenario-id="${scen.id}" style="border-left: 5px solid var(--warning-color);">
                    <h4>${scen.title}</h4>
                    <p>Niveau: <strong>${scen.level}</strong></p>
                    <p style="font-size: 0.9em; margin-top: 10px;">Intro: ${introPreview.substring(0, 50)}...</p>
                    <div style="text-align: right; margin-top: 1rem;">
                        <button class="btn btn-secondary view-scenario-details-btn" data-scenario-id="${scen.id}">
                            <i class="fa-solid fa-user-plus"></i> Détails / Assignation
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    
    page.querySelector('.scenario-management-section').innerHTML = html;
    
    // NOTE: Ajouter ici les listeners pour l'assignation si vous créez cette fonctionnalité.
}

// --- 5. Fonctions de Rendu du Dashboard (Élève et Enseignant) ---

export async function renderAcademyStudentDashboard() {
    const page = document.getElementById('student-dashboard-page');
    changePage('student-dashboard-page'); 

    // Récupération dynamique des scénarios via l'API (depuis la DB)
    let availableScenarios = [];
    try {
        availableScenarios = await apiRequest('/api/academy/scenarios', 'GET'); 
    } catch (e) {
        console.error("Erreur lors du chargement des scénarios:", e);
        page.innerHTML = `<h2>Erreur de Connexion</h2><p class="error-message">Impossible de charger la liste des scénarios. Vérifiez la connexion API du Back-End.</p>`;
        return;
    }

    // Récupérer les sessions
    const sessions = window.currentUser.academyProgress?.sessions || []; 
    sessions.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)); 

    let html = `
        <h2>Bienvenue ${window.currentUser.firstName} sur l'Académie d'Arabe Littéraire ! 📚</h2>
        <p class="subtitle">Pratiquez l'Arabe Littéraire (Al-Fusha) en immersion totale.</p>

        <h3 style="margin-top: 2rem;">Vos Scénarios d'Immersion</h3>
        <div class="dashboard-grid">
    `;

    // Affichage des scénarios chargés dynamiquement
    availableScenarios.forEach(scen => {
        html += `
            <div class="dashboard-card primary-card" data-scenario-id="${scen.id}" style="cursor: pointer;">
                <h4>${scen.title}</h4>
                <p>Langue : <strong>${scen.language}</strong></p>
                <p>Niveau : ${scen.level}</p>
                <p style="margin-top: 1rem;">Objectif: ${scen.objectives?.[0] || 'Objectif non spécifié'}...</p>
                <div style="text-align: right; margin-top: 1rem;">
                    <button class="btn btn-main start-scenario-btn" data-scenario-id="${scen.id}"><i class="fa-solid fa-play"></i> Commencer</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';

    // AFFICHAGE DES SESSIONS TERMINÉES
    if (sessions.length > 0) {
        html += `
            <h3 style="margin-top: 3rem;">Historique de vos Sessions (${sessions.length})</h3>
            <div class="dashboard-grid sessions-grid">
        `;

        sessions.forEach((session, index) => {
            const date = new Date(session.completedAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            });
            const title = (session.report?.summaryTitle || 'Bilan de session');
            const status = session.report?.completionStatus || 'Terminée';
            const feedbackPreview = session.report?.feedback[0] || 'Cliquez pour les détails.';
            
            html += `
                <div class="dashboard-card clickable-session" data-session-index="${index}" style="cursor: pointer;">
                    <p style="font-size: 0.9em; color: var(--text-color-secondary); margin-bottom: 5px;">${date}</p>
                    <h5 style="color: var(--primary-color);">${title}</h5>
                    <p style="font-size: 0.9em;">Statut : <strong>${status}</strong></p>
                    <p style="font-style: italic; margin-top: 10px;">Feedback : ${feedbackPreview}</p>
                    <div style="text-align: right; margin-top: 1rem;">
                        <button class="btn btn-secondary view-report-btn" data-session-index="${index}"><i class="fa-solid fa-eye"></i> Voir Rapport</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    } else {
        html += `<p style="margin-top: 2rem; color: var(--text-color-secondary);"><i class="fa-solid fa-info-circle"></i> Aucune session n'a encore été enregistrée.</p>`;
    }
    
    page.innerHTML = html;

    // Gestion du clic pour démarrer le scénario
    page.querySelectorAll('.start-scenario-btn, .dashboard-card.primary-card').forEach(element => {
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            const scenarioId = e.currentTarget.dataset.scenarioId;
            const selectedScenario = availableScenarios.find(s => s.id === scenarioId);
            if (selectedScenario) {
                renderScenarioViewer(selectedScenario);
            }
        });
    });

    // Gestion du clic pour afficher le rapport de session
    page.querySelectorAll('.clickable-session, .view-report-btn').forEach(element => {
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = e.currentTarget.dataset.sessionIndex;
            if (index !== undefined) {
                const sessionReport = sessions[index].report;
                showSessionReportModal(sessionReport);
            }
        });
    });
}

// Fonction pour afficher le détail d'un élève (utilisée par le dashboard Enseignant)
function renderTeacherStudentDetail(student) {
    const page = document.getElementById('teacher-dashboard-page');
    changePage('teacher-dashboard-page'); 

    const sessions = student.academyProgress?.sessions || [];
    sessions.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    
    let html = `
        <button id="back-to-teacher-dash" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> Retour au Tableau de Bord</button>
        
        <h2 style="margin-top: 1rem;">Progression de ${student.firstName}</h2>
        <p class="subtitle">${sessions.length} sessions complétées en Arabe Littéraire.</p>

        <h3 style="margin-top: 2rem;">Historique des Sessions</h3>
        <div class="dashboard-grid sessions-grid">
    `;

    if (sessions.length > 0) {
        sessions.forEach((session, index) => {
            const date = new Date(session.completedAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            });
            const title = (session.report?.summaryTitle || 'Bilan de session');
            const status = session.report?.completionStatus || 'Terminée';
            const feedbackPreview = session.report?.feedback[0] || 'Cliquez pour les détails.';
            
            html += `
                <div class="dashboard-card clickable-session" data-session-index="${index}" style="cursor: pointer;">
                    <p style="font-size: 0.9em; color: var(--text-color-secondary); margin-bottom: 5px;">${date}</p>
                    <h5 style="color: var(--primary-color);">${title}</h5>
                    <p style="font-size: 0.9em;">Statut : <strong>${status}</strong></p>
                    <p style="font-style: italic; margin-top: 10px;">Feedback : ${feedbackPreview}</p>
                    <div style="text-align: right; margin-top: 1rem;">
                        <button class="btn btn-secondary view-report-btn" data-session-index="${index}"><i class="fa-solid fa-eye"></i> Voir Rapport</button>
                    </div>
                </div>
            `;
        });
    } else {
         html += `<p style="margin-top: 2rem;">Aucun historique de session disponible pour ${student.firstName}.</p>`;
    }
    
    html += '</div>';
    page.innerHTML = html;

    // Retour au dashboard Enseignant
    document.getElementById('back-to-teacher-dash').addEventListener('click', renderAcademyTeacherDashboard);

    // Gestion de l'affichage du rapport de session (Les sessions sont dans l'objet 'student' local)
    page.querySelectorAll('.clickable-session, .view-report-btn').forEach(element => {
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = e.currentTarget.dataset.sessionIndex;
            if (index !== undefined) {
                const sessionReport = sessions[index].report; 
                showSessionReportModal(sessionReport); 
            }
        });
    });
}

// MODIFIÉ : Rendu du Dashboard Enseignant (Appelle l'API)
export async function renderAcademyTeacherDashboard() {
    const page = document.getElementById('teacher-dashboard-page');
    changePage('teacher-dashboard-page'); 

    // Affiche le HTML de base (structure + spinner)
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div>
                <h2>Tableau de Bord Enseignant / Tuteur 🧑‍🏫</h2>
                <p class="subtitle">Vue d'overview et suivi des progrès de vos élèves en Arabe Littéraire.</p>
            </div>
            
            <button id="create-scenario-btn" class="btn btn-main" style="white-space: nowrap;">
                <i class="fa-solid fa-file-circle-plus"></i> Créer un Scénario
            </button>
        </div>
        
        <div class="scenario-management-section">
            ${spinnerHtml} 
        </div>

        <h3 style="margin-top: 2rem;">Vos Élèves</h3>
        <div id="teacher-student-grid" class="dashboard-grid teacher-grid">
            ${spinnerHtml}
        </div>
    `;
    page.innerHTML = html;
    
    // Listener pour le bouton de création de scénario
    document.getElementById('create-scenario-btn').addEventListener('click', renderScenarioCreatorModal);
    
    // PLACEMENT CRITIQUE: Charger la section de gestion des scénarios (asynchrone)
    await renderTeacherScenarioManagement(page); 

    // --- CORRECTION : Appel API pour les élèves ---
    let students = [];
    const studentGrid = document.getElementById('teacher-student-grid');
    
    try {
        students = await apiRequest(`/api/academy/teacher/students?teacherEmail=${window.currentUser.email}`);
        
        if (students.length === 0) {
            studentGrid.innerHTML = `<p>Aucun élève de l'académie n'est encore enregistré.</p>`;
            return;
        }

        let studentHtml = '';
        students.forEach(student => {
            const totalSessions = student.academyProgress?.sessions?.length || 0;
            const lastSession = totalSessions > 0 ? student.academyProgress.sessions.slice().sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0] : null;
            
            const lastActivity = lastSession ? new Date(lastSession.completedAt).toLocaleDateString('fr-FR') : 'Aucune';
            
            let statusColor = totalSessions > 0 ? 'var(--primary-color)' : 'var(--text-color-secondary)';
            let statusText = `${totalSessions} Session(s)`;
            
            if (lastSession && lastSession.report?.completionStatus === 'Échec') {
                 statusColor = 'var(--incorrect-color)';
                 statusText = `Échec Récent`;
            }

            studentHtml += `
                <div class="dashboard-card student-card" data-student-id="${student.id}" style="border-left: 5px solid ${statusColor}; cursor: pointer;">
                    <h4>${student.firstName}</h4>
                    <p>Statut : <strong style="color: ${statusColor}">${statusText}</strong></p>
                    <p>Dernière activité : ${lastActivity}</p>
                    <div style="text-align: right; margin-top: 1rem;">
                        <button class="btn btn-secondary view-student-btn" data-student-id="${student.id}"><i class="fa-solid fa-chart-line"></i> Voir Détail</button>
                    </div>
                </div>
            `;
        });
        
        studentGrid.innerHTML = studentHtml;

        // Listeners pour voir le détail de l'élève
        studentGrid.querySelectorAll('.view-student-btn, .student-card').forEach(element => {
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                const studentId = e.currentTarget.dataset.studentId;
                const studentData = students.find(s => s.id === studentId);
                if (studentData) {
                    renderTeacherStudentDetail(studentData);
                }
            });
        });

    } catch (err) {
        studentGrid.innerHTML = `<p class="error-message">Erreur lors de la récupération des élèves : ${err.message}</p>`;
    }
}


// Vue pour le chat immersif 
function renderScenarioViewer(scenario) {
    const p = document.getElementById('content-viewer-page');
    changePage('content-viewer-page');

    const history = [{ role: "system", content: getAcademySystemPrompt(scenario) }];
    
    p.innerHTML = `
        <button id="back-to-academy-dash" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> Retour aux scénarios</button>
        
        <div class="card" style="margin-top:1rem;">
            <h2>${scenario.title}</h2>
            <p class="subtitle">${scenario.context}</p>
            <p style="font-size: 0.9em; color: var(--primary-color); margin-bottom: 1rem;">
                <i class="fa-solid fa-microphone-alt"></i> **Mode Vocal Activé.** Appuyez sur le micro pour enregistrer.
            </p>

            <div id="scenario-chat-window" style="height: 400px; overflow-y: auto; padding: 10px; border: 1px solid #ccc; border-radius: 8px; margin-top: 1.5rem; background-color: var(--aida-chat-bg);">
                </div>

            <form id="scenario-chat-form" style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <textarea id="user-scenario-input" placeholder="Parlez en Arabe ou écrivez votre réponse..." rows="2" style="flex-grow: 1; resize: none;"></textarea>
                
                <button type="button" id="mic-btn" class="btn-icon" title="Maintenir enfoncé pour parler">
                    <i class="fa-solid fa-microphone"></i>
                </button>

                <button type="submit" class="btn btn-main" style="width: 100px; flex-shrink: 0;"><i class="fa-solid fa-paper-plane"></i></button>
            </form>
            
            <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
                 <button type="button" id="end-session-btn" class="btn" style="background-color: var(--incorrect-color); color: white;">
                    <i class="fa-solid fa-flag-checkered"></i> Terminer la session
                 </button>
            </div>

            <div id="scenario-spinner" class="hidden" style="text-align: right; margin-top: 0.5rem;">${spinnerHtml}</div>
            <p class="error-message" id="scenario-error"></p>
        </div>
    `;

    const chatForm = document.getElementById('scenario-chat-form');
    const userInput = document.getElementById('user-scenario-input');
    const micBtn = document.getElementById('mic-btn');
    const endSessionBtn = document.getElementById('end-session-btn');
    
    document.getElementById('back-to-academy-dash').addEventListener('click', () => {
        if (recognition && micBtn.classList.contains('recording')) recognition.stop();
        if (currentAudio) currentAudio.pause();
        renderAcademyStudentDashboard();
    });

    // Initialisation du Push-to-Talk
    setupSpeechRecognition(micBtn, userInput, chatForm); 
    micBtn.addEventListener('mousedown', startListening);
    micBtn.addEventListener('mouseup', stopListening);
    micBtn.addEventListener('touchstart', startListening); 
    micBtn.addEventListener('touchend', stopListening);
    micBtn.addEventListener('click', (e) => e.preventDefault()); 


    endSessionBtn.addEventListener('click', () => endScenarioSession(scenario, history));


    // Prompt Initial du Personnage IA
    appendMessage('aida', scenario.characterIntro, true); 
    history.push({ role: 'assistant', content: scenario.characterIntro });


    // Gestion de l'envoi de message
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (!message) return;
        
        if (recognition && micBtn.classList.contains('recording')) recognition.stop();

        appendMessage('user', message);
        userInput.value = '';
        document.getElementById('scenario-spinner').classList.remove('hidden');
        document.getElementById('scenario-error').textContent = '';
        
        history.push({ role: 'user', content: message });

        try {
            const response = await apiRequest('/api/academy/ai/chat', 'POST', { history });
            
            const aidaResponse = response.reply;
            appendMessage('aida', aidaResponse, true); 
            history.push({ role: 'assistant', content: aidaResponse });

        } catch (err) {
            document.getElementById('scenario-error').textContent = `Erreur: Conversation interrompue. ${err.message}`;
            history.pop(); 
        } finally {
            document.getElementById('scenario-spinner').classList.add('hidden');
        }
    });
}


// Fonction appendMessage (Logique de découpage des balises)
const appendMessage = (sender, text, canListen = false) => {
    const chatWindow = document.getElementById('scenario-chat-window');
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender === 'user' ? 'user' : 'aida'}`;
    
    const bubble = document.createElement('div');
    bubble.className = sender === 'user' ? 'user-message' : 'aida-message';
    
    
    let displayedText = text.replace(/\n/g, '<br>');
    let helpContent = ''; 
    let isAidaMessage = sender === 'aida' && (text.includes('<PHONETIQUE>') || text.includes('<TRADUCTION>'));


    // --- 1. Détection, Extraction et Remplissage du Contenu ---
    if (isAidaMessage) {
        
        // Trouver la partie Arabe pure (ce qui est avant la première balise)
        const firstTagIndex = Math.min(
            text.indexOf('<PHONETIQUE>') > -1 ? text.indexOf('<PHONETIQUE>') : Infinity,
            text.indexOf('<TRADUCTION>') > -1 ? text.indexOf('<TRADUCTION>') : Infinity
        );
        const arabicPart = text.substring(0, firstTagIndex).trim();

        // Extraction de l'aide
        const phoneticMatch = text.match(/<PHONETIQUE>(.*?)<\/PHONETIQUE>/);
        const traductionMatch = text.match(/<TRADUCTION>(.*?)<\/TRADUCTION>/);
        
        if (phoneticMatch) { helpContent += `<p class="help-phonetic">Phonétique: ${phoneticMatch[1].trim()}</p>`; }
        if (traductionMatch) { helpContent += `<p class="help-translation">Traduction: ${traductionMatch[1].trim()}</p>`; }

        // Correction de la régression de l'aide
        displayedText = `<p class="arabic-text-only">${arabicPart}</p>`;
    } else if (sender === 'user') {
        // Correction de la régression de la taille de police utilisateur
        displayedText = `<p>${text}</p>`;
    }
    
    bubble.innerHTML = displayedText;
    
    // Aligner le message
    msgDiv.style.alignSelf = sender === 'user' ? 'flex-end' : 'flex-start';
    msgDiv.style.marginLeft = sender === 'user' ? 'auto' : 'unset';


    // --- 2. AJOUT DES CONTRÔLES (Boutons) à la BUBBLE ---
    if (sender === 'aida' && canListen) {
        
        // 2a. Activation du FLEX pour aligner le texte et les boutons
        bubble.style.display = 'flex';
        bubble.style.alignItems = 'center';
        bubble.style.gap = '10px';
        
        // 2b. BOUTON ÉCOUTER (Haut-parleur)
        const listenBtn = document.createElement('button');
        listenBtn.className = 'btn-icon';
        listenBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        listenBtn.title = 'Écouter la réponse (Arabe Littéraire)';
        listenBtn.onclick = () => togglePlayback(text, listenBtn);  
        bubble.appendChild(listenBtn);


        // 2c. BOUTON AIDE (Ampoule) et son Div Masqué
        if (helpContent) {
            const helpBtn = document.createElement('button');
            helpBtn.className = 'btn-icon toggle-help-btn';
            helpBtn.innerHTML = '<i class="fa-solid fa-lightbulb"></i>';
            helpBtn.title = 'Afficher l\'aide (Phonétique / Traduction)';
            
            helpBtn.onclick = () => {
                const helpDiv = msgDiv.querySelector('.aida-help-div');
                helpDiv.classList.toggle('hidden');
                helpBtn.classList.toggle('active');
            };
            
            bubble.appendChild(helpBtn);
            
            // Ajout du DIV d'aide masqué au MESSAGE (à la div parente)
            const helpDiv = document.createElement('div');
            helpDiv.className = 'aida-help-div hidden'; 
            helpDiv.innerHTML = helpContent;
            msgDiv.appendChild(helpDiv);
        }
    }

    // 3. ATTACHEMENT FINAL au DOM
    msgDiv.appendChild(bubble); 
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
};


// --- 6. Dashboard Parent (Utilise la même logique que l'enseignant) ---

export async function renderAcademyParentDashboard() {
    await renderAcademyTeacherDashboard();
}
}
ok mais on a une erreur Uncaught SyntaxError: missing name after . operator aida_academy.js:611:52, 

je t'ai renvoyé le fichier, mais tu n'as pas pris en compte ma correction
// src/aida_academy.js - Logique complète pour l'Académie (Mode Série Hybride)

import { changePage, spinnerHtml, apiRequest, renderModal, getModalTemplate } from './utils.js';
// NOUVEAU : Importe les données de la série depuis le fichier séparé
import { courseData, memorizationData } from './series_data.js';

// --- Variables d'état vocal pour le module ---
let recognition;
let currentAudio = null;
let currentListenBtn = null; 
let narratorAudio = null; // Audio distinct pour le narrateur

// --- Fonctions de Configuration et d'Aide ---

function getAcademySystemPrompt(scenarioData) {
    const isRepeaterMode = scenarioData.id === 'scen-0'; 

    return `Tu es un tuteur expert en immersion linguistique. Ton rôle actuel est celui de "${scenarioData.characterName}" dans le contexte suivant : "${scenarioData.context}". La conversation doit se dérouler **UNIQUEMENT en Arabe Littéraire (Al-Fusha)**. 
    
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
    3.  **Suivi des Objectifs** : ${scenarioData.objectives.join(', ')}.
    4.  **Focalisation Fusha** : Concentre les interactions sur l'usage pratique de l'**Arabe Littéraire**.
    5.  **Format de Réponse** : Réponds toujours en tant que le personnage.`;
}


// --- 2. Fonctions Vocales (Push-to-Talk et TTS) ---

async function playNarratorAudio(text, buttonEl) {
    if (narratorAudio && !narratorAudio.paused) {
        narratorAudio.pause();
        narratorAudio = null;
        buttonEl.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        return;
    }

    buttonEl.innerHTML = `<div class="spinner-dots" style="transform: scale(0.6);"><span></span><span></span><span></span></div>`;
    
    try {
        const response = await apiRequest('/api/ai/synthesize-speech', 'POST', { 
            text: text, 
            voice: 'fr-FR-Wavenet-E', 
            rate: 0.95,
            pitch: -2.0
        });
        
        const audioBlob = await (await fetch(`data:audio/mp3;base64,${response.audioContent}`)).blob(); 
        const audioUrl = URL.createObjectURL(audioBlob);
        
        narratorAudio = new Audio(audioUrl);
        narratorAudio.play();
        
        buttonEl.innerHTML = '<i class="fa-solid fa-stop"></i>';
        narratorAudio.onended = () => {
            buttonEl.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            narratorAudio = null;
        };

    } catch (error) {
        console.error("Erreur lors de la lecture de l'audio du narrateur:", error);
        buttonEl.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        alert(`Impossible de jouer la voix du Narrateur. Erreur: ${error.message}`);
    }
}

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


// --- 3. Logique de Bilan et de Sauvegarde ---

async function endScenarioSession(scenarioData, history, scenarioId = 'custom') {
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
            const jsonString = response.reply.match(/\{[\s\S]*\}/)?.[0];
            if (!jsonString) {
                throw new Error("Aucun objet JSON structuré n'a pu être détecté.");
            }
            report = JSON.parse(jsonString); 
        } catch(e) {
            console.error("Erreur critique de parsing JSON du rapport IA:", e, "Réponse brute:", response.reply);
            report = { summaryTitle: "Bilan Indisponible (Erreur Critique)", completionStatus: "Erreur", feedback: [`L'IA n'a pas pu générer le rapport structuré. Détails: ${e.message}`], newVocabulary: [] };
        }
        
        // Sauvegarde de la session (Backend)
        try {
             await apiRequest('/api/academy/session/save', 'POST', {
                userId: window.currentUser.id,
                scenarioId: scenarioId,
                report: report,
                fullHistory: history 
            });
        } catch (e) {
            console.warn("Erreur lors de la sauvegarde du bilan (Vérifiez server.js):", e.message);
        }

        showSessionReportModal(report);

    } catch (err) {
        errorDisplay.textContent = `Erreur lors de la génération du bilan: ${err.message}`;
    } finally {
        spinner.classList.add('hidden');
    }
}

function showSessionReportModal(report) {
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
            
            <button class="btn btn-main" style="width: 100%; margin-top: 2rem;" onclick="window.modalContainer.innerHTML=''; renderAcademyStudentDashboard();">
                <i class="fa-solid fa-arrow-right"></i> Retour au tableau de bord
            </button>
        </div>
    `;

    renderModal(getModalTemplate('session-report-modal', 'Bilan de votre Session', html));
}


// --- 4. Outil de Création de Scénarios (Inchangé) ---

function getScenarioCreatorTemplate() {
    return `
        <form id="scenario-creator-form">
            <div class="form-group">
                <label for="scen-title">Titre du Scénario</label>
                <input type="text" id="scen-title" required placeholder="Ex: Commander des légumes au marché">
            </div>
            
            <div class="form-group">
                <label for="scen-image-url">URL de l'Image (Optionnel)</label>
                <input type="text" id="scen-image-url" placeholder="Ex: https://exemple.com/image.jpg">
            </div>
            
            <div class="form-group">
                <label for="scen-context">Contexte (Pour l'IA)</label>
                <textarea id="scen-context" rows="2" required placeholder="Ex: Tu montres une image d'un marché. Demande à l'élève ce qu'il voit..."></textarea>
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
            imageUrl: document.getElementById('scen-image-url').value, 
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

async function renderTeacherScenarioManagement(page) {
    const managementSection = page.querySelector('.scenario-management-section');
    if (!managementSection) return;
    
    let availableScenarios = [];
    try {
        availableScenarios = await apiRequest('/api/academy/scenarios', 'GET'); 
    } catch (e) {
        managementSection.innerHTML = `<h3 class="error-message">Erreur : Impossible de charger les scénarios.</h3>`;
        return;
    }
    
    const customScenarios = availableScenarios.filter(s => s.id !== 'scen-0' && s.id !== 'scen-1');

    let html = `
        <h3>Gestion des Scénarios Personnalisés (${customScenarios.length})</h3>
        <p class="subtitle">Assignez ces scénarios à vos élèves pour les rendre disponibles sur leur tableau de bord.</p>
        
        <div class="dashboard-grid scenario-management-grid" style="margin-top: 1rem;">
    `;

    if (customScenarios.length === 0) {
        html += `<p style="margin-top: 1rem; color: var(--text-color-secondary);">Aucun scénario créé. Utilisez le bouton "Créer un Scénario" ci-dessus.</p>`;
    } else {
        customScenarios.forEach(scen => {
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
    
    managementSection.innerHTML = html;
}


// --- 5. NOUVELLES Fonctions de Rendu du Dashboard (Élève et Enseignant) ---

export async function renderAcademyStudentDashboard() {
    const page = document.getElementById('student-dashboard-page');
    changePage('student-dashboard-page'); 

    let html = `
        <h2>Bienvenue ${window.currentUser.firstName} sur l'Académie ! 📚</h2>
        <p class="subtitle">Prêt à commencer ton aventure ?</p>

        <div class="dashboard-grid" style="grid-template-columns: 1fr;">
            
            <div class="scenario-card card" id="start-series-btn" style="cursor: pointer;">
                <div class="scenario-card-image-wrapper">
                    <img src="assets/images/zayd_yasmina_cover.png" alt="Zayd et Yasmina" class="scenario-card-image">
                </div>
                <div class="scenario-card-content">
                    <h3 class="scenario-card-title">${courseData.title}</h3>
                    <p class="scenario-card-description">${courseData.description}</p>
                    <button class="btn btn-primary btn-play"><i class="fa-solid fa-play-circle"></i> Commencer la Série</button>
                </div>
            </div>
        </div>
        
        <h3 style="margin-top: 3rem;">Scénarios Supplémentaires</h3>
        <div id="custom-scenarios-grid" class="dashboard-grid">
            ${spinnerHtml}
        </div>
        `;
    
    const sessions = window.currentUser.academyProgress?.sessions || []; 
    sessions.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)); 
    if (sessions.length > 0) {
        html += `<h3 style="margin-top: 3rem;">Historique de vos Sessions (${sessions.length})</h3>
                 <div class="dashboard-grid sessions-grid">`;
        sessions.forEach((session, index) => {
            const date = new Date(session.completedAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            });
            const title = (session.report?.summaryTitle || 'Bilan de session');
            const status = session.report?.completionStatus || 'Terminée';
            const feedbackPreview = (session.report?.feedback && session.report.feedback.length > 0) ? session.report.feedback[0] : 'Cliquez pour les détails.';
            
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
    }

    page.innerHTML = html;

    page.querySelector('#start-series-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        renderAcademyCoursePlayer();
    });

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

    loadCustomScenarios();
}

async function loadCustomScenarios() {
    const grid = document.getElementById('custom-scenarios-grid');
    let customScenarios = [];
    
    try {
        const allScenarios = await apiRequest('/api/academy/scenarios', 'GET');
        customScenarios = allScenarios.filter(s => s.id !== 'scen-0' && s.id !== 'scen-1');
        
        if (customScenarios.length === 0) {
            grid.innerHTML = `<p>Aucun scénario supplémentaire assigné par votre enseignant pour le moment.</p>`;
            return;
        }

        let html = '';
        customScenarios.forEach(scen => {
            let imageHtml = '';
            if (scen.imageUrl) {
                imageHtml = `<img src="${scen.imageUrl}" alt="${scen.title}" class="scenario-card-image">`;
            }
            html += `
                <div class="dashboard-card primary-card" data-scenario-id="${scen.id}" style="cursor: pointer; padding: 0;">
                    ${imageHtml}
                    <div class="scenario-card-content">
                        <h4>${scen.title}</h4>
                        <p>Niveau : ${scen.level}</p>
                        <p style="margin-top: 1rem;">Objectif: ${scen.objectives?.[0] || 'Objectif non spécifié'}...</p>
                        <div style="text-align: right; margin-top: 1rem;">
                            <button class="btn btn-main start-scenario-btn" data-scenario-id="${scen.id}"><i class="fa-solid fa-play"></i> Commencer</button>
                        </div>
                    </div>
                </div>
            `;
        });
        grid.innerHTML = html;

        grid.querySelectorAll('.start-scenario-btn, .dashboard-card.primary-card').forEach(element => {
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                const scenarioId = e.currentTarget.dataset.scenarioId;
                const selectedScenario = customScenarios.find(s => s.id === scenarioId);
                if (selectedScenario) {
                    renderScenarioViewer(document.getElementById('content-viewer-page'), selectedScenario, true);
                    changePage('content-viewer-page'); // N'oubliez pas d'afficher la page
                }
            });
        });

    } catch (e) {
        console.error("Erreur lors du chargement des scénarios personnalisés:", e);
        grid.innerHTML = `<p class="error-message">Impossible de charger les scénarios supplémentaires.</p>`;
    }
}


function renderAcademyCoursePlayer(selectedActivityId = null) {
    const page = document.getElementById('content-viewer-page');
    changePage('content-viewer-page');
    
    if (!selectedActivityId) {
        selectedActivityId = courseData.episodes[0].activities[0].id;
    }

    let activeEpisode = courseData.episodes.find(ep => ep.activities.some(a => a.id === selectedActivityId));
    const activeEpisodeId = activeEpisode ? activeEpisode.id : courseData.episodes[0].id;

    let navHtml = '';
    courseData.episodes.forEach(episode => {
        const isEpisodeOpen = episode.id === activeEpisodeId;

        navHtml += `<div class="episode-group ${isEpisodeOpen ? 'open' : ''}">
                        <h4 class="episode-title" data-episode-id="${episode.id}">
                            <span>${episode.title}</span>
                            <i class="fa-solid fa-chevron-right"></i>
                        </h4>
                        <ul class="activity-list">`;
        
        episode.activities.forEach(activity => {
            const isActive = activity.id === selectedActivityId;
            let icon = 'fa-solid fa-circle-notch';
            if (activity.type === 'video') icon = 'fa-solid fa-play-circle';
            if (activity.type === 'memorization') icon = 'fa-solid fa-book-open';
            if (activity.type === 'quiz') icon = 'fa-solid fa-pen-to-square';
            if (activity.type === 'dialogue') icon = 'fa-solid fa-comments';

            navHtml += `
                <li class="activity-item ${isActive ? 'active' : ''}" data-activity-id="${activity.id}">
                    <i class="${icon}"></i> ${activity.title}
                </li>
            `;
        });
        navHtml += `</ul></div>`;
    });

    page.innerHTML = `
        <div class="course-player-container">
            <nav class="course-player-nav">
                <div class="course-player-header">
                    <img src="https://aida-backend-bqd0fnd2a3c7dadf.francecentral-01.azurewebsites.net/logo%20Aida11.svg" alt="Logo AÏDA" class="logo-icon" style="width: 100px;">
                    <button id="back-to-academy-dash" class="btn btn-secondary" style="padding: 5px 10px; font-size: 0.8rem;">Retour</button>
                </div>
                ${navHtml}
            </nav>
            <main class="course-player-content">
                <div class="content-header">
                    <h3>${courseData.title}</h3>
                </div>
                
                <div id="narrator-box" class="card">
                    <button id="narrator-speak-btn" class="btn-icon"><i class="fa-solid fa-volume-high"></i></button>
                    <div id="narrator-text">${spinnerHtml}</div>
                </div>

                <div id="activity-content-area">
                    ${spinnerHtml}
                </div>
            </main>
        </div>
    `;
    
    page.querySelector('#back-to-academy-dash').addEventListener('click', renderAcademyStudentDashboard);
    
    page.querySelectorAll('.episode-title').forEach(title => {
        title.addEventListener('click', (e) => {
            const clickedGroup = e.currentTarget.closest('.episode-group');
            
            page.querySelectorAll('.episode-group.open').forEach(group => {
                if (group !== clickedGroup) {
                    group.classList.remove('open');
                }
            });
            
            clickedGroup.classList.toggle('open');
        });
    });

    page.querySelectorAll('.activity-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const activityId = e.currentTarget.dataset.activityId;
            if (narratorAudio) narratorAudio.pause();
            renderAcademyCoursePlayer(activityId);
        });
    });
    
    loadActivityContent(selectedActivityId);
}

//
// ======================================
// === GESTION NARRATEUR ET DU QUIZ ===
// ======================================
//

async function loadActivityContent(activityId) {
    const contentArea = document.getElementById('activity-content-area');
    const narratorBox = document.getElementById('narrator-box');
    const narratorText = document.getElementById('narrator-text');
    const narratorBtn = document.getElementById('narrator-speak-btn');

    let activity = null;
    let episode = null;
    
    // Trouver l'activité ET l'épisode parent dans la SÉRIE
    for (const ep of courseData.episodes) {
        activity = ep.activities.find(a => a.id === activityId);
        if (activity) {
            episode = ep;
            break;
        }
    }

    if (!activity || !episode) {
        contentArea.innerHTML = `<p class="error-message">Erreur : Activité non trouvée.</p>`;
        narratorBox.classList.add('hidden');
        return;
    }
    
    // --- 1. Gérer le contenu de l'activité ---
    // On détermine d'abord si on est dans un dialogue pour cacher le narrateur
    
    let isDialogue = false; // Drapeau pour gérer le narrateur

    switch (activity.type) {
        case 'video':
            renderVideoPage(contentArea, activity);
            break;
        case 'memorization':
            renderMemorizationPage(contentArea, activity);
            break;
        case 'dialogue':
            isDialogue = true; // C'est un dialogue, on ne veut pas de narrateur
            if (activity.scenarioData) {
                renderScenarioViewer(contentArea, activity, false); // Affiche le chat IA
            } else {
                contentArea.innerHTML = `<p class="error-message">Erreur : Données de dialogue non trouvées pour cette activité.</p>`;
            }
            break;
        case 'quiz':
            // Appelle la nouvelle fonction de quiz
            renderAcademyQuiz(contentArea, activity);
            break;
        default:
            contentArea.innerHTML = `<p class="error-message">Type d'activité non reconnu.</p>`;
    }

    // --- 2. Gérer le Narrateur ---
    // S'affiche SEULEMENT si ce n'est PAS un dialogue
    if (isDialogue) {
        narratorBox.classList.add('hidden'); // CACHE la boîte (corrige le bug "Tu es Fahim...")
    } else {
        // Pour la vidéo, le mémo ou le quiz, on affiche la description de l'épisode
        const narratorPrompt = episode.narratorIntro;
        narratorText.textContent = narratorPrompt;
        narratorBtn.onclick = () => playNarratorAudio(narratorPrompt, narratorBtn);
        narratorBox.classList.remove('hidden'); // MONTRE la boîte
    }
}

// Affiche une vidéo
function renderVideoPage(container, activity) {
    container.innerHTML = `
        <h3>${activity.title}</h3>
        <div class="video-container" style="padding-top: 56.25%; position: relative; border-radius: 8px; overflow: hidden; margin-top: 1rem;">
            <iframe 
                src="${activity.url}?autoplay=1&muted=1" 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                frameborder="0" 
                allow="autoplay; fullscreen; picture-in-picture" 
                allowfullscreen>
            </iframe>
        </div>
    `;
}

// Affiche la fiche de mémorisation
function renderMemorizationPage(container, activity) {
    const data = memorizationData[activity.data];
    if (!data) {
        container.innerHTML = `<p class="error-message">Données de mémorisation non trouvées.</p>`;
        return;
    }
    
    const phrasesTable = data.phrases.map(p => `
        <tr>
            <td>${p.arabe}</td>
            <td>${p.phonetique}</td>
            <td>${p.francais}</td>
        </tr>`).join('');
        
    const motsTable = data.mots.map(m => `
        <tr>
            <td>${m.arabe}</td>
            <td>${m.phonetique}</td>
            <td>${m.francais}</td>
        </tr>`).join('');

    container.innerHTML = `
        <div class="card" style="margin: 0;">
            <h3>${activity.title}</h3>
            
            <h4 style="margin-top: 2rem; margin-bottom: 1rem;">Phrases de l'épisode à mémoriser</h4>
            <table class="styled-table">
                <thead>
                    <tr><th>Arabe</th><th>Phonétique</th><th>Français</th></tr>
                </thead>
                <tbody>${phrasesTable}</tbody>
            </table>
            
            <h4 style="margin-top: 2rem; margin-bottom: 1rem;">Mots de l'épisode à mémoriser</h4>
            <table class="styled-table">
                <thead>
                    <tr><th>Arabe</th><th>Phonétique</th><th>Français</th></tr>
                </thead>
                <tbody>${motsTable}</tbody>
            </table>
        </div>
    `;
}

//
// --- NOUVELLES FONCTIONS QUIZ (Placées à la fin) ---
//

/**
 * NOUVEAU : Affiche le Quiz
 */
function renderAcademyQuiz(container, activity) {
    // Les données du quiz sont dans activity.data (ex: { questions: [...] })
    const quizData = activity.data; 
    
    if (!quizData || !quizData.questions) {
        // C'est ici que l'erreur "Données de quiz non trouvées" se produit si series_data.js n'est pas à jour
        container.innerHTML = `<p class="error-message">Erreur : Données de quiz non trouvées.</p>`;
        return;
    }

    let questionsHtml = '';
    quizData.questions.forEach((q, index) => {
        const optionsHtml = q.options.map((option, i) => `
            <label class="quiz-option">
                <input type="radio" name="q${index}" value="${i}" required>
                <div class="option-label">${option}</div>
            </label>
        `).join('');

        questionsHtml += `
            <div class="quiz-question">
                <div class="question-header">
                    <p><strong>${index + 1}. ${q.question_text}</strong></p>
                </div>
                <div class="quiz-options-grid">${optionsHtml}</div>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="card" style="margin: 0;">
            <h3>${activity.title}</h3>
            <form id="academy-quiz-form">
                ${questionsHtml}
                <div style="text-align: right; margin-top: 2rem;">
                    <button type="submit" class="btn btn-main">
                        <i class="fa-solid fa-check"></i> Valider le Quiz
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Attache l'écouteur de soumission
    document.getElementById('academy-quiz-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleAcademyQuizSubmit(activity);
    });
}

/**
 * NOUVEAU : Gère la soumission du Quiz
 */
async function handleAcademyQuizSubmit(activity) {
    const form = document.getElementById('academy-quiz-form');
    if (!form) return;

    let score = 0;
    const totalQuestions = activity.data.questions.length;
    const userAnswers = [];

    for (let i = 0; i < totalQuestions; i++) {
        const selected = form.querySelector(`input[name="q${i}"]:checked`);
        if (selected) {
            const answerIndex = parseInt(selected.value, 10);
            userAnswers.push(answerIndex);
            if (answerIndex === activity.data.questions[i].correct_answer_index) {
                score++;
            }
        } else {
            userAnswers.push(-1); // Aucune réponse
        }
    }

    const percentage = Math.round((score / totalQuestions) * 100);
    const resultText = `Quiz terminé ! Votre score : ${score}/${totalQuestions} (${percentage}%)`;
    const container = document.getElementById('activity-content-area');

    try {
        container.innerHTML = `
            <div class="card" style="text-align: center; margin: 0;">
                <h2>Quiz Terminé !</h2>
                <p style="font-size: 1.5rem; font-weight: 600; margin: 1rem 0;">
                    Votre score : ${score} / ${totalQuestions}
                </p>
                <p class="subtitle" style="margin-bottom: 2rem;">(${percentage}%)</p>
                <button id="next-activity-btn" class="btn btn-main">Activité suivante <i class="fa-solid fa-arrow-right"></i></button>
            </div>
        `;
        
        document.getElementById('next-activity-btn').addEventListener('click', () => {
            const currentItem = document.querySelector('.activity-item.active');
            if (currentItem && currentItem.nextElementSibling) {
                currentItem.nextElementSibling.click();
            } else {
                const currentGroup = currentItem.closest('.episode-group');
                const nextGroup = currentGroup.nextElementSibling;
                if (nextGroup && nextGroup.classList.contains('episode-group')) {
                    nextGroup.querySelector('.episode-title').click();
                    nextGroup.querySelector('.activity-item').click();
                } else {
                    alert("Fin de la série !");
                }
            }
        });

        await saveAcademySession(activity.id, {
            type: 'quiz',
            score: percentage,
            details: resultText,
            fullAnswers: userAnswers
        });
        
        updateActivityStatusInSidebar(activity.id, true);

    } catch (err) {
        console.error("Erreur lors de la sauvegarde du quiz:", err);
        container.innerHTML = `<p class="error-message">Erreur: ${err.message}</p>`;
    }
}

     //NOUVEAU : Fonction de sauvegarde de session (Quiz, etc.)

async function saveAcademySession(activityId, reportData) {
    if (!window.currentUser || !window.currentUser.id) {
        console.error("Erreur de sauvegarde : Utilisateur non connecté.");
        return;
    }

    try {
        await apiRequest('/api/academy/session/save', 'POST', {
            userId: window.currentUser.id,
            scenarioId: activityId, // L'ID de l'activité (ex: "ep1-quiz")
            report: reportData,
            fullHistory: [] // Pas d'historique de chat pour un quiz
        });
        
        // La sauvegarde a réussi
        console.log(`Session ${activityId} sauvegardée avec succès.`);

    } catch (err) {
        console.error("Erreur API lors de la sauvegarde de la session:", err);
        // Affiche une alerte si la sauvegarde échoue
        alert(`Erreur critique : Votre progression n'a pas pu être sauvegardée. ${err.message}`);
    }
}


// --- Fonctions de Rendu (Enseignant/Parent) ---
// (Celles-ci restent inchangées, elles gèrent le suivi et la création de scénarios personnalisés)
export async function renderAcademyTeacherDashboard() {
    const page = document.getElementById('teacher-dashboard-page');
    changePage('teacher-dashboard-page'); 

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
    
    document.getElementById('create-scenario-btn').addEventListener('click', renderScenarioCreatorModal);
    
    await renderTeacherScenarioManagement(page); 

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
            const feedbackPreview = (session.report?.feedback && session.report.feedback.length > 0) ? session.report.feedback[0] : 'Cliquez pour les détails.';
            
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

    document.getElementById('back-to-teacher-dash').addEventListener('click', renderAcademyTeacherDashboard);

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
export async function renderAcademyParentDashboard() {
    await renderAcademyTeacherDashboard();
}

// CORRIGÉ : Correction du bug "undefined"
function renderScenarioViewer(container, scenarioOrData, isCustomScenario = false) {
    container.innerHTML = ''; // Vide la zone d'activité

    const scenarioData = isCustomScenario ? scenarioOrData : scenarioOrData.scenarioData;
    const scenarioId = isCustomScenario ? scenarioOrData.id : scenarioOrData.id;
    const title = isCustomScenario ? scenarioOrData.title : scenarioData.title;
    const context = isCustomScenario ? scenarioOrData.context : scenarioData.context;
    const intro = isCustomScenario ? scenarioOrData.characterIntro : scenarioData.characterIntro;
    const imageUrl = isCustomScenario ? scenarioOrData.imageUrl : null; 

    const history = [{ role: "system", content: getAcademySystemPrompt(scenarioData) }];
    
    let imageHtml = '';
    if (imageUrl) {
        imageHtml = `<img src="${imageUrl}" alt="${title}" class="scenario-main-image">`;
    }
    
    const chatWrapper = document.createElement('div');
    // On applique la classe 'card' au wrapper pour le style
    chatWrapper.className = 'card';
    chatWrapper.style.margin = '0';

    chatWrapper.innerHTML = `
        ${isCustomScenario ? `<button id="back-to-academy-dash" class="btn btn-secondary" style="margin-bottom: 1rem;"><i class="fa-solid fa-arrow-left"></i> Retour</button>` : ''}
        
        <h3>${title}</h3>
        ${imageHtml}
        
        ${context ? `<p class="subtitle">${context}</p>` : ''} 
        
        <p style="font-size: 0.9em; color: var(--primary-color); margin-bottom: 1rem;">
            <i class="fa-solid fa-microphone-alt"></i> **Mode Vocal Activé.** Appuyez sur le micro pour enregistrer.
        </p>

        <div id="scenario-chat-window" style="height: 400px; overflow-y: auto; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; margin-top: 1.5rem; background-color: var(--aida-chat-bg);">
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
    `;
    container.appendChild(chatWrapper);
    
    // --- Attachement des Listeners ---
    const chatForm = chatWrapper.querySelector('#scenario-chat-form');
    const userInput = chatWrapper.querySelector('#user-scenario-input');
    const micBtn = chatWrapper.querySelector('#mic-btn');
    const endSessionBtn = chatWrapper.querySelector('#end-session-btn');
    
    const backBtn = chatWrapper.querySelector('#back-to-academy-dash');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (recognition && micBtn.classList.contains('recording')) recognition.stop();
            if (currentAudio) currentAudio.pause();
            renderAcademyStudentDashboard();
        });
    }

    setupSpeechRecognition(micBtn, userInput, chatForm); 
    micBtn.addEventListener('mousedown', startListening);
    micBtn.addEventListener('mouseup', stopListening);
    micBtn.addEventListener('touchstart', startListening); 
    micBtn.addEventListener('touchend', stopListening);
    micBtn.addEventListener('click', (e) => e.preventDefault()); 

    endSessionBtn.addEventListener('click', () => endScenarioSession(scenarioData, history, scenarioId));

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (!message) return;
        
        if (recognition && micBtn.classList.contains('recording')) recognition.stop();

        appendMessage('user', message);
        userInput.value = '';
        chatWrapper.querySelector('#scenario-spinner').classList.remove('hidden');
        chatWrapper.querySelector('#scenario-error').textContent = '';
        
        history.push({ role: 'user', content: message });

        try {
            const response = await apiRequest('/api/academy/ai/chat', 'POST', { history });
            
            const aidaResponse = response.reply;
            appendMessage('aida', aidaResponse, true); 
            history.push({ role: 'assistant', content: aidaResponse });

        } catch (err) {
            chatWrapper.querySelector('#scenario-error').textContent = `Erreur: Conversation interrompue. ${err.message}`;
            history.pop(); 
        } finally {
            chatWrapper.querySelector('#scenario-spinner').classList.add('hidden');
        }
    });

    // La fonction 'appendMessage' est DÉFINIE À L'INTÉRIEUR de 'renderScenarioViewer'
    const appendMessage = (sender, text, canListen = false) => {
        const chatWindow = document.getElementById('scenario-chat-window'); 
        if (!chatWindow) return;
        
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender === 'user' ? 'user' : 'aida'}`;
        
        const bubble = document.createElement('div');
        bubble.className = sender === 'user' ? 'user-message' : 'aida-message';
        
        let displayedText = text.replace(/\n/g, '<br>');
        let helpContent = ''; 
        let isAidaMessage = sender === 'aida' && (text.includes('<PHONETIQUE>') || text.includes('<TRADUCTION>'));

        if (isAidaMessage) {
            const firstTagIndex = Math.min(
                text.indexOf('<PHONETIQUE>') > -1 ? text.indexOf('<PHONETIQUE>') : Infinity,
                text.indexOf('<TRADUCTION>') > -1 ? text.indexOf('<TRADUCTION>') : Infinity
            );
            // S'il n'y a pas de balise, prend tout le texte
            const arabicPart = (firstTagIndex === Infinity) ? text.trim() : text.substring(0, firstTagIndex).trim();
            
            const phoneticMatch = text.match(/<PHONETIQUE>(.*?)<\/PHONETIQUE>/);
            const traductionMatch = text.match(/<TRADUCTION>(.*?)<\/TRADUCTION>/);
            
            if (phoneticMatch) { helpContent += `<p class="help-phonetic">Phonétique: ${phoneticMatch[1].trim()}</p>`; }
            if (traductionMatch) { helpContent += `<p class="help-translation">Traduction: ${traductionMatch[1].trim()}</p>`; }

            displayedText = `<p class="arabic-text-only">${arabicPart}</p>`;
        } else if (sender === 'user') {
            displayedText = `<p>${text}</p>`;
        }
        
        bubble.innerHTML = displayedText;
        
        msgDiv.style.alignSelf = sender === 'user' ? 'flex-end' : 'flex-start';
        msgDiv.style.marginLeft = sender === 'user' ? 'auto' : 'unset';

        if (sender === 'aida' && canListen) {
            bubble.style.display = 'flex';
            bubble.style.alignItems = 'center';
            bubble.style.gap = '10px';
            
            const listenBtn = document.createElement('button');
            listenBtn.className = 'btn-icon';
            listenBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            listenBtn.title = 'Écouter la réponse (Arabe Littéraire)';
            listenBtn.onclick = () => togglePlayback(text, listenBtn); 
            bubble.appendChild(listenBtn);

            if (helpContent) {
                const helpBtn = document.createElement('button');
                helpBtn.className = 'btn-icon toggle-help-btn';
                helpBtn.innerHTML = '<i class="fa-solid fa-lightbulb"></i>';
                helpBtn.title = 'Afficher l\'aide (Phonétique / Traduction)';
                
                helpBtn.onclick = () => {
                    const helpDiv = msgDiv.querySelector('.aida-help-div');
                    if (helpDiv) helpDiv.classList.toggle('hidden');
                    helpBtn.classList.toggle('active');
                };
                
                bubble.appendChild(helpBtn);
                
                const helpDiv = document.createElement('div');
                helpDiv.className = 'aida-help-div hidden'; 
                helpDiv.innerHTML = helpContent;
                msgDiv.appendChild(helpDiv);
            }
        }

        msgDiv.appendChild(bubble); 
        chatWindow.appendChild(msgDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    };

    // Prompt Initial du Personnage IA
    appendMessage('aida', intro, true); 
    history.push({ role: 'assistant', content: intro });
}
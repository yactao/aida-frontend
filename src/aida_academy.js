// src/aida_academy.js - Logique pour l'Académie MRE (Langues)

import { changePage, spinnerHtml, apiRequest, renderModal, getModalTemplate } from './utils.js';

// --- Variables d'état vocal pour le module ---
let recognition;
let currentAudio = null;
let currentListenBtn = null;

// --- Scénario de Prototype MRE (Arabe/Darija) ---
const prototypeScenario = {
    id: 'scen-1',
    title: "Scénario 1 : Commander son petit-déjeuner",
    language: "Arabe (Darija Marocain)",
    level: "Débutant",
    context: "Vous entrez dans une petite 'hanout' (boutique/café) à marrakech. Le vendeur vous sourit et vous attend.",
    characterName: "Le Vendeur (البائع)",
    characterIntro: "صباح الخير، تفضل. شنو بغيتي اليوم؟ (Sabah al-khayr, tfaddal. Chnou bghiti l-youm?) - Bonjour, entrez. Qu'est-ce que vous voulez aujourd'hui ?",
    objectives: [
        "Demander un thé à la menthe et un pain au chocolat.",
        "Comprendre le prix total.",
        "Dire 'Merci' et 'Au revoir'."
    ]
};

// Fonction pour définir la personnalité de l'IA (le "système prompt")
function getAcademySystemPrompt(scenario) {
    return `You are an expert language immersion tutor. You are currently playing the role of "${scenario.characterName}" in the following context: "${scenario.context}". The conversation is conducted primarily in Moroccan Arabic (Darija), but you must understand and respond in kind to French/English as a supportive tutor, while encouraging the student to use Darija.
Your key goals are:
1.  **Impersonation**: Maintain the character and the setting (e.g., a seller in a shop).
2.  **Pedagogy**: If the student makes a minor linguistic error, correct it subtly (e.g., rephrase the correct way). If the student makes a major error or struggles, gently guide them without giving the answer, or provide a brief French/Arabic tip.
3.  **Objective Tracking**: The student's goals are: ${scenario.objectives.join(', ')}. Guide the conversation towards these goals naturally.
4.  **Correction MRE**: When providing corrections, focus on practical Darija usage and politeness phrases.
5.  **Output**: Respond as the character, always using the tone appropriate for the setting.`;
}


// --- 2. Fonctions de Rendu des Dashboards ---

export async function renderAcademyStudentDashboard() {
    const page = document.getElementById('student-dashboard-page');
    changePage('student-dashboard-page'); 

    const scenarios = [prototypeScenario]; // Liste des scénarios pour l'élève

    let html = `
        <h2>Bienvenue ${window.currentUser.firstName} sur l'Académie MRE! 🌍</h2>
        <p class="subtitle">Pratiquez l'arabe MRE (Darija) en immersion totale.</p>

        <h3 style="margin-top: 2rem;">Vos Scénarios d'Immersion</h3>
        <div class="dashboard-grid">
    `;

    scenarios.forEach(scen => {
        html += `
            <div class="dashboard-card" data-scenario-id="${scen.id}" style="cursor: pointer;">
                <h4>${scen.title}</h4>
                <p>Langue : <strong>${scen.language}</strong></p>
                <p>Niveau : ${scen.level}</p>
                <p style="margin-top: 1rem;">Objectif: ${scen.objectives[0]}...</p>
                <div style="text-align: right; margin-top: 1rem;">
                    <button class="btn btn-main start-scenario-btn" data-scenario-id="${scen.id}"><i class="fa-solid fa-play"></i> Commencer</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    page.innerHTML = html;

    // Gestion de l'événement de clic pour démarrer le scénario
    page.querySelectorAll('.start-scenario-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            renderScenarioViewer(prototypeScenario);
        });
    });
    page.querySelectorAll('.dashboard-card').forEach(card => {
        card.addEventListener('click', () => {
             renderScenarioViewer(prototypeScenario);
        });
    });
}

// Vue pour le chat immersif (Prototype Textuel)
function renderScenarioViewer(scenario) {
    const p = document.getElementById('content-viewer-page'); // Réutilisation de la page d'affichage de contenu
    changePage('content-viewer-page');

    p.innerHTML = `
        <button id="back-to-academy-dash" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> Retour aux scénarios</button>
        
        <div class="card" style="margin-top:1rem;">
            <h2>${scenario.title}</h2>
            <p class="subtitle">${scenario.context}</p>
            <p style="font-size: 0.9em; color: var(--warning-color); margin-bottom: 1rem;">
                <i class="fa-solid fa-info-circle"></i> Mode Prototype : Conversation textuelle seulement.
            </p>

            <div id="scenario-chat-window" style="height: 400px; overflow-y: auto; padding: 10px; border: 1px solid #ccc; border-radius: 8px; margin-top: 1.5rem; background-color: var(--aida-chat-bg);">
                </div>

            <form id="scenario-chat-form" style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <textarea id="user-scenario-input" placeholder="Parlez en Arabe ou en Français pour commencer..." rows="2" style="flex-grow: 1; resize: none;"></textarea>
                <button type="submit" class="btn btn-main" style="width: 100px; flex-shrink: 0;"><i class="fa-solid fa-paper-plane"></i></button>
            </form>
            <div id="scenario-spinner" class="hidden" style="text-align: right; margin-top: 0.5rem;">${spinnerHtml}</div>
            <p class="error-message" id="scenario-error"></p>
        </div>
    `;

    const chatWindow = document.getElementById('scenario-chat-window');
    const chatForm = document.getElementById('scenario-chat-form');
    const userInput = document.getElementById('user-scenario-input');
    const spinner = document.getElementById('scenario-spinner');
    const errorDisplay = document.getElementById('scenario-error');
    
    document.getElementById('back-to-academy-dash').addEventListener('click', renderAcademyStudentDashboard);

    // Initialisation de l'historique avec le System Prompt
    const history = [{ role: "system", content: getAcademySystemPrompt(scenario) }];

    // Fonction d'affichage des messages (style chat)
    const appendMessage = (sender, text) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender === 'user' ? 'user' : 'aida'}`;
        
        const bubble = document.createElement('div');
        bubble.className = sender === 'user' ? 'user-message' : 'aida-message';
        // Note: Utilisons les classes CSS du style.css pour les messages:
        // .aida-message et .user-message sont déjà définis pour la modal d'aide.
        bubble.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
        
        msgDiv.appendChild(bubble);
        
        // Simuler les styles d'alignement de la modal d'aide (aida-message est flex-start, user-message est flex-end)
        msgDiv.style.alignSelf = sender === 'user' ? 'flex-end' : 'flex-start';
        msgDiv.style.marginLeft = sender === 'user' ? 'auto' : 'unset';
        
        chatWindow.appendChild(msgDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    };

    // Prompt Initial du Personnage IA
    appendMessage('aida', scenario.characterIntro);
    history.push({ role: 'assistant', content: scenario.characterIntro });


    // Gestion de l'envoi de message
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (!message) return;

        appendMessage('user', message);
        userInput.value = '';
        spinner.classList.remove('hidden');
        errorDisplay.textContent = '';
        
        history.push({ role: 'user', content: message });

        try {
            // Appel à la route de chat de l'Académie
            const response = await apiRequest('/academy/ai/chat', 'POST', { history });
            
            const aidaResponse = response.reply;
            appendMessage('aida', aidaResponse);
            history.push({ role: 'assistant', content: aidaResponse });

        } catch (err) {
            errorDisplay.textContent = `Erreur: Conversation interrompue. ${err.message}`;
            history.pop(); 
        } finally {
            spinner.classList.add('hidden');
        }
    });
}

// --- Fonctions Vocales (Réutilisées du Playground) ---

function setupSpeechRecognition(micBtn, userInput) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        micBtn.disabled = true;
        micBtn.title = "La reconnaissance vocale n'est pas supportée par votre navigateur.";
        return;
    }
    recognition = new SpeechRecognition();
    // Nous définissons la langue sur Arabe d'Arabie Saoudite (ar-SA) car elle est généralement bien supportée pour la reconnaissance de l'Arabe.
    recognition.lang = 'ar-SA'; 
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        // On ne soumet pas automatiquement ici, on laisse l'utilisateur cliquer sur Envoyer
    };
    recognition.onstart = () => micBtn.classList.add('recording');
    recognition.onend = () => micBtn.classList.remove('recording');
    recognition.onerror = (event) => {
        console.error("Erreur de reconnaissance vocale:", event.error);
        micBtn.classList.remove('recording');
        alert("Erreur micro. Assurez-vous que le micro est autorisé.");
    };
}

function toggleListening(micBtn) {
    if (!recognition) return;
    if (micBtn.classList.contains('recording')) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

async function togglePlayback(text, buttonEl) {
    // Note: Réutilisation de la route /api/ai/synthesize-speech qui existe déjà dans server.js
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
        currentListenBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        currentListenBtn.classList.remove('active-speaker');
    }

    currentListenBtn = buttonEl;
    buttonEl.innerHTML = `<div class="spinner-dots" style="transform: scale(0.6);"><span></span><span></span><span></span></div>`;

    try {
        // Paramètres pour une voix Arabophone si possible (Réutiliser les paramètres du Playground)
        const voice = 'ar-XA-Wavenet-B'; // Exemple de voix Arabe Google TTS
        const rate = 1.0;
        const pitch = 0.0;

        const response = await apiRequest('/ai/synthesize-speech', 'POST', { text, voice, rate, pitch });
        
        // Assurez-vous que l'API renvoie un objet avec audioContent
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
        alert(`Impossible de jouer la voix du Vendeur. Le service est-il configuré?`);
    }
}


// --- Fonctions de Rendu (renderScenarioViewer MIS À JOUR) ---

// ... (Gardez le code getAcademySystemPrompt, renderAcademyStudentDashboard)

// Vue pour le chat immersif (Intégration de la VOIX)
function renderScenarioViewer(scenario) {
    const p = document.getElementById('content-viewer-page');
    changePage('content-viewer-page');

    p.innerHTML = `
        <button id="back-to-academy-dash" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> Retour aux scénarios</button>
        
        <div class="card" style="margin-top:1rem;">
            <h2>${scenario.title}</h2>
            <p class="subtitle">${scenario.context}</p>
            <p style="font-size: 0.9em; color: var(--primary-color); margin-bottom: 1rem;">
                <i class="fa-solid fa-microphone-alt"></i> **Mode Vocal Activé.** Cliquez sur le haut-parleur pour écouter ou sur le micro pour parler.
            </p>

            <div id="scenario-chat-window" style="height: 400px; overflow-y: auto; padding: 10px; border: 1px solid #ccc; border-radius: 8px; margin-top: 1.5rem; background-color: var(--aida-chat-bg);">
                </div>

            <form id="scenario-chat-form" style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <textarea id="user-scenario-input" placeholder="Parlez en Arabe ou écrivez votre réponse..." rows="2" style="flex-grow: 1; resize: none;"></textarea>
                
                <button type="button" id="mic-btn" class="btn-icon" title="Parler">
                    <i class="fa-solid fa-microphone"></i>
                </button>

                <button type="submit" class="btn btn-main" style="width: 100px; flex-shrink: 0;"><i class="fa-solid fa-paper-plane"></i></button>
            </form>
            <div id="scenario-spinner" class="hidden" style="text-align: right; margin-top: 0.5rem;">${spinnerHtml}</div>
            <p class="error-message" id="scenario-error"></p>
        </div>
    `;

    const chatWindow = document.getElementById('scenario-chat-window');
    const chatForm = document.getElementById('scenario-chat-form');
    const userInput = document.getElementById('user-scenario-input');
    const spinner = document.getElementById('scenario-spinner');
    const errorDisplay = document.getElementById('scenario-error');
    const micBtn = document.getElementById('mic-btn');
    
    document.getElementById('back-to-academy-dash').addEventListener('click', renderAcademyStudentDashboard);

    // Initialisation des systèmes Vocaux
    setupSpeechRecognition(micBtn, userInput);
    micBtn.addEventListener('click', () => toggleListening(micBtn));


    // Logique de Chat et d'Affichage
    const history = [{ role: "system", content: getAcademySystemPrompt(scenario) }];

    const appendMessage = (sender, text, canListen = false) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender === 'user' ? 'user' : 'aida'}`;
        
        const bubble = document.createElement('div');
        bubble.className = sender === 'user' ? 'user-message' : 'aida-message';
        bubble.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
        msgDiv.appendChild(bubble);
        
        msgDiv.style.alignSelf = sender === 'user' ? 'flex-end' : 'flex-start';
        msgDiv.style.marginLeft = sender === 'user' ? 'auto' : 'unset';

        // AJOUT du bouton Écouter pour l'IA
        if (sender === 'aida' && canListen) {
            const controls = document.createElement('div');
            controls.className = 'aida-controls'; // Réutilisation des styles du Playground
            controls.style.marginTop = '5px';
            const listenBtn = document.createElement('button');
            listenBtn.className = 'btn-icon';
            listenBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            listenBtn.title = 'Écouter la réponse';
            listenBtn.onclick = () => togglePlayback(text, listenBtn);
            controls.appendChild(listenBtn);
            msgDiv.appendChild(controls);
        }
        
        chatWindow.appendChild(msgDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    };

    // Prompt Initial du Personnage IA
    appendMessage('aida', scenario.characterIntro, true); // Le message initial est lisible
    history.push({ role: 'assistant', content: scenario.characterIntro });


    // Gestion de l'envoi de message
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (!message) return;

        appendMessage('user', message);
        userInput.value = '';
        spinner.classList.remove('hidden');
        errorDisplay.textContent = '';
        
        history.push({ role: 'user', content: message });

        try {
            const response = await apiRequest('/academy/ai/chat', 'POST', { history });
            
            const aidaResponse = response.reply;
            appendMessage('aida', aidaResponse, true); // Les réponses de l'IA sont lisibles
            history.push({ role: 'assistant', content: aidaResponse });

        } catch (err) {
            errorDisplay.textContent = `Erreur: Conversation interrompue. ${err.message}`;
            history.pop(); 
        } finally {
            spinner.classList.add('hidden');
        }
    });
}

// --- 3. Stubs des Autres Dashboards (Doivent exister pour updateUI) ---

export async function renderAcademyTeacherDashboard() {
    const page = document.getElementById('teacher-dashboard-page');
    changePage('teacher-dashboard-page'); 
    page.innerHTML = `
        <h2>Bienvenue ${window.currentUser.firstName} sur l'Académie MRE!</h2>
        <p>Rôle : Enseignant. Prochaine étape : Outil de création/attribution de scénarios.</p>
    `;
}

export async function renderAcademyParentDashboard() {
    const page = document.getElementById('student-dashboard-page'); 
    changePage('student-dashboard-page'); 
    page.innerHTML = `
        <h2>Bienvenue ${window.currentUser.firstName} sur l'Académie MRE!</h2>
        <p>Rôle : Parent. Prochaine étape : Le suivi intelligent de la progression.</p>
    `;
}
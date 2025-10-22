// src/aida_academy.js - Logique pour l'Académie MRE (Langues, Voix, Bilan)

import { changePage, spinnerHtml, apiRequest, renderModal, getModalTemplate } from './utils.js';

// --- Variables d'état vocal pour le module (Globales au module) ---
let recognition;
let currentAudio = null;
let currentListenBtn = null; 


// --- 1. Scénario de Prototype MRE (Arabe Littéraire) ---
const prototypeScenario = {
    id: 'scen-1',
    // CHANGEMENTS POUR L'ARABE LITTÉRAIRE (AL-FUSHA)
    title: "Scénario 1 : Commander son petit-déjeuner",
    language: "Arabe Littéraire (Al-Fusha)", 
    level: "Débutant",
    context: "Vous entrez dans un café moderne au Caire. Le serveur vous sourit et vous attend.", 
    characterName: "Le Serveur (النادِل)", 
    
    // Le message est en Arabe Littéraire avec les balises d'aide
    characterIntro: "صباح الخير، تفضل. ماذا تود أن تطلب اليوم؟ <PHONETIQUE>Sabah al-khayr, tafaddal. Mādhā tawaddu an taṭlub al-yawm?</PHONETIQUE> <TRADUCTION>Bonjour, entrez. Que souhaitez-vous commander aujourd'hui ?</TRADUCTION>",
    objectives: [
        "Demander un thé et un croissant.", 
        "Comprendre le prix total.",
        "Dire 'Merci' et 'Au revoir'."
    ]
    // SUPPRESSION DE voiceCode ici pour éviter le blocage de la connexion.
};

// Fonction pour définir la personnalité de l'IA (le "system prompt")
function getAcademySystemPrompt(scenario) {
    return `Tu es un tuteur expert en immersion linguistique. Ton rôle actuel est celui de "${scenario.characterName}" dans le contexte suivant : "${scenario.context}". La conversation doit se dérouler **UNIQUEMENT en Arabe Littéraire (Al-Fusha)**. 
    
    // NOUVELLES INSTRUCTIONS CLÉS POUR LE FORMATAGE ET LA VOIX :
    // 1. Ton message doit commencer par la phrase en Arabe Littéraire.
    // 2. À la suite de la phrase (sur la même ligne), tu dois ajouter la phonétique et la traduction, EN UTILISANT CE FORMAT STRICT:
    //    <PHONETIQUE>Ta transcription phonétique</PHONETIQUE> <TRADUCTION>Ta traduction française</TRADUCTION>
    // 3. N'utilise pas d'autres balises dans ta réponse.
    
    Tes objectifs clés sont :
    1.  **Incarnation du Personnage** : Maintiens le rôle et le décor. Ne romps jamais ton rôle.
    2.  **Pédagogie et Soutien** : Si l'élève commet une erreur, corrige-la subtilement. Guide-le doucement par une question ou un indice. Les corrections doivent se concentrer sur la **Grammaire et Vocabulaire de l'Arabe Littéraire**.
    3.  **Suivi des Objectifs** : Les objectifs de l'élève sont : ${scenario.objectives.join(', ')}. Guide la conversation vers l'accomplissement de ces objectifs.
    4.  **Focalisation Fusha** : Concentre les interactions sur l'usage pratique de l'**Arabe Littéraire**.
    5.  **Format de Réponse** : Réponds toujours en tant que le personnage. Assure-toi que la première ligne du message est la seule chose que l'on verra sans l'aide.`;
}


// --- 2. Fonctions Vocales (Pour l'Immersion) ---

function setupSpeechRecognition(micBtn, userInput) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        micBtn.disabled = true;
        micBtn.title = "La reconnaissance vocale n'est pas supportée par votre navigateur.";
        return;
    }
    recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA'; 
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
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
        // UTILISATION DE LA VOIX FUSHA (ARABE LITTÉRAIRE) POUR LA COHÉRENCE
        const voice = 'ar-XA-Wavenet-D'; 
        const rate = 1.0;
        const pitch = 0.0;

        const response = await apiRequest('/ai/synthesize-speech', 'POST', { text, voice, rate, pitch });
        
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


// --- 3. Logique de Bilan et de Sauvegarde ---

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
        const response = await apiRequest('/academy/ai/chat', 'POST', { history, response_format: { type: "json_object" } });
        
        history.pop(); 
        
        let report;
        try {
            report = JSON.parse(response.reply); 
        } catch(e) {
            console.error("Erreur de parsing JSON du rapport IA:", response.reply);
            report = { summaryTitle: "Bilan Indisponible", completionStatus: "Erreur", feedback: ["L'IA n'a pas pu générer le rapport structuré."], newVocabulary: [] };
        }
        
        // 2. Sauvegarder la Session (Backend)
        try {
             await apiRequest('/academy/session/save', 'POST', {
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
    const vocabHtml = report.newVocabulary.map(v => `<li><strong>${v.word}</strong>: ${v.translation}</li>`).join('') || '<li>Aucun nouveau vocabulaire relevé.</li>';
    const feedbackHtml = report.feedback.map(f => `<li>${f}</li>`).join('') || '<li>Aucun point de feedback majeur.</li>';
    
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


// --- 4. Fonctions de Rendu (Mises à Jour) ---

export async function renderAcademyStudentDashboard() {
    const page = document.getElementById('student-dashboard-page');
    changePage('student-dashboard-page'); 

    const scenarios = [prototypeScenario]; // Liste des scénarios pour l'élève

    let html = `
        <h2>Bienvenue ${window.currentUser.firstName} sur l'Académie MRE! 🌍</h2>
        <p class="subtitle">Pratiquez l'Arabe Littéraire (Al-Fusha) en immersion totale.</p>

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

    page.querySelectorAll('.start-scenario-btn, .dashboard-card').forEach(element => {
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            renderScenarioViewer(prototypeScenario);
        });
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
    let textToRead = text; 
    let helpContent = ''; 
    let isAidaMessage = sender === 'aida' && (text.includes('<PHONETIQUE>') || text.includes('<TRADUCTION>'));


    // --- 1. Détection, Extraction et Remplissage du Contenu ---
    if (isAidaMessage) {
        
        // --- Extraction de l'Arabe pur (ce qui est avant la première balise) ---
        const firstTagIndex = Math.min(
            text.indexOf('<PHONETIQUE>') > -1 ? text.indexOf('<PHONETIQUE>') : Infinity,
            text.indexOf('<TRADUCTION>') > -1 ? text.indexOf('<TRADUCTION>') : Infinity
        );
        const arabicPart = text.substring(0, firstTagIndex).trim();
        textToRead = arabicPart; // Seulement l'Arabe pour la voix

        // --- Extraction de l'aide pour l'affichage masqué ---
        const phoneticMatch = text.match(/<PHONETIQUE>(.*?)<\/PHONETIQUE>/);
        const traductionMatch = text.match(/<TRADUCTION>(.*?)<\/TRADUCTION>/);
        
        if (phoneticMatch) { helpContent += `<p class="help-phonetic">Phonétique: ${phoneticMatch[1].trim()}</p>`; }
        if (traductionMatch) { helpContent += `<p class="help-translation">Traduction: ${traductionMatch[1].trim()}</p>`; }

        // Le texte affiché est MAINTENANT UNIQUEMENT la partie en Arabe pur (pour l'immersion)
        displayedText = `<p class="arabic-text-only">${arabicPart}</p>`;
    } 
    
    // Remplissage de la bulle avec le contenu structuré ou le fallback
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
        listenBtn.onclick = () => togglePlayback(textToRead, listenBtn); 
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


// Vue pour le chat immersif (Intégration de la VOIX et Bilan)
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
                <i class="fa-solid fa-microphone-alt"></i> **Mode Vocal Activé.** Parlez avec le micro ou utilisez le clavier.
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

    setupSpeechRecognition(micBtn, userInput);
    micBtn.addEventListener('click', () => toggleListening(micBtn));

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
            const response = await apiRequest('/academy/ai/chat', 'POST', { history });
            
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


// --- 5. Stubs des Autres Dashboards ---

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
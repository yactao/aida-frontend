// Ce fichier est chargé APRÈS script.js, il peut donc accéder aux fonctions globales (changePage, apiRequest, getModalTemplate, showAidaHelpModal, spinnerHtml, etc.)

/**
 * Fonction de rendu de la page d'accueil de l'Académie MRE.
 * Elle est appelée une seule fois par le lazy loader (script.js).
 */
function renderAcademieMREPage() {
    const page = document.getElementById('academie-mre-page');
    
    // 1. Rendre la structure de la page
    page.innerHTML = `
        <div class="page-header">
            <h2><i class="fa-solid fa-graduation-cap" style="color: var(--secondary-color);"></i> Académie MRE - Apprentissage de l'Arabe Classique</h2>
            <p style="color: #888;">Espace dédié aux élèves francophones. AIDA t'aide à faire le pont entre le français et l'arabe.</p>
        </div>
        <div class="dashboard-grid">
            
            <div class="dashboard-card card-mre-primary" id="mre-daily-dialogue">
                <h4>Dialogue Quotidien Bilingue</h4>
                <p>Échange avec AIDA sur des situations de la vie marocaine (Souk, École). Tes erreurs sont expliquées en français.</p>
                <div style="text-align: right; margin-top: 1rem;">
                    <button class="btn btn-main start-mre-dialogue">Commencer le Dialogue</button>
                </div>
            </div>
            
            <div class="dashboard-card card-mre-secondary" id="mre-redaction-module">
                <h4>Correction de Rédaction (Arabe)</h4>
                <p>Écris un paragraphe en arabe classique. L'IA corrige la grammaire et te donne des pistes d'amélioration en français.</p>
                <div style="text-align: right; margin-top: 1rem;">
                    <button class="btn btn-secondary start-mre-redaction">Commencer l'exercice</button>
                </div>
            </div>
            
        </div>
    `;
    
    // 2. Attacher les écouteurs d'événements
    
    // Gestionnaire du Dialogue AIDA MRE
    page.querySelector('.start-mre-dialogue').addEventListener('click', () => {
        // La fonction showAidaHelpModal est globale (définie dans script.js)
        if (typeof showAidaHelpModal === 'function') {
            // NOTE: Le chemin est /academie-mre/aida-chat SANS /api/
            showAidaHelpModal(
                "Bonjour AIDA ! Je suis prêt(e) pour le dialogue du jour. J'aimerais pratiquer comment me présenter à un nouveau camarade.", 
                '/academie-mre/aida-chat' // Endpoint spécifique MRE
            ); 
        } else {
            alert("Erreur: La fonction d'aide AIDA n'est pas disponible.");
        }
    });

    // Gestionnaire de l'exercice de Rédaction (prochaine étape du plan)
    page.querySelector('.start-mre-redaction').addEventListener('click', () => {
        alert("Le module de Rédaction est en construction. Prochaine étape : implémenter la correction bilingue !");
    });
    
    // 3. Afficher la page et mettre à jour l'UI
    changePage('academie-mre-page');
    // Mise à jour de l'UI pour le cloisonnement (masque les liens inutiles)
    window.updateUI(); 
}

// Fonction d'initialisation globale que le Shell va appeler
window.initAcademieMRE = function() {
    renderAcademieMREPage();
};

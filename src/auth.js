// src/auth.js

import { apiRequest, changePage } from './utils.js';
import { updateUI } from './ui_utils.js';

// --- Authentification AIDA Éducation (EXISTANT) ---

export function renderAuthPage() {
    const t = `<div class="card" style="max-width:400px;margin:2rem auto"><div id="login-form-container"><h3>Connexion - AÏDA Éducation</h3><form id="login-form"><div class=form-group><label for=login-email>Email</label><input type=email id=login-email required></div><div class=form-group><label for=login-password>Mot de passe</label><input type=password id=login-password required></div><button type=submit class="btn btn-main">Se connecter</button><p class=error-message id=login-error></p></form><p>Pas de compte ? <a href=# id=show-signup>Inscrivez-vous</a></p></div><div id=signup-form-container class=hidden><h3>Inscription - AÏDA Éducation</h3><form id=signup-form><div class=form-group><label for=signup-email>Email</label><input type=email id=signup-email required></div><div class=form-group><label for=signup-password>Mot de passe</label><input type=password id=signup-password required></div><div class=form-group><label for=signup-role>Je suis un(e)</label><select id=signup-role><option value=student>Élève</option><option value=teacher>Enseignant</option></select></div><button type=submit class="btn btn-main">S'inscrire</button><p class=error-message id=signup-error></p></form><p>Déjà un compte ? <a href=# id=show-login>Connectez-vous</a></p></div></div>`;
    document.getElementById('auth-page').innerHTML = t;
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
    document.getElementById('show-signup').addEventListener('click', toggleAuthForms);
    document.getElementById('show-login').addEventListener('click', toggleAuthForms);
    changePage('auth-page');
}

async function handleLogin(e) { 
    e.preventDefault(); 
    try { 
        const data = await apiRequest('/auth/login', 'POST', { 
            email: document.getElementById('login-email').value, 
            password: document.getElementById('login-password').value 
        }); 
        window.currentUser = data.user; 
        localStorage.setItem('currentUser', JSON.stringify(window.currentUser)); 
        updateUI(); 
    } catch (err) { 
        document.getElementById('login-error').textContent = err.message; 
    } 
}
async function handleSignup(e) { 
    e.preventDefault(); 
    try { 
        const data = await apiRequest('/auth/signup', 'POST', { 
            email: document.getElementById('signup-email').value, 
            password: document.getElementById('signup-password').value, 
            role: document.getElementById('signup-role').value 
        }); 
        window.currentUser = data.user; 
        localStorage.setItem('currentUser', JSON.stringify(window.currentUser)); 
        updateUI(); 
    } catch (err) { 
        document.getElementById('signup-error').textContent = err.message; 
    } 
}
function toggleAuthForms(e) { 
    e.preventDefault(); 
    document.getElementById('login-form-container').classList.toggle('hidden'); 
    document.getElementById('signup-form-container').classList.toggle('hidden'); 
}


// --- Authentification Académie MRE (NOUVEAU) ---

export function renderAcademyAuthPage() {
    const t = `<div class="card" style="max-width:400px;margin:2rem auto">
        <h2 style="text-align: center; margin-bottom: 1rem;">Académie MRE</h2>
        <div id="academy-login-form-container">
            <h3>Connexion - Académie</h3>
            <form id="academy-login-form">
                <div class="form-group"><label for="academy-login-email">Email</label><input type="email" id="academy-login-email" required placeholder="ex: paul@academie-mre.com"></div>
                <div class="form-group"><label for="academy-login-password">Mot de passe</label><input type="password" id="academy-login-password" required></div>
                <button type="submit" class="btn btn-main">Se connecter à l'Académie</button>
                <p class="error-message" id="academy-login-error"></p>
            </form>
            <p>Pas de compte ? <a href="#" id="show-academy-signup">Inscrivez-vous</a></p>
        </div>
        <div id="academy-signup-form-container" class="hidden">
            <h3>Inscription - Académie</h3>
            <form id="academy-signup-form">
                <div class="form-group"><label for="academy-signup-email">Email</label><input type="email" id="academy-signup-email" required placeholder="ex: paul@academie-mre.com"></div>
                <div class="form-group"><label for="academy-signup-password">Mot de passe</label><input type="password" id="academy-signup-password" required></div>
                <div class="form-group"><label for="academy-signup-role">Mon Rôle</label>
                    <select id="academy-signup-role">
                        <option value="academy_student">Élève</option>
                        <option value="academy_teacher">Enseignant / Tuteur</option>
                        <option value="academy_parent">Parent</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-main">S'inscrire</button>
                <p class="error-message" id="academy-signup-error"></p>
            </form>
            <p>Déjà un compte ? <a href="#" id="show-academy-login">Connectez-vous</a></p>
        </div>
    </div>`;
    document.getElementById('auth-page').innerHTML = t; 
    document.getElementById('academy-login-form').addEventListener('submit', handleAcademyLogin);
    document.getElementById('academy-signup-form').addEventListener('submit', handleAcademySignup);
    document.getElementById('show-academy-signup').addEventListener('click', toggleAcademyAuthForms);
    document.getElementById('show-academy-login').addEventListener('click', toggleAcademyAuthForms);
    changePage('auth-page'); 
}

async function handleAcademyLogin(e) { 
    e.preventDefault(); 
    document.getElementById('academy-login-error').textContent = '';
    try { 
        // /academy/auth/login est une route API définie dans server.js
        const data = await apiRequest('/academy/auth/login', 'POST', { 
            email: document.getElementById('academy-login-email').value, 
            password: document.getElementById('academy-login-password').value 
        }); 
        window.currentUser = data.user; 
        localStorage.setItem('currentUser', JSON.stringify(window.currentUser)); 
        updateUI(); 
    } catch (err) { 
        document.getElementById('academy-login-error').textContent = err.message; 
    } 
}

async function handleAcademySignup(e) { 
    e.preventDefault(); 
    document.getElementById('academy-signup-error').textContent = '';
    try { 
        // /academy/auth/signup est une route API définie dans server.js
        const data = await apiRequest('/academy/auth/signup', 'POST', { 
            email: document.getElementById('academy-signup-email').value, 
            password: document.getElementById('academy-signup-password').value, 
            role: document.getElementById('academy-signup-role').value 
        }); 
        window.currentUser = data.user; 
        localStorage.setItem('currentUser', JSON.stringify(window.currentUser)); 
        updateUI(); 
    } catch (err) { 
        document.getElementById('academy-signup-error').textContent = err.message; 
    } 
}

function toggleAcademyAuthForms(e) { 
    e.preventDefault(); 
    document.getElementById('academy-login-form-container').classList.toggle('hidden'); 
    document.getElementById('academy-signup-form-container').classList.toggle('hidden'); 
}
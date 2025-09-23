// On importe un outil pour faire des requêtes HTTP
const axios = require('axios');

// Ceci est notre fonction intermédiaire
exports.handler = async function(event, context) {
  // --- DÉBUT DU MODE DÉTECTIVE ---
  console.log("--- FONCTION PROXY DÉCLENCHÉE ---");
  console.log("Requête reçue pour le chemin :", event.path);
  
  const backendUrl = process.env.VITE_BACKEND_URL;

  // Log crucial pour vérifier la variable secrète
  console.log("URL du backend lue depuis les secrets Netlify :", backendUrl);

  // Vérification de sécurité : si l'URL n'est pas trouvée, on arrête tout.
  if (!backendUrl) {
    console.error("!!! ERREUR FATALE : VITE_BACKEND_URL n'est pas définie sur Netlify.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur de configuration du serveur : l'adresse du backend est manquante." })
    };
  }
  
  const apiPath = event.path.replace('/.netlify/functions/api', '');
  const fullUrl = `${backendUrl}${apiPath}`;
  console.log("La requête va être transmise à :", fullUrl);
  // --- FIN DU MODE DÉTECTIVE ---

  try {
    const response = await axios({
      method: event.httpMethod,
      url: fullUrl,
      headers: { 'Content-Type': 'application/json' },
      data: event.body,
      params: event.queryStringParameters,
    });

    console.log("Succès ! Réponse reçue du backend Azure. Statut :", response.status);
    return {
      statusCode: response.status,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error("!!! ERREUR lors de la communication avec le backend Azure :", error);
    const statusCode = error.response ? error.response.status : 500;
    const body = error.response ? JSON.stringify(error.response.data) : JSON.stringify({ error: "Le proxy n'a pas pu joindre le serveur backend." });
    return { statusCode, body };
  }
};



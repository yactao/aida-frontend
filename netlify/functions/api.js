// On importe un outil pour faire des requêtes HTTP
const axios = require('axios');

// Ceci est notre fonction intermédiaire
exports.handler = async function(event, context) {
  const backendUrl = process.env.VITE_BACKEND_URL;

  if (!backendUrl) {
    console.error("!!! ERREUR FATALE : VITE_BACKEND_URL n'est pas définie sur Netlify.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur de configuration du serveur : l'adresse du backend est manquante." })
    };
  }
  
  // On reconstruit le chemin de l'API demandé par le frontend
  const apiPath = event.path.replace('/.netlify/functions/api', '');
  
  // --- LA CORRECTION EST ICI ---
  // On ajoute bien "/api" devant le chemin pour appeler la bonne route sur le serveur Azure.
  const fullUrl = `${backendUrl}/api${apiPath}`;
  // --- FIN DE LA CORRECTION ---

  console.log("La requête va être transmise à :", fullUrl);

  try {
    const response = await axios({
      method: event.httpMethod,
      url: fullUrl,
      headers: { 'Content-Type': 'application/json' },
      data: event.body,
      params: event.queryStringParameters,
    });

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
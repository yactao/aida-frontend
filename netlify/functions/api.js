const axios = require('axios');

exports.handler = async function(event, context) {
  const backendUrl = process.env.VITE_BACKEND_URL;
  
  if (!backendUrl) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur de configuration du serveur : l'adresse du backend est manquante." })
    };
  }
  
  const apiPath = event.path.replace('/.netlify/functions/api', '');
  
  // --- VERSION FINALE ET CORRECTE ---
  // On remet l'ajout de "/api" pour construire l'URL que le serveur Azure attend.
  const fullUrl = `${backendUrl}/api${apiPath}`;
  // --- FIN DE LA CORRECTION ---

  console.log("URL finale transmise à Azure :", fullUrl);

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
    const statusCode = error.response ? error.response.status : 500;
    const body = error.response ? JSON.stringify(error.response.data) : JSON.stringify({ error: "Le proxy n'a pas pu joindre le serveur backend." });
    return { statusCode, body };
  }
};

    


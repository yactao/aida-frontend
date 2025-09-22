// On importe un outil pour faire des requêtes HTTP
const axios = require('axios');

exports.handler = async function(event, context) {
  // L'URL de votre backend Azure est maintenant une variable secrète sur Netlify
  const backendUrl = process.env.VITE_BACKEND_URL;
  
  // On reconstruit le chemin de l'API demandé par le frontend
  // ex: /api/auth/login -> /auth/login
  const apiPath = event.path.replace('/.netlify/functions/api', '');
  const fullUrl = `${backendUrl}${apiPath}`;

  try {
    // La fonction transmet la requête au vrai backend
    const response = await axios({
      method: event.httpMethod,
      url: fullUrl,
      headers: { 'Content-Type': 'application/json' },
      data: event.body,
      params: event.queryStringParameters,
    });

    // Et renvoie la réponse du backend au frontend
    return {
      statusCode: response.status,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    // S'il y a une erreur, on la transmet aussi
    const statusCode = error.response ? error.response.status : 500;
    const body = error.response ? JSON.stringify(error.response.data) : JSON.stringify({ error: 'Erreur du proxy' });
    return { statusCode, body };
  }
};

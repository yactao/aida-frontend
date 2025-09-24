// --- CODE DE TEST DE DIAGNOSTIC ---
// Ce code a pour seul but de vérifier si la redirection Netlify fonctionne.
// Il n'a pas besoin d'axios ou des variables d'environnement.

exports.handler = async function(event, context) {
  // Ce message apparaîtra dans les logs de la fonction sur Netlify
  console.log("--- LE PROXY DE TEST A BIEN ÉTÉ ATTEINT ---");
  console.log("Requête reçue pour le chemin :", event.path);

  // On renvoie une réponse unique pour la voir dans le navigateur.
  // Le code 418 signifie "I'm a teapot" (Je suis une théière), 
  // c'est un code d'erreur amusant utilisé pour les tests.
  return {
    statusCode: 418, 
    body: JSON.stringify({ 
      message: "Bravo ! Le proxy de test est bien atteint.",
      chemin_recu: event.path 
    })
  };
};

    


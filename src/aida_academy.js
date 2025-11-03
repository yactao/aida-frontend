// src/aida_academy.js - Logique complète pour l'Académie (Mode Série "Zayd et Yasmina")

import { changePage, spinnerHtml, apiRequest, renderModal, getModalTemplate } from './utils.js';

// --- Variables d'état vocal pour le module ---
let recognition;
let currentAudio = null;
let currentListenBtn = null; 
let narratorAudio = null; // NOUVEAU : Audio distinct pour le narrateur


//======================================================================
// 1. STRUCTURE DE LA SÉRIE (LES 20 ÉPISODES)
//======================================================================
const courseData = {
    title: "Zayd et Yasmina : Les Gardiens de l'Astrolabe",
    description: "Apprends les bases de l'arabe en suivant les aventures de Zayd et Yasmina pour retrouver les 100 Mots de Pouvoir.",
    episodes: [
        // --- ARC 1 : LA DÉCOUVERTE (1-4) ---
        {
            id: "ep1",
            title: "Épisode 1 : L'Astrolabe Perdu",
            narratorIntro: "Ah, jeune Gardien ! Bienvenue dans le premier souvenir. C'est ici que tout a commencé... Zayd et Yasmina ne savaient pas encore ce qu'ils allaient découvrir. Regarde bien la vidéo.",
            activities: [
                { id: "ep1-vid", title: "Épisode principal N°1 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep1-mem", title: "Mots de Pouvoir N°1", type: "memorization", data: "ep1-data" },
                { id: "ep1-quiz", title: "Quiz N°1", type: "quiz", data: {} },
                { id: "ep1-dialogue", title: "Dialogue : Parler à Fahim", type: "dialogue", scenarioId: "scen-ep1" }
            ]
        },
        {
            id: "ep2",
            title: "Épisode 2 : Le Premier Mot de Pouvoir",
            narratorIntro: "Le souk ! Un endroit incroyable, rempli de Mots de Pouvoir. Mais fais attention aux marchands, ils sont rusés... Il est temps de pratiquer ta politesse.",
            activities: [
                { id: "ep2-vid", title: "Épisode principal N°2 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep2-mem", title: "Mots de Pouvoir N°2", type: "memorization", data: "ep2-data" },
                { id: "ep2-quiz", title: "Quiz N°2", type: "quiz", data: {} },
                { id: "ep2-dialogue", title: "Dialogue : Le Gardien du Souk", type: "dialogue", scenarioId: "scen-ep2" }
            ]
        },
        {
            id: "ep3",
            title: "Épisode 3 : Le Marchand de Couleurs",
            narratorIntro: "Al-Nissyan a volé les couleurs ! Pour les ramener, tu dois les nommer. Regarde bien cette pomme et dis-moi ce que tu vois.",
            activities: [
                { id: "ep3-vid", title: "Épisode principal N°3 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep3-mem", title: "Mots de Pouvoir N°3", type: "memorization", data: "ep3-data" },
                { id: "ep3-quiz", title: "Quiz N°3", type: "quiz", data: {} },
                { id: "ep3-dialogue", title: "Dialogue : Le Marchand", type: "dialogue", scenarioId: "scen-ep3" }
            ]
        },
        {
            id: "ep4",
            title: "Épisode 4 : L'Album de Famille",
            narratorIntro: "Le Virus de l'Oubli a attaqué les souvenirs de Zayd et Yasmina ! Les visages de leur famille ont disparu. Aide-les à se souvenir !",
            activities: [
                { id: "ep4-vid", title: "Épisode principal N°4 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep4-mem", title: "Mots de Pouvoir N°4", type: "memorization", data: "ep4-data" },
                { id: "ep4-quiz", title: "Quiz N°4", type: "quiz", data: {} },
                { id: "ep4-dialogue", title: "Dialogue : Restaurer l'album", type: "dialogue", scenarioId: "scen-ep4" }
            ]
        },
        // --- ARC 2 : LES ÉPREUVES DE FAHIM (5-10) ---
        {
            id: "ep5",
            title: "Épisode 5 : La Cuisine Fantôme",
            narratorIntro: "J'ai faim ! Mais... toute la nourriture est devenue invisible ! Nomme les aliments pour les faire réapparaître. Vite !",
            activities: [
                { id: "ep5-vid", title: "Épisode principal N°5 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep5-mem", title: "Mots de Pouvoir N°5", type: "memorization", data: "ep5-data" },
                { id: "ep5-quiz", title: "Quiz N°5", type: "quiz", data: {} },
                { id: "ep5-dialogue", title: "Dialogue : Le Festin de Fahim", type: "dialogue", scenarioId: "scen-ep5" }
            ]
        },
        {
            id: "ep6",
            title: "Épisode 6 : La Mémoire de la Maison",
            narratorIntro: "Le grand-père de Zayd et Yasmina a caché le prochain Mot de Pouvoir quelque part dans la maison. Mais où ? Sur ? Ou dans ?",
            activities: [
                { id: "ep6-vid", title: "Épisode principal N°6 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep6-mem", title: "Mots de Pouvoir N°6", type: "memorization", data: "ep6-data" },
                { id: "ep6-quiz", title: "Quiz N°6", type: "quiz", data: {} },
                { id: "ep6-dialogue", title: "Dialogue : Où est le Mot ?", type: "dialogue", scenarioId: "scen-ep6" }
            ]
        },
        {
            id: "ep7",
            title: "Épisode 7 : L'École du Silence",
            narratorIntro: "Silence total... Al-Nissyan a volé les mots de l'école. Rends-leur la parole en nommant les objets de la classe.",
            activities: [
                { id: "ep7-vid", title: "Épisode principal N°7 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep7-mem", title: "Mots de Pouvoir N°7", type: "memorization", data: "ep7-data" },
                { id: "ep7-quiz", title: "Quiz N°7", type: "quiz", data: {} },
                { id: "ep7-dialogue", title: "Dialogue : Le Professeur Silencieux", type: "dialogue", scenarioId: "scen-ep7" }
            ]
        },
        {
            id: "ep8",
            title: "Épisode 8 : La Tour de l'Horloge",
            narratorIntro: "Le temps est arrêté ! L'Astrolabe nous a menés à la Grande Horloge. Nous devons lui dire quel jour nous sommes pour la redémarrer.",
            activities: [
                { id: "ep8-vid", title: "Épisode principal N°8 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep8-mem", title: "Mots de Pouvoir N°8", type: "memorization", data: "ep8-data" },
                { id: "ep8-quiz", title: "Quiz N°8", type: "quiz", data: {} },
                { id: "ep8-dialogue", title: "Dialogue : Le Gardien du Temps", type: "dialogue", scenarioId: "scen-ep8" }
            ]
        },
        {
            id: "ep9",
            title: "Épisode 9 : La Veste Perdue",
            narratorIntro: "Brrr... il fait froid ici. L'Astrolabe nous a menés au sommet d'une montagne. Mais où est la veste de Zayd ? Il faut la trouver !",
            activities: [
                { id: "ep9-vid", title: "Épisode principal N°9 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep9-mem", title: "Mots de Pouvoir N°9", type: "memorization", data: "ep9-data" },
                { id: "ep9-quiz", title: "Quiz N°9", type: "quiz", data: {} },
                { id: "ep9-dialogue", title: "Dialogue : Où est ma veste ?", type: "dialogue", scenarioId: "scen-ep9" }
            ]
        },
        {
            id: "ep10",
            title: "Épisode 10 : La Révélation d'Al-Nissyan",
            narratorIntro: "Le Virus... ce n'est pas un drone ! C'est Al-Nissyan, le Djinn de l'Oubli ! Il s'enfuit vers la Forteresse des Verbes. Nous devons apprendre à *agir* !",
            activities: [
                { id: "ep10-vid", title: "Épisode principal N°10 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep10-mem", title: "Mots de Pouvoir N°10", type: "memorization", data: "ep10-data" },
                { id: "ep10-quiz", title: "Quiz N°10", type: "quiz", data: {} },
                { id: "ep10-dialogue", title: "Dialogue : Je dois agir", type: "dialogue", scenarioId: "scen-ep10" }
            ]
        },
        // --- ARC 3 : LA FORTERESSE DES VERBES (11-15) ---
        {
            id: "ep11",
            title: "Épisode 11 : Le Gardien du Passé",
            narratorIntro: "La porte de la Forteresse est bloquée par un Sphinx. Il ne nous laissera passer que si nous pouvons lui raconter ce que nous avons *fait*.",
            activities: [
                { id: "ep11-vid", title: "Épisode principal N°11 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep11-mem", title: "Mots de Pouvoir N°11", type: "memorization", data: "ep11-data" },
                { id: "ep11-quiz", title: "Quiz N°11", type: "quiz", data: {} },
                { id: "ep11-dialogue", title: "Dialogue : L'Énigme du Sphinx", type: "dialogue", scenarioId: "scen-ep11" }
            ]
        },
        {
            id: "ep12",
            title: "Épisode 12 : La Bibliothèque des Futurs",
            narratorIntro: "Al-Nissyan essaie d'effacer le futur ! Nous devons agir. Que *ferons*-nous ? L'Astrolabe a besoin de savoir ce que tu vas faire.",
            activities: [
                { id: "ep12-vid", title: "Épisode principal N°12 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep12-mem", title: "Mots de Pouvoir N°12", type: "memorization", data: "ep12-data" },
                { id: "ep12-quiz", title: "Quiz N°12", type: "quiz", data: {} },
                { id: "ep12-dialogue", title: "Dialogue : Je le ferai !", type: "dialogue", scenarioId: "scen-ep12" }
            ]
        },
        {
            id: "ep13",
            title: "Épisode 13 : La Voix de Yasmina",
            narratorIntro: "La salle de calligraphie... les mots s'effacent. C'est le carnet de Yasmina ! Rends-lui ses souvenirs. Dis-moi, à qui est ce stylo ?",
            activities: [
                { id: "ep13-vid", title: "Épisode principal N°13 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep13-mem", title: "Mots de Pouvoir N°13", type: "memorization", data: "ep13-data" },
                { id: "ep13-quiz", title: "Quiz N°13", type: "quiz", data: {} },
                { id: "ep13-dialogue", title: "Dialogue : C'est son livre", type: "dialogue", scenarioId: "scen-ep13" }
            ]
        },
        {
            id: "ep14",
            title: "Épisode 14 : Le Duel des Énigmes",
            narratorIntro: "Al-Nissyan t'a piégé ! Pour t'échapper, tu dois décrire le monde qui t'entoure. Est-ce grand ou petit ? Rapide ou lent ?",
            activities: [
                { id: "ep14-vid", title: "Épisode principal N°14 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep14-mem", title: "Mots de Pouvoir N°14", type: "memorization", data: "ep14-data" },
                { id: "ep14-quiz", title: "Quiz N°14", type: "quiz", data: {} },
                { id: "ep14-dialogue", title: "Dialogue : Le point faible d'Al-Nissyan", type: "dialogue", scenarioId: "scen-ep14" }
            ]
        },
        {
            id: "ep15",
            title: "Épisode 15 : Le Cœur de la Forteresse",
            narratorIntro: "Nous y sommes ! Al-Nissyan est là, drainant le pouvoir de l'Astrolabe. C'est le moment de tout utiliser. Révision générale !",
            activities: [
                { id: "ep15-vid", title: "Épisode principal N°15 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep15-mem", title: "Mots de Pouvoir N°15 (Révision)", type: "memorization", data: "ep15-data" },
                { id: "ep15-quiz", title: "Quiz N°15 (Révision)", type: "quiz", data: {} },
                { id: "ep15-dialogue", title: "Dialogue : Le Piège", type: "dialogue", scenarioId: "scen-ep15" }
            ]
        },
        // --- ARC 4 : LE SENS DES MOTS (16-20) ---
        {
            id: "ep16",
            title: "Épisode 16 : L'Illusion du Marché",
            narratorIntro: "Un piège ! Nous sommes de retour au souk, mais tout est gris et cher. Pour briser l'illusion, tu dois acheter la 'Clé de Vérité' au marchand.",
            activities: [
                { id: "ep16-vid", title: "Épisode principal N°16 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep16-mem", title: "Mots de Pouvoir N°16", type: "memorization", data: "ep16-data" },
                { id: "ep16-quiz", title: "Quiz N°16", type: "quiz", data: {} },
                { id: "ep16-dialogue", title: "Dialogue : Négocier la clé", type: "dialogue", scenarioId: "scen-ep16" }
            ]
        },
        {
            id: "ep17",
            title: "Épisode 17 : Le Désert des Émotions",
            narratorIntro: "Le monde est vide... Al-Nissyan se nourrit de notre désespoir. Pour le vaincre, nous devons lui montrer nos émotions. Dis-moi ce que tu ressens.",
            activities: [
                { id: "ep17-vid", title: "Épisode principal N°17 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep17-mem", title: "Mots de Pouvoir N°17", type: "memorization", data: "ep17-data" },
                { id: "ep17-quiz", title: "Quiz N°17", type: "quiz", data: {} },
                { id: "ep17-dialogue", title: "Dialogue : Je ressens...", type: "dialogue", scenarioId: "scen-ep17" }
            ]
        },
        {
            id: "ep18",
            title: "Épisode 18 : Le Pardon d'Al-Nissyan",
            narratorIntro: "Al-Nissyan est faible. Il n'est pas méchant, il a juste été... oublié. Il a besoin de mots gentils, pas de combat. C'est la seule façon.",
            activities: [
                { id: "ep18-vid", title: "Épisode principal N°18 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep18-mem", title: "Mots de Pouvoir N°18", type: "memorization", data: "ep18-data" },
                { id: "ep18-quiz", title: "Quiz N°18", type: "quiz", data: {} },
                { id: "ep18-dialogue", title: "Dialogue : Parler à Al-Nissyan", type: "dialogue", scenarioId: "scen-ep18" }
            ]
        },
        {
            id: "ep19",
            title: "Épisode 19 : Le 100ème Mot",
            narratorIntro: "L'Astrolabe est à 99% ! Il manque un seul Mot de Pouvoir... mais lequel ? L'Astrolabe lui-même te pose la question !",
            activities: [
                { id: "ep19-vid", title: "Épisode principal N°19 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep19-mem", title: "Mots de Pouvoir N°19", type: "memorization", data: "ep19-data" },
                { id: "ep19-quiz", title: "Quiz N°19", type: "quiz", data: {} },
                { id: "ep19-dialogue", title: "Dialogue : L'énigme finale", type: "dialogue", scenarioId: "scen-ep19" }
            ]
        },
        {
            id: "ep20",
            title: "Épisode 20 : Les Nouveaux Gardiens",
            narratorIntro: "Ça y est ! L'Astrolabe est chargé ! Fahim est libre, et vous êtes les nouveaux Gardiens. Al-Nissyan est guéri. Mission accomplie... pour l'instant.",
            activities: [
                { id: "ep20-vid", title: "Épisode principal N°20 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/YOUR_ID_HERE" },
                { id: "ep20-mem", title: "Mots de Pouvoir N°20 (Adieux)", type: "memorization", data: "ep20-data" },
                { id: "ep20-quiz", title: "Quiz Final", type: "quiz", data: {} },
                { id: "ep20-dialogue", title: "Dialogue : Au revoir, Fahim !", type: "dialogue", scenarioId: "scen-ep20" }
            ]
        }
    ]
};


//======================================================================
// 2. DONNÉES DE MÉMORISATION (POUR CHAQUE ÉPISODE)
//======================================================================
const memorizationData = {
    // Épisode 1: Identité (Basé sur Fichervision1.pdf)
    "ep1-data": {
        phrases: [
            { arabe: "ما اسْمُك؟", phonetique: "MASMOUKA?", francais: "QUEL EST ΤΟΝ ΝΟΜ ?" },
            { arabe: "أَنَا اسْمِي...", phonetique: "ANA ISMI...", francais: "ΜΟΙ ΜΟΝ NOM EST..." },
            { arabe: "مِنْ أَيْنَ أَنْتَ؟", phonetique: "ΜΙΝ ΑΥΝΑ ΑΝΤΑ?", francais: "D'OÙ VIENS-TU ?" },
            { arabe: "أَنَا مِنْ فَرَنْسَا", phonetique: "ANA MIN FARANÇA", francais: "MOI JE SUIS DE FRANCE" },
            { arabe: "لَا أَفَهَمْ", phonetique: "LAA AFHAM", francais: "JE NE COMPRENDS PAS" },
            { arabe: "السَّلَامُ عَلَيْكُمْ", phonetique: "SALAMOU 3ALAYKOUM", francais: "QUE LA PAIX SOIT SUR VOUS" }
        ],
        mots: [
            { arabe: "اسم", phonetique: "ISM", francais: "NOM" },
            { arabe: "أنا", phonetique: "ANA", francais: "ΜΟΙ" },
            { arabe: "انت", phonetique: "ANTA", francais: "ΤΟΙ (M)" },
            { arabe: "من", phonetique: "MIN", francais: "DE (PROVENANCE)" },
            { arabe: "لا", phonetique: "LAA", francais: "NON" },
            { arabe: "أَيْنَ", phonetique: "AYNA", francais: "OÙ" },
            { arabe: "نعَمْ", phonetique: "NA3AM", francais: "OUI" }
        ]
    },
    // Épisode 2: Politesse
    "ep2-data": {
        phrases: [
            { arabe: "شُكْراً جَزِيلاً", phonetique: "CHOUKRAN JAZILAN", francais: "MERCI BEAUCOUP" },
            { arabe: "مِنْ فَضْلِكَ", phonetique: "MIN FADLIKA", francais: "S'IL TE PLAÎT (M)" },
            { arabe: "مَاذَا تُرِيدُ؟", phonetique: "MAZA TOURIDOU?", francais: "QUE VEUX-TU ?" },
            { arabe: "أُرِيدُ هَذَا", phonetique: "URIDU HADHA", francais: "JE VEUX CECI" }
        ],
        mots: [
            { arabe: "شُكْراً", phonetique: "CHOUKRAN", francais: "MERCI" },
            { arabe: "مِنْ فَضْلِك", phonetique: "MIN FADLIK", francais: "S'IL VOUS PLAÎT" },
            { arabe: "مَاذَا", phonetique: "MAZA", francais: "QUOI / QUE" },
            { arabe: "سُوق", phonetique: "SOUK", francais: "MARCHÉ" },
            { arabe: "تَفَضَّلْ", phonetique: "TAFADDAL", francais: "TIENS / JE T'EN PRIE" }
        ]
    },
    // Épisode 3: Couleurs & Chiffres 1-5
    "ep3-data": {
        phrases: [
            { arabe: "أُرِيدُ تُفَّاحَة حَمْرَاء", phonetique: "URIDU TUFFAHA HAMRA", francais: "JE VEUX UNE POMME ROUGE" },
            { arabe: "بِكَمْ هَذَا؟", phonetique: "BIKAM HADHA?", francais: "COMBIEN COÛTE CECI ?" },
            { arabe: "وَاحِد, اِثْنَان, ثَلَاثَة", phonetique: "WAHID, ITHNAN, THALATHA", francais: "UN, DEUX, TROIS" }
        ],
        mots: [
            { arabe: "أَحْمَر", phonetique: "AHMAR", francais: "ROUGE" },
            { arabe: "أَخْضَر", phonetique: "AKHDAR", francais: "VERT" },
            { arabe: "أَزْرَق", phonetique: "AZRAQ", francais: "BLEU" },
            { arabe: "وَاحِد", phonetique: "WAHID", francais: "UN (1)" },
            { arabe: "اِثْنَان", phonetique: "ITHNAN", francais: "DEUX (2)" },
            { arabe: "ثَلَاثَة", phonetique: "THALATHA", francais: "TROIS (3)" },
            { arabe: "أَرْبَعَة", phonetique: "ARBA'A", francais: "QUATRE (4)" },
            { arabe: "خَمْسَة", phonetique: "KHAMSA", francais: "CINQ (5)" }
        ]
    },
    // Épisode 4: Famille
    "ep4-data": {
        phrases: [
            { arabe: "هَذَا أَبِي", phonetique: "HADHA ABI", francais: "VOICI MON PÈRE" },
            { arabe: "هَذِهِ أُمِّي", phonetique: "HADHIHI UMMI", francais: "VOICI MA MÈRE" },
            { arabe: "أَنَا أُحِبُّ عَائِلَتِي", phonetique: "ANA UHIBBU A'ILATI", francais: "J'AIME MA FAMILLE" }
        ],
        mots: [
            { arabe: "أَب", phonetique: "AB", francais: "PÈRE" },
            { arabe: "أُم", phonetique: "UMM", francais: "MÈRE" },
            { arabe: "أَخ", phonetique: "AKH", francais: "FRÈRE" },
            { arabe: "أُخْت", phonetique: "UKHT", francais: "SŒUR" },
            { arabe: "عَائِلَة", phonetique: "A'ILA", francais: "FAMILLE" },
            { arabe: "هَذَا", phonetique: "HADHA", francais: "CECI (M)" },
            { arabe: "هَذِهِ", phonetique: "HADHIHI", francais: "CECI (F)" }
        ]
    },
    // Épisode 5: Nourriture
    "ep5-data": {
        phrases: [
            { arabe: "أَنَا آكُلُ خُبْز", phonetique: "ANA AKULU KHOBZ", francais: "JE MANGE DU PAIN" },
            { arabe: "أَنَا أَشْرَبُ مَاء", phonetique: "ANA ACHRABU MA'A", francais: "JE BOIS DE L'EAU" },
            { arabe: "أَنَا جَائِع", phonetique: "ANA JA'I", francais: "J'AI FAIM" }
        ],
        mots: [
            { arabe: "خُبْز", phonetique: "KHOBZ", francais: "PAIN" },
            { arabe: "مَاء", phonetique: "MA'A", francais: "EAU" },
            { arabe: "تَمْر", phonetique: "TAMR", francais: "DATTES" },
            { arabe: "بُرْتُقَال", phonetique: "BOURTOUQAL", francais: "ORANGE" },
            { arabe: "تُفَّاح", phonetique: "TUFFAH", francais: "POMME" }
        ]
    },
    // Épisode 6: Maison & Prépositions
    "ep6-data": {
        phrases: [
            { arabe: "القَلَمُ عَلَى المَكْتَب", phonetique: "AL-QALAMU 'ALA AL-MAKTAB", francais: "LE STYLO EST SUR LE BUREAU" },
            { arabe: "أَنَا فِي البَيْت", phonetique: "ANA FI AL-BAYT", francais: "JE SUIS DANS LA MAISON" },
            { arabe: "الكِتَابُ تَحْتَ الكُرْسِي", phonetique: "AL-KITABU TAHTA AL-KURSI", francais: "LE LIVRE EST SOUS LA CHAISE" }
        ],
        mots: [
            { arabe: "بَيْت", phonetique: "BAYT", francais: "MAISON" },
            { arabe: "غُرْفَة", phonetique: "GHURFA", francais: "CHAMBRE" },
            { arabe: "فِي", phonetique: "FI", francais: "DANS" },
            { arabe: "عَلَى", phonetique: "ALA", francais: "SUR" },
            { arabe: "تَحْت", phonetique: "TAHT", francais: "SOUS" },
            { arabe: "كُرْسِي", phonetique: "KURSI", francais: "CHAISE" },
            { arabe: "مَكْتَب", phonetique: "MAKTAB", francais: "BUREAU" }
        ]
    },
    // Épisode 7: École
    "ep7-data": {
        phrases: [
            { arabe: "أَفْتَحُ الكِتَاب", phonetique: "AFTAHU AL-KITAB", francais: "J'OUVRE LE LIVRE" },
            { arabe: "أُرِيدُ قَلَم", phonetique: "URIDU QALAM", francais: "JE VEUX UN STYLO" },
            { arabe: "أَنَا فِي المَدْرَسَة", phonetique: "ANA FI AL-MADRASA", francais: "JE SUIS À L'ÉCOLE" }
        ],
        mots: [
            { arabe: "كِتَاب", phonetique: "KITAB", francais: "LIVRE" },
            { arabe: "قَلَم", phonetique: "QALAM", francais: "STYLO" },
            { arabe: "دَفْتَر", phonetique: "DAFTAR", francais: "CAHIER" },
            { arabe: "مَدْرَسَة", phonetique: "MADRASA", francais: "ÉCOLE" },
            { arabe: "مُدَرِّس", phonetique: "MUDARRIS", francais: "PROFESSEUR" }
        ]
    },
    // Épisode 8: Temps
    "ep8-data": {
        phrases: [
            { arabe: "كَمْ السَّاعَة؟", phonetique: "KAM AL-SA'A?", francais: "QUELLE HEURE EST-IL ?" },
            { arabe: "اليَوْم يَوْمُ الاِثْنَيْن", phonetique: "AL-YAWM YAWM AL-ITHNAYN", francais: "AUJOURD'HUI C'EST LUNDI" },
            { arabe: "مَعَ السَّلَامَة, إِلَى الغَد!", phonetique: "MA'A SALAMA, ILA AL-GHAD!", francais: "AU REVOIR, À DEMAIN !" }
        ],
        mots: [
            { arabe: "سَاعَة", phonetique: "SA'A", francais: "HEURE / MONTRE" },
            { arabe: "اليَوْم", phonetique: "AL-YAWM", francais: "AUJOURD'HUI" },
            { arabe: "غَداً", phonetique: "GHADAN", francais: "DEMAIN" },
            { arabe: "أَمْس", phonetique: "AMS", francais: "HIER" },
            { arabe: "يَوْم", phonetique: "YAWM", francais: "JOUR" },
            { arabe: "أُسْبُوع", phonetique: "USBU'", francais: "SEMAINE" }
        ]
    },
    // Épisode 9: Vêtements & Météo
    "ep9-data": {
        phrases: [
            { arabe: "الجَوُّ بَارِد", phonetique: "AL-JAWW BARID", francais: "IL FAIT FROID" },
            { arabe: "الجَوُّ حَارّ", phonetique: "AL-JAWW HARR", francais: "IL FAIT CHAUD" },
            { arabe: "أَيْنَ مِعْطَفِي؟", phonetique: "AYNA MI'TAFI?", francais: "OÙ EST MON MANTEAU ?" },
            { arabe: "أَلْبَسُ الحِذَاء", phonetique: "ALBASU AL-HIZA'", francais: "JE PORTE LES CHAUSSURES" }
        ],
        mots: [
            { arabe: "بَارِد", phonetique: "BARID", francais: "FROID" },
            { arabe: "حَارّ", phonetique: "HARR", francais: "CHAUD" },
            { arabe: "مِعْطَف", phonetique: "MI'TAF", francais: "MANTEAU" },
            { arabe: "قَمِيص", phonetique: "QAMIS", francais: "CHEMISE" },
            { arabe: "حِذَاء", phonetique: "HIZA'", francais: "CHAUSSURES" }
        ]
    },
    // Épisode 10: Verbes d'action (Présent)
    "ep10-data": {
        phrases: [
            { arabe: "أَنَا أَكْتُبُ رِسَالَة", phonetique: "ANA AKTUBU RISALA", francais: "J'ÉCRIS UNE LETTRE" },
            { arabe: "أَنَا أَقْرَأُ كِتَاب", phonetique: "ANA AQRA'U KITAB", francais: "JE LIS UN LIVRE" },
            { arabe: "أَذْهَبُ إِلَى المَدْرَسَة", phonetique: "ADH-HABU ILA AL-MADRASA", francais: "JE VAIS À L'ÉCOLE" }
        ],
        mots: [
            { arabe: "أَكْتُبُ", phonetique: "AKTUBU", francais: "J'ÉCRIS" },
            { arabe: "أَقْرَأُ", phonetique: "AQRA'U", francais: "JE LIS" },
            { arabe: "آكُلُ", phonetique: "AKULU", francais: "JE MANGE" },
            { arabe: "أَشْرَبُ", phonetique: "ACHRABU", francais: "JE BOIS" },
            { arabe: "أَذْهَبُ", phonetique: "ADH-HABU", francais: "JE VAIS" }
        ]
    },
    // Épisode 11: Verbes (Passé)
    "ep11-data": {
        phrases: [
            { arabe: "أَكَلْتُ الخُبْز", phonetique: "AKALTU AL-KHOBZ", francais: "J'AI MANGÉ LE PAIN" },
            { arabe: "ذَهَبْتُ إِلَى السُّوق", phonetique: "DHAHABTU ILA AL-SOUK", francais: "JE SUIS ALLÉ AU MARCHÉ" },
            { arabe: "هَلْ قَرَأْتَ الكِتَاب؟", phonetique: "HAL QARA'TA AL-KITAB?", francais: "AS-TU LU LE LIVRE ?" }
        ],
        mots: [
            { arabe: "أَكَلْتُ", phonetique: "AKALTU", francais: "J'AI MANGÉ" },
            { arabe: "شَرِبْتُ", phonetique: "CHARIBTU", francais: "J'AI BU" },
            { arabe: "ذَهَبْتُ", phonetique: "DHAHABTU", francais: "JE SUIS ALLÉ(E)" },
            { arabe: "كَتَبْتُ", phonetique: "KATABTU", francais: "J'AI ÉCRIT" },
            { arabe: "قَرَأْتُ", phonetique: "QARA'TU", francais: "J'AI LU" }
        ]
    },
    // Épisode 12: Verbes (Futur)
    "ep12-data": {
        phrases: [
            { arabe: "غَداً سَأَذْهَبُ إِلَى البَيْت", phonetique: "GHADAN SA-ADH-HABU ILA AL-BAYT", francais: "DEMAIN J'IRAI À LA MAISON" },
            { arabe: "مَاذَا سَتَفْعَلُ؟", phonetique: "MAZA SA-TAF'ALU?", francais: "QUE VAS-TU FAIRE ?" },
            { arabe: "سَأَقْرَأُ الكِتَاب", phonetique: "SA-AQRA'U AL-KITAB", francais: "JE LIRAI LE LIVRE" }
        ],
        mots: [
            { arabe: "سَآكُلُ", phonetique: "SA-AKULU", francais: "JE MANGERAI" },
            { arabe: "سَأَشْرَبُ", phonetique: "SA-ACHRABU", francais: "JE BOIRAI" },
            { arabe: "سَأَذْهَبُ", phonetique: "SA-ADH-HABU", francais: "J'IRAI" },
            { arabe: "سَأَقْرَأُ", phonetique: "SA-AQRA'U", francais: "JE LIRAI" },
            { arabe: "سَأَكْتُبُ", phonetique: "SA-AKTUBU", francais: "J'ÉCRIRAI" }
        ]
    },
    // Épisode 13: Possessifs
    "ep13-data": {
        phrases: [
            { arabe: "هَذَا قَلَمِي", phonetique: "HADHA QALAMI", francais: "C'EST MON STYLO" },
            { arabe: "مَا اسْمُهَا؟", phonetique: "MA-SMUHA?", francais: "QUEL EST SON NOM (ELLE) ?" },
            { arabe: "بَيْتُهُ كَبِير", phonetique: "BAYTUHU KABIR", francais: "SA MAISON (À LUI) EST GRANDE" }
        ],
        mots: [
            { arabe: "كِتَابِي", phonetique: "KITABI", francais: "MON LIVRE" },
            { arabe: "كِتَابُكَ", phonetique: "KITABUKA", francais: "TON LIVRE (M)" },
            { arabe: "كِتَابُكِ", phonetique: "KITABUKI", francais: "TON LIVRE (F)" },
            { arabe: "اِسْمُهُ", phonetique: "ISMUHU", francais: "SON NOM (À LUI)" },
            { arabe: "اِسْمُهَا", phonetique: "ISMUHA", francais: "SON NOM (À ELLE)" }
        ]
    },
    // Épisode 14: Adjectifs
    "ep14-data": {
        phrases: [
            { arabe: "البَيْتُ كَبِير", phonetique: "AL-BAYTU KABIR", francais: "LA MAISON EST GRANDE" },
            { arabe: "الوَلَدُ سَرِيع", phonetique: "AL-WALADU SARI'", francais: "LE GARÇON EST RAPIDE" },
            { arabe: "الزَّهْرَةُ جَمِيلَة", phonetique: "AL-ZAHRATU JAMILA", francais: "LA FLEUR EST BELLE" }
        ],
        mots: [
            { arabe: "كَبِير", phonetique: "KABIR", francais: "GRAND" },
            { arabe: "صَغِير", phonetique: "SAGHIR", francais: "PETIT" },
            { arabe: "جَمِيل", phonetique: "JAMIL", francais: "BEAU" },
            { arabe: "قَبِيح", phonetique: "QABIH", francais: "LAID" },
            { arabe: "سَرِيع", phonetique: "SARI'", francais: "RAPIDE" },
            { arabe: "بَطِيء", phonetique: "BATI'", francais: "LENT" }
        ]
    },
    // Épisode 15: Révision 1 (Verbes)
    "ep15-data": {
        phrases: [
            { arabe: "أَمْس ذَهَبْتُ, اليَوْم أَذْهَبُ, غَداً سَأَذْهَبُ", phonetique: "AMS DHAHABTU, AL-YAWM ADH-HABU, GHADAN SA-ADH-HABU", francais: "HIER JE SUIS ALLÉ, AUJOURD'HUI JE VAIS, DEMAIN J'IRAI" },
            { arabe: "أَنَا أَكَلْتُ تُفَّاحَة", phonetique: "ANA AKALTU TUFFAHA", francais: "J'AI MANGÉ UNE POMME" }
        ],
        mots: [
            { arabe: "فَعَلَ", phonetique: "FA'ALA", francais: "FAIRE (IL A FAIT)" },
            { arabe: "يَفْعَلُ", phonetique: "YAF'ALU", francais: "IL FAIT" },
            { arabe: "سَيَفْعَلُ", phonetique: "SA-YAF'ALU", francais: "IL FERA" },
            { arabe: "كَتَبَ", phonetique: "KATABA", francais: "IL A ÉCRIT" },
            { arabe: "يَكْتُبُ", phonetique: "YAKTUBU", francais: "IL ÉCRIT" }
        ]
    },
    // Épisode 16: Négociation
    "ep16-data": {
        phrases: [
            { arabe: "بِكَمْ هَذَا؟", phonetique: "BIKAM HADHA?", francais: "C'EST COMBIEN ?" },
            { arabe: "هَذَا غَالِي جِدّاً!", phonetique: "HADHA GHALI JIDDAN!", francais: "C'EST TRÈS CHER !" },
            { arabe: "أُرِيدُ هَذَا, مِنْ فَضْلِكَ", phonetique: "URIDU HADHA, MIN FADLIKA", francais: "JE VEUX CECI, S'IL VOUS PLAÎT" }
        ],
        mots: [
            { arabe: "بِكَمْ", phonetique: "BIKAM", francais: "COMBIEN (PRIX)" },
            { arabe: "غَالِي", phonetique: "GHALI", francais: "CHER" },
            { arabe: "رَخِيص", phonetique: "RAKHIS", francais: "BON MARCHÉ" },
            { arabe: "دِينَار", phonetique: "DINAR", francais: "DINAR (MONNAIE)" },
            { arabe: "أُرِيدُ", phonetique: "URIDU", francais: "JE VEUX" }
        ]
    },
    // Épisode 17: Émotions
    "ep17-data": {
        phrases: [
            { arabe: "أَنَا سَعِيدٌ اليَوْم", phonetique: "ANA SA'IDUN AL-YAWM", francais: "JE SUIS HEUREUX AUJOURD'HUI" },
            { arabe: "لِمَاذَا أَنْتَ حَزِين؟", phonetique: "LIMAZA ANTA HAZIN?", francais: "POURQUOI ES-TU TRISTE ?" },
            { arabe: "أَنَا لَسْتُ خَائِف", phonetique: "ANA LASTU KHA'IF", francais: "JE N'AI PAS PEUR" }
        ],
        mots: [
            { arabe: "سَعِيد", phonetique: "SA'ID", francais: "HEUREUX" },
            { arabe: "حَزِين", phonetique: "HAZIN", francais: "TRISTE" },
            { arabe: "غَضْبَان", phonetique: "GHADBAN", francais: "EN COLÈRE" },
            { arabe: "خَائِف", phonetique: "KHA'IF", francais: "EFFRAYÉ" },
            { arabe: "لِمَاذَا", phonetique: "LIMAZA", francais: "POURQUOI" }
        ]
    },
    // Épisode 18: Concepts Abstraits
    "ep18-data": {
        phrases: [
            { arabe: "أُرِيدُ السَّلَام", phonetique: "URIDU AL-SALAM", francais: "JE VEUX LA PAIX" },
            { arabe: "عَفْواً", phonetique: "AFWAN", francais: "PARDON / DE RIEN" },
            { arabe: "أَنْتَ صَدِيقِي", phonetique: "ANTA SADIQI", francais: "TU ES MON AMI" }
        ],
        mots: [
            { arabe: "حُبّ", phonetique: "HOBB", francais: "AMOUR" },
            { arabe: "سَلَام", phonetique: "SALAM", francais: "PAIX" },
            { arabe: "عَفْواً", phonetique: "AFWAN", francais: "PARDON / DE RIEN" },
            { arabe: "صَدَاقَة", phonetique: "SADAQA", francais: "AMITIÉ" },
            { arabe: "صَدِيق", phonetique: "SADIQ", francais: "AMI" }
        ]
    },
    // Épisode 19: Langue
    "ep19-data": {
        phrases: [
            { arabe: "أَنَا أَتَكَلَّمُ العَرَبِيَّة", phonetique: "ANA ATAKALLAMU AL-'ARABIYA", francais: "JE PARLE ARABE" },
            { arabe: "هَلْ تَتَكَلَّمُ الفَرَنْسِيَّة؟", phonetique: "HAL TATAKALLAMU AL-FARANSIYA?", francais: "PARLES-TU FRANÇAIS ?" },
            { arabe: "مَا هِيَ لُغَتُكَ؟", phonetique: "MA HIYA LUGHATUK?", francais: "QUELLE EST TA LANGUE ?" }
        ],
        mots: [
            { arabe: "لُغَة", phonetique: "LUGHA", francais: "LANGUE" },
            { arabe: "أَتَكَلَّمُ", phonetique: "ATAKALLAMU", francais: "JE PARLE" },
            { arabe: "العَرَبِيَّة", phonetique: "AL-'ARABIYA", francais: "L'ARABE" },
            { arabe: "فَرَنْسِيَّة", phonetique: "FARANSIYA", francais: "FRANÇAIS" },
            { arabe: "هَلْ", phonetique: "HAL...?", francais: "EST-CE QUE... ?" }
        ]
    },
    // Épisode 20: Conclusion
    "ep20-data": {
        phrases: [
            { arabe: "مَعَ السَّلَامَة, يَا فَهِيم!", phonetique: "MA'A SALAMA, YA FAHIM!", francais: "AU REVOIR, FAHIM !" },
            { arabe: "إِلَى اللِّقَاء فِي المَدْرَسَة", phonetique: "ILA LIQA' FI AL-MADRASA", francais: "À BIENTÔT À L'ÉCOLE" },
            { arabe: "شُكْراً جَزِيلاً عَلَى المُسَاعَدَة", phonetique: "CHOUKRAN JAZILAN 'ALA AL-MUSA'ADA", francais: "MERCI BEAUCOUP POUR L'AIDE" }
        ],
        mots: [
            { arabe: "مَعَ السَّلَامَة", phonetique: "MA'A SALAMA", francais: "AU REVOIR (AVEC LA PAIX)" },
            { arabe: "إِلَى اللِّقَاء", phonetique: "ILA LIQA'", francais: "À BIENTÔT" },
            { arabe: "يَوْم سَعِيد", phonetique: "YAWM SA'ID", francais: "BONNE JOURNÉE" },
            { arabe: "مُسَاعَدَة", phonetique: "MUSA'ADA", francais: "AIDE" },
            { arabe: "مُغَامَرَة", phonetique: "MUGHAMARA", francais: "AVENTURE" }
        ]
    }
};


// --- Fonctions de Configuration et d'Aide (Inchangées) ---
function getAcademySystemPrompt(scenario) {
    // ... (votre fonction existante est inchangée) ...
}

// --- 2. Fonctions Vocales (Push-to-Talk et TTS) ---

// NOUVEAU : Fonction TTS dédiée au Narrateur (voix française)
async function playNarratorAudio(text, buttonEl) {
    if (narratorAudio && !narratorAudio.paused) {
        narratorAudio.pause();
        narratorAudio = null;
        buttonEl.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        return;
    }

    buttonEl.innerHTML = `<div class="spinner-dots" style="transform: scale(0.6);"><span></span><span></span><span></span></div>`;
    
    try {
        // Utilise une voix française pour le narrateur "Fahim"
        const response = await apiRequest('/api/ai/synthesize-speech', 'POST', { 
            text: text, 
            voice: 'fr-FR-Wavenet-E', // Voix de Conteur (Homme)
            rate: 0.95, // Légèrement plus lent pour un style conteur
            pitch: -2.0 // Voix légèrement plus grave
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
    // ... (votre fonction existante est inchangée) ...
}
function startListening() { /* ... */ }
function stopListening() { /* ... */ }
async function togglePlayback(text, buttonEl) {
    // ... (votre fonction existante est inchangée) ...
}

// --- 3. Logique de Bilan et de Sauvegarde (Inchangée) ---
async function endScenarioSession(scenario, history) {
    // ... (votre fonction existante est inchangée) ...
}
function showSessionReportModal(report) {
    // ... (votre fonction existante est inchangée) ...
}

// --- 4. Outil de Création de Scénarios (Inchangé) ---
function getScenarioCreatorTemplate() {
    // ... (votre fonction existante est inchangée) ...
}
function renderScenarioCreatorModal() {
    // ... (votre fonction existante est inchangée) ...
}
async function renderTeacherScenarioManagement(page) {
    // ... (votre fonction existante est inchangée) ...
}


// --- 5. NOUVELLES Fonctions de Rendu du Dashboard (Élève et Enseignant) ---

// MODIFIÉ : Affiche la "Série" au lieu des scénarios
export async function renderAcademyStudentDashboard() {
    const page = document.getElementById('student-dashboard-page');
    changePage('student-dashboard-page'); 

    let html = `
        <h2>Bienvenue ${window.currentUser.firstName} sur l'Académie ! 📚</h2>
        <p class="subtitle">Prêt à commencer ton aventure ?</p>

        <div class="dashboard-grid" style="grid-template-columns: 1fr;">
            <div class="dashboard-card primary-card" id="start-series-btn" style="cursor: pointer; background: linear-gradient(45deg, var(--primary-color), var(--secondary-color)); color: white; padding: 0;">
                
                <img src="https://i.imgur.com/g0Q8eJg.png" alt="Zayd et Yasmina" class="scenario-card-image" style="height: 250px; margin-bottom: 0;">
                
                <div class="scenario-card-content">
                    <h3 style="color: white;">${courseData.title}</h3>
                    <p>${courseData.description}</p>
                    <div style="text-align: right; margin-top: 1rem;">
                        <button class="btn btn-main" style="background-color: white; color: var(--primary-color);"><i class="fa-solid fa-play"></i> Commencer la Série</button>
                    </div>
                </div>
            </div>
        </div>
        
        `;
    
    // Ajout de l'historique des sessions (logique existante)
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

    // NOUVEAU : Listener pour démarrer le lecteur de cours
    page.querySelector('#start-series-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        renderAcademyCoursePlayer(); // Lance la nouvelle page de cours
    });

    // Listeners de l'historique des sessions (inchangés)
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

// MODIFIÉ : Affiche la page de cours AVEC LE NARRATEUR
function renderAcademyCoursePlayer(selectedActivityId = null) {
    const page = document.getElementById('content-viewer-page'); // Réutilise la page viewer
    changePage('content-viewer-page');
    
    // Si aucune activité n'est sélectionnée, prend la première de la série
    if (!selectedActivityId) {
        selectedActivityId = courseData.episodes[0].activities[0].id;
    }

    // --- Construction de la barre de navigation de gauche ---
    let navHtml = '';
    courseData.episodes.forEach(episode => {
        navHtml += `<div class="episode-group">
                        <h4 class="episode-title">${episode.title}</h4>
                        <ul class="activity-list">`;
        
        episode.activities.forEach(activity => {
            const isActive = activity.id === selectedActivityId;
            let icon = 'fa-solid fa-circle-notch'; // Icône par défaut
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

    // --- Structure de la page ---
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
    
    // --- Ajout des Listeners ---
    page.querySelector('#back-to-academy-dash').addEventListener('click', renderAcademyStudentDashboard);
    
    page.querySelectorAll('.activity-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const activityId = e.currentTarget.dataset.activityId;
            // Arrêter l'audio du narrateur s'il joue
            if (narratorAudio) narratorAudio.pause();
            renderAcademyCoursePlayer(activityId); // Recharge la page avec la nouvelle activité
        });
    });
    
    // --- Chargement du contenu de l'activité ---
    loadActivityContent(activityId);
}

// MODIFIÉ : Charge le contenu ET le narrateur
async function loadActivityContent(activityId) {
    const contentArea = document.getElementById('activity-content-area');
    const narratorBox = document.getElementById('narrator-box');
    const narratorText = document.getElementById('narrator-text');
    const narratorBtn = document.getElementById('narrator-speak-btn');

    let activity = null;
    let episode = null;
    
    // Trouver l'activité ET l'épisode parent
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
    
    // --- 1. Chargement du Narrateur ---
    const narratorPrompt = episode.narratorIntro; // Récupère le texte de l'épisode
    narratorText.textContent = narratorPrompt;
    narratorBtn.onclick = () => playNarratorAudio(narratorPrompt, narratorBtn);


    // --- 2. Chargement du contenu de l'activité ---
    switch (activity.type) {
        case 'video':
            renderVideoPage(contentArea, activity);
            break;
        case 'memorization':
            renderMemorizationPage(contentArea, activity);
            break;
        case 'dialogue':
            // Récupère les scénarios IA (on suppose qu'ils existent)
            try {
                const scenarios = await apiRequest('/api/academy/scenarios', 'GET');
                const scenario = scenarios.find(s => s.id === activity.scenarioId);
                if (scenario) {
                    renderScenarioViewer(contentArea, scenario); // Affiche le chat IA
                } else {
                    contentArea.innerHTML = `<p class="error-message">Erreur : Scénario de dialogue (ID: ${activity.scenarioId}) non trouvé.</p>`;
                }
            } catch (err) {
                contentArea.innerHTML = `<p class="error-message">Erreur de chargement du dialogue : ${err.message}</p>`;
            }
            break;
        case 'quiz':
            contentArea.innerHTML = `<h3>${activity.title}</h3><p>Le module Quiz n'est pas encore implémenté.</p>`;
            break;
        default:
            contentArea.innerHTML = `<p class="error-message">Type d'activité non reconnu.</p>`;
    }
}

// NOUVEAU : Affiche une vidéo (style image_46eeed.jpg)
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

// NOUVEAU : Affiche la fiche de mémorisation (style Fichervision1.pdf)
function renderMemorizationPage(container, activity) {
    const data = memorizationData[activity.data]; // Récupère les données du PDF
    if (!data) {
        container.innerHTML = `<p class="error-message">Données de mémorisation non trouvées.</p>`;
        return;
    }
    
    // Génère les tableaux HTML
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


// MODIFIÉ : Le dashboard enseignant est inchangé pour l'instant
export async function renderAcademyTeacherDashboard() {
    const page = document.getElementById('teacher-dashboard-page');
    changePage('teacher-dashboard-page'); 

    // Affiche le HTML de base (structure + spinner)
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
    
    // Listener pour le bouton de création de scénario
    document.getElementById('create-scenario-btn').addEventListener('click', renderScenarioCreatorModal);
    
    // PLACEMENT CRITIQUE: Charger la section de gestion des scénarios (asynchrone)
    await renderTeacherScenarioManagement(page); 

    // --- Appel API pour les élèves ---
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

        // Listeners pour voir le détail de l'élève
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


// Fonction pour afficher le détail d'un élève (utilisée par le dashboard Enseignant)
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

    // Retour au dashboard Enseignant
    document.getElementById('back-to-teacher-dash').addEventListener('click', renderAcademyTeacherDashboard);

    // Gestion de l'affichage du rapport de session (Les sessions sont dans l'objet 'student' local)
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


// MODIFIÉ : La vue du chat IA est maintenant injectée dans une 'div'
function renderScenarioViewer(container, scenario) {
    // Au lieu de 'changePage', nous injectons dans le conteneur
    container.innerHTML = ''; // Vide la zone d'activité

    const history = [{ role: "system", content: getAcademySystemPrompt(scenario) }];
    
    // Crée la structure du chat
    const chatWrapper = document.createElement('div');
    chatWrapper.innerHTML = `
        <h3>${scenario.title}</h3>
        <p class="subtitle">${scenario.context}</p>
        <p style="font-size: 0.9em; color: var(--primary-color); margin-bottom: 1rem;">
            <i class="fa-solid fa-microphone-alt"></i> **Mode Vocal Activé.** Appuyez sur le micro pour enregistrer.
        </p>

        <div id="scenario-chat-window" style="height: 400px; overflow-y: auto; padding: 10px; border: 1px solid #ccc; border-radius: 8px; margin-top: 1.5rem; background-color: var(--aida-chat-bg);">
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
    
    // Initialisation du Push-to-Talk
    setupSpeechRecognition(micBtn, userInput, chatForm); 
    micBtn.addEventListener('mousedown', startListening);
    micBtn.addEventListener('mouseup', stopListening);
    micBtn.addEventListener('touchstart', startListening); 
    micBtn.addEventListener('touchend', stopListening);
    micBtn.addEventListener('click', (e) => e.preventDefault()); 

    endSessionBtn.addEventListener('click', () => endScenarioSession(scenario, history));

    // Gestion de l'envoi de message
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

    // Prompt Initial du Personnage IA
    appendMessage('aida', scenario.characterIntro, true); 
    history.push({ role: 'assistant', content: aidaResponse });
}


// MODIFIÉ : 'appendMessage' doit être conscient du conteneur
const appendMessage = (sender, text, canListen = false) => {
    // MODIFIÉ : Trouve le chat window dans la page active
    const chatWindow = document.getElementById('scenario-chat-window'); 
    if (!chatWindow) return; // Sécurité si le chat n'est pas affiché
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender === 'user' ? 'user' : 'aida'}`;
    
    const bubble = document.createElement('div');
    bubble.className = sender === 'user' ? 'user-message' : 'aida-message';
    
    
    let displayedText = text.replace(/\n/g, '<br>');
    let helpContent = ''; 
    let isAidaMessage = sender === 'aida' && (text.includes('<PHONETIQUE>') || text.includes('<TRADUCTION>'));


    // --- 1. Détection, Extraction et Remplissage du Contenu ---
    if (isAidaMessage) {
        
        // Trouver la partie Arabe pure (ce qui est avant la première balise)
        const firstTagIndex = Math.min(
            text.indexOf('<PHONETIQUE>') > -1 ? text.indexOf('<PHONETIQUE>') : Infinity,
            text.indexOf('<TRADUCTION>') > -1 ? text.indexOf('<TRADUCTION>') : Infinity
        );
        const arabicPart = text.substring(0, firstTagIndex).trim();

        // Extraction de l'aide
        const phoneticMatch = text.match(/<PHONETIQUE>(.*?)<\/PHONETIQUE>/);
        const traductionMatch = text.match(/<TRADUCTION>(.*?)<\/TRADUCTION>/);
        
        if (phoneticMatch) { helpContent += `<p class="help-phonetic">Phonétique: ${phoneticMatch[1].trim()}</p>`; }
        if (traductionMatch) { helpContent += `<p class="help-translation">Traduction: ${traductionMatch[1].trim()}</p>`; }

        // Correction de la régression de l'aide
        displayedText = `<p class="arabic-text-only">${arabicPart}</p>`;
    } else if (sender === 'user') {
        // Correction de la régression de la taille de police utilisateur
        displayedText = `<p>${text}</p>`;
    }
    
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
        listenBtn.onclick = () => togglePlayback(text, listenBtn);  
        bubble.appendChild(listenBtn);


        // 2c. BOUTON AIDE (Ampoule) et son Div Masqué
        if (helpContent) {
            const helpBtn = document.createElement('button');
            helpBtn.className = 'btn-icon toggle-help-btn';
            helpBtn.innerHTML = '<i class="fa-solid fa-lightbulb"></i>';
            helpBtn.title = 'Afficher l\'aide (Phonétique / Traduction)';
            
            helpBtn.onclick = () => {
                // MODIFIÉ : Cible le div d'aide relatif à ce message
                const helpDiv = msgDiv.querySelector('.aida-help-div');
                if (helpDiv) helpDiv.classList.toggle('hidden');
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


// --- 6. Dashboard Parent (Inchangé) ---
export async function renderAcademyParentDashboard() {
    await renderAcademyTeacherDashboard();
}
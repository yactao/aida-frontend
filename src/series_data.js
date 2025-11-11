// src/series_data.js
// Ce fichier contient la structure complète de la série "Zayd et Yasmina".

//======================================================================
// 1. STRUCTURE DE LA SÉRIE (LES 20 ÉPISODES)
//======================================================================
export const courseData = {
    title: "Zayd et Yasmina : Les Gardiens de l'Astrolabe",
    description: "Apprends les bases de l'arabe en suivant les aventures de Zayd et Yasmina pour retrouver les 100 Mots de Pouvoir.",
    episodes: [
        // --- ARC 1 : LA DÉCOUVERTE (1-4) ---
        {
            id: "ep1",
            title: "Épisode 1 : L'Astrolabe Perdu",
            narratorIntro: "Ah, jeune Gardien ! Bienvenue dans le premier souvenir. C'est ici que tout a commencé... Zayd et Yasmina ne savaient pas encore ce qu'ils allaient découvrir. Regarde bien la vidéo.",
            activities: [
                { id: "ep1-vid", title: "Épisode principal N°1 (Vidéo)", type: "video", url: "https://player.vimeo.com/video/1133827184" },
                { id: "ep1-mem", title: "Mots de Pouvoir N°1", type: "memorization", data: "ep1-data" },
                { id: 'ep1-quiz', title: 'Quiz N°1', type: 'quiz', description: "Testez vos connaissances sur le premier épisode.",
    // AJOUTEZ CE BLOC DE DONNÉES :
                data: {
                questions: [
            {
                question_text: "Que signifie 'مَرْحَبًا' (Marhaban) ?",
                options: ["Au revoir", "Bonjour", "Merci", "S'il te plaît"],
                correct_answer_index: 1 
            },
            {
                question_text: "Comment dit-on 'Je m'appelle...' en arabe ?",
                options: ["مَا اسْمُكَ؟ (Ma ismuka?)", "كَيْفَ حَالُكَ؟ (Kayfa haluka?)", "اِسْمِي... (Ismi...)", "مَعَ ٱلسَّلَامَةِ (Ma'a salama)"],
                correct_answer_index: 2
            },
            {
                question_text: "Qui est Fahim ?",
                options: ["Le narrateur", "Un marchand", "Un gardien", "Le père de Zayd"],
                correct_answer_index: 0
            }
        ]
    }
},
                { 
                    id: "ep1-dialogue", 
                    title: "Dialogue : Parler à Fahim", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Fahim, le Gardien-Djinn",
                        context: "Tu es Fahim. Tu viens d'être réveillé par l'élève. Tu es confus. Demande-lui qui il est et d'où il vient.",
                        characterIntro: "؟ أَيْنَ أَنَا؟ مَنْ أَنْتَ <PHONETIQUE>Ayna anta? Man anta?</PHONETIQUE> <TRADUCTION>Où suis-je ? Qui es-tu ?</TRADUCTION>",
                        objectives: ["Dire son nom", "Dire d'où il vient"]
                    }
                }
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
                { 
                    id: "ep2-dialogue", 
                    title: "Dialogue : Le Gardien du Souk", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Le Gardien du Souk",
                        context: "Tu es le Gardien du Souk. Tu bloques le passage. L'élève doit te dire 'Merci' (Choukran) pour passer.",
                        characterIntro: "Tu ne passeras pas sans le mot de passe ! <PHONETIQUE>Lan tamurr bidun kalimat al-sirr!</PHONETIQUE> <TRADUCTION>Tu ne passeras pas sans le mot de passe !</TRADUCTION>",
                        objectives: ["Dire 'Merci' (Choukran)"]
                    }
                }
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
                { 
                    id: "ep3-dialogue", 
                    title: "Dialogue : Le Marchand", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Le Marchand",
                        context: "Tu es un marchand. Tu as une pomme. L'élève doit te demander une 'pomme rouge'.",
                        characterIntro: "Bonjour ! Que veux-tu acheter ? <PHONETIQUE>Ahlan! Mādhā turīdu an tashtarī?</PHONETIQUE> <TRADUCTION>Bonjour ! Que veux-tu acheter ?</TRADUCTION>",
                        objectives: ["Demander une 'pomme rouge'", "Utiliser les chiffres (1-5)"]
                    }
                }
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
                { 
                    id: "ep4-dialogue", 
                    title: "Dialogue : Restaurer l'album", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Fahim",
                        context: "Tu es Fahim. Tu montres l'album photo vide. L'élève doit dire 'Voici mon père' (Hadha abi) et 'Voici ma mère' (Hadhihi ummi) pour restaurer les photos.",
                        characterIntro: "Oh non ! Les photos ont disparu ! Qui est-ce ? <PHONETIQUE>Oh non! Al-suwar ikhtafat! Man hadha?</PHONETIQUE> <TRADUCTION>Oh non ! Les photos ont disparu ! Qui est-ce ?</TRADUCTION>",
                        objectives: ["Dire 'Voici mon père'", "Dire 'Voici ma mère'"]
                    }
                }
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
                { 
                    id: "ep5-dialogue", 
                    title: "Dialogue : Le Festin de Fahim", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Fahim",
                        context: "Tu es Fahim et tu as faim. L'élève doit dire 'Je veux du pain' (Uridu khobz) et 'Je veux de l'eau' (Uridu ma'a) pour faire apparaître la nourriture.",
                        characterIntro: "J'ai si faim ! Que veux-tu manger ? <PHONETIQUE>Ana ja'i jiddan! Mādhā turīdu an ta'kul?</PHONETIQUE> <TRADUCTION>J'ai si faim ! Que veux-tu manger ?</TRADUCTION>",
                        objectives: ["Dire 'Je veux du pain'", "Dire 'Je veux de l'eau'"]
                    }
                }
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
                { 
                    id: "ep6-dialogue", 
                    title: "Dialogue : Où est le Mot ?", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Fahim",
                        context: "Tu es Fahim. Le Mot est un livre. L'élève doit te demander 'Où est le livre ?' (Ayna al-kitab?). Tu réponds qu'il est 'sur la table' ('ala al-maktab).",
                        characterIntro: "Je ne le trouve pas ! Le Mot est caché... <PHONETIQUE>La ajiduhu! Al-kalima makhfiya...</PHONETIQUE> <TRADUCTION>Je ne le trouve pas ! Le Mot est caché...</TRADUCTION>",
                        objectives: ["Utiliser 'Ayna?' (Où)", "Utiliser 'Fi' (Dans)", "Utiliser ''Ala' (Sur)"]
                    }
                }
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
                { 
                    id: "ep7-dialogue", 
                    title: "Dialogue : Le Professeur Silencieux", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Le Professeur Silencieux",
                        context: "Tu es un professeur qui ne peut pas parler. Tu montres des objets. L'élève doit dire 'C'est un livre' (Hadha kitab) et 'C'est un stylo' (Hadha qalam).",
                        characterIntro: "(Le professeur te regarde et te montre un objet sur son bureau...) <PHONETIQUE>(...)</PHONETIQUE> <TRADUCTION>(Le professeur te regarde et te montre un objet sur son bureau...)</TRADUCTION>",
                        objectives: ["Identifier 'Kitab' (Livre)", "Identifier 'Qalam' (Stylo)", "Identifier 'Daftar' (Cahier)"]
                    }
                }
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
                { 
                    id: "ep8-dialogue", 
                    title: "Dialogue : Le Gardien du Temps", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Le Gardien du Temps",
                        context: "Tu es le Gardien du Temps. Tu es endormi. L'élève doit te réveiller et te demander l'heure ('Kam al-sa'a?') et le jour ('Ma huwa al-yawm?').",
                        characterIntro: "ZzzZzz... Le temps n'a plus d'importance... Zzz... <PHONETIQUE>ZzzZzz... Al-waqt laysa muhimman...</PHONETIQUE> <TRADUCTION>ZzzZzz... Le temps n'a plus d'importance... Zzz...</TRADUCTION>",
                        objectives: ["Demander l'heure", "Nommer un jour de la semaine"]
                    }
                }
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
                { 
                    id: "ep9-dialogue", 
                    title: "Dialogue : Où est ma veste ?", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Fahim",
                        context: "Tu es Fahim. L'élève (Zayd) a froid. Il doit te dire 'Il fait froid' (Al-jaww barid) et te demander 'Où est mon manteau ?' (Ayna mi'tafi?).",
                        characterIntro: "Zayd ! Tu trembles ! Quel est le problème ? <PHONETIQUE>Zayd! Anta tartajif! Ma al-mushkila?</PHONETIQUE> <TRADUCTION>Zayd ! Tu trembles ! Quel est le problème ?</TRADUCTION>",
                        objectives: ["Dire 'Il fait froid'", "Dire 'Il fait chaud'", "Demander son manteau"]
                    }
                }
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
                { 
                    id: "ep10-dialogue", 
                    title: "Dialogue : Je dois agir", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Fahim",
                        context: "Tu es Fahim. Tu dois motiver l'élève. Demande-lui : 'Que fais-tu ?' (Maza taf'al?). L'élève doit répondre en utilisant un verbe d'action : 'Je lis' (Ana aqra'u) ou 'J'écris' (Ana aktubu).",
                        characterIntro: "Al-Nissyan est parti ! Nous devons nous préparer. Que sais-tu *faire* ? <PHONETIQUE>Al-Nissyan rahal! Yajib an nasta'id. Maza ta'rifu an *taf'al*?</PHONETIQUE> <TRADUCTION>Al-Nissyan est parti ! Nous devons nous préparer. Que sais-tu *faire* ?</TRADUCTION>",
                        objectives: ["Utiliser 'J'écris'", "Utiliser 'Je lis'", "Utiliser 'Je vais'"]
                    }
                }
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
                { 
                    id: "ep11-dialogue", 
                    title: "Dialogue : L'Énigme du Sphinx", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Le Sphinx",
                        context: "Tu es le Sphinx. Tu demandes à l'élève : 'Qu'as-tu mangé hier ?' (Maza akalta ams?). L'élève doit répondre au passé : 'J'ai mangé...' (Akaltu...).",
                        characterIntro: "Halte, voyageur ! Seuls ceux qui connaissent leur passé peuvent entrer. Qu'as-tu fait hier ? <PHONETIQUE>Qif, ayyuha al-musafir! ... Maza fa'alta ams?</PHONETIQUE> <TRADUCTION>Halte, voyageur ! ... Qu'as-tu fait hier ?</TRADUCTION>",
                        objectives: ["Répondre au passé ('J'ai mangé')", "Répondre au passé ('Je suis allé')"]
                    }
                }
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
                { 
                    id: "ep12-dialogue", 
                    title: "Dialogue : Je le ferai !", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Fahim",
                        context: "Tu es Fahim. Tu demandes à l'élève : 'Que feras-tu demain ?' (Maza sa-taf'alu ghadan?). L'élève doit répondre au futur : 'J'irai...' (Sa-adh-habu...).",
                        characterIntro: "Regarde ! Les futurs s'effacent ! Que feras-tu pour l'arrêter ? <PHONETIQUE>Unzur! Al-mustaqbal yamhi! Maza sa-taf'alu li-tuqifahu?</PHONETIQUE> <TRADUCTION>Regarde ! Le futur s'efface ! Que feras-tu pour l'arrêter ?</TRADUCTION>",
                        objectives: ["Répondre au futur ('J'irai')", "Répondre au futur ('Je lirai')"]
                    }
                }
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
                { 
                    id: "ep13-dialogue", 
                    title: "Dialogue : C'est son livre", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Fahim",
                        context: "Tu es Fahim. Tu montres un livre à l'élève et tu demandes 'À qui est ce livre ?'. L'élève doit répondre 'C'est mon livre' (Hadha kitabi) ou 'C'est son livre' (Hadha kitabuha).",
                        characterIntro: "Ce carnet appartient à Yasmina... Peux-tu me le confirmer ? <PHONETIQUE>Hadha al-daftar li-Yasmina... Hal yumkinuka an tu'akkid?</PHONETIQUE> <TRADUCTION>Ce carnet appartient à Yasmina... Peux-tu me le confirmer ?</TRADUCTION>",
                        objectives: ["Utiliser 'Mon livre' (Kitabi)", "Utiliser 'Ton stylo' (Qalamuka)", "Utiliser 'Son nom' (Ismuha)"]
                    }
                }
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
                { 
                    id: "ep14-dialogue", 
                    title: "Dialogue : Le point faible d'Al-Nissyan", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Al-Nissyan",
                        context: "Tu es Al-Nissyan. Tu te moques de l'élève. Tu es 'grand' (kabir) et 'rapide' (sari'). L'élève doit utiliser ces adjectifs pour te décrire.",
                        characterIntro: "Tu ne peux pas me battre, petit humain ! Je suis... comment dis-tu ? <PHONETIQUE>La yumkinuka an tahzimani, ayyuha al-bashari! Ana... kayfa taqul?</PHONETIQUE> <TRADUCTION>Tu ne peux pas me battre, petit humain ! Je suis... comment dis-tu ?</TRADUCTION>",
                        objectives: ["Utiliser 'Grand' (Kabir)", "Utiliser 'Petit' (Saghir)", "Utiliser 'Rapide' (Sari')"]
                    }
                }
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
                { 
                    id: "ep15-dialogue", 
                    title: "Dialogue : Le Piège", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Al-Nissyan",
                        context: "Tu es Al-Nissyan. Tu testes l'élève avec une révision rapide (Passé, Présent, Futur) avant de lui tendre un piège.",
                        characterIntro: "Alors, tu as appris ? Dis-moi ce que tu as fait HIER, ce que tu fais MAINTENANT, et ce que tu feras DEMAIN. <PHONETIQUE>...Ams? Al-Aan? Ghadan?</PHONETIQUE> <TRADUCTION>...Hier ? Maintenant ? Demain ?</TRADUCTION>",
                        objectives: ["Utiliser le Passé", "Utiliser le Présent", "Utiliser le Futur"]
                    }
                }
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
                { 
                    id: "ep16-dialogue", 
                    title: "Dialogue : Négocier la clé", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Marchand Illusoire",
                        context: "Tu es un marchand. Tu vends une clé. L'élève doit demander le prix ('Bikam?'). Tu donnes un prix très élevé. L'élève doit dire 'C'est cher !' ('Ghali!').",
                        characterIntro: "Ah, tu veux la clé ? C'est 1000 dinars ! <PHONETIQUE>Ah, turidu al-miftah? Bi-alf dinar!</PHONETIQUE> <TRADUCTION>Ah, tu veux la clé ? C'est 1000 dinars !</TRADUCTION>",
                        objectives: ["Demander le prix 'Bikam?'", "Dire 'C'est cher' (Ghali)"]
                    }
                }
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
                { 
                    id: "ep17-dialogue", 
                    title: "Dialogue : Je ressens...", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Fahim",
                        context: "Tu es Fahim. Tu demandes à l'élève comment il se sent ('Kayfa tash'ur?'). L'élève doit répondre en utilisant une émotion 'Je suis heureux' (Ana sa'id) ou 'Je suis triste' (Ana hazin).",
                        characterIntro: "Tout est si vide... Comment te sens-tu, Gardien ? <PHONETIQUE>Kullu shay' farigh... Kayfa tash'ur, ya Haris?</PHONETIQUE> <TRADUCTION>Tout est si vide... Comment te sens-tu, Gardien ?</TRADUCTION>",
                        objectives: ["Dire 'Je suis heureux'", "Dire 'Je suis triste'", "Demander 'Pourquoi ?' (Limaza)"]
                    }
                }
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
                { 
                    id: "ep18-dialogue", 
                    title: "Dialogue : Parler à Al-Nissyan", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Al-Nissyan",
                        context: "Tu es Al-Nissyan. Tu es faible et triste. L'élève doit te parler gentiment. Il doit utiliser les mots 'Paix' (Salam) ou 'Pardon' ('Afwan).",
                        characterIntro: "Laissez-moi... J'ai tout perdu... <PHONETIQUE>Da'uni... Laqad khasirtu kulla shay'...</PHONETIQUE> <TRADUCTION>Laissez-moi... J'ai tout perdu...</TRADUCTION>",
                        objectives: ["Dire 'Paix' (Salam)", "Dire 'Pardon' ('Afwan)", "Dire 'Ami' (Sadiq)"]
                    }
                }
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
                { 
                    id: "ep19-dialogue", 
                    title: "Dialogue : L'énigme finale", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "L'Astrolabe (Voix)",
                        context: "Tu es l'Astrolabe. Tu poses la question finale à l'élève : 'Parles-tu la langue ?' (Hal tatakallamu al-lugha?). L'élève doit répondre 'Oui, je parle arabe' (Na'am, atakallamu al-'arabiya).",
                        characterIntro: "Il manque un mot... Le mot qui donne vie à tous les autres... Parles-tu la LANGUE ? <PHONETIQUE>... Hal tatakallamu al-LUGHA?</PHONETIQUE> <TRADUCTION>... Parles-tu la LANGUE ?</TRADUCTION>",
                        objectives: ["Dire 'Je parle' (Atakallamu)", "Dire 'Langue Arabe' (Lugha Arabiya)"]
                    }
                }
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
                { 
                    id: "ep20-dialogue", 
                    title: "Dialogue : Au revoir, Fahim !", 
                    type: "dialogue", 
                    scenarioData: {
                        characterName: "Fahim",
                        context: "Tu es Fahim, enfin libre. Tu remercies l'élève. L'élève doit te dire 'Au revoir' (Ma'a salama) et 'À bientôt' (Ila liqa').",
                        characterIntro: "Je suis libre ! Merci, Gardien ! Merci pour cette aventure ! <PHONETIQUE>Ana hurr! Shoukran ya Haris! Shoukran 'ala hadhihi al-mughamara!</PHONETIQUE> <TRADUCTION>Je suis libre ! Merci, Gardien ! Merci pour cette aventure !</TRADUCTION>",
                        objectives: ["Dire 'Au revoir' (Ma'a salama)", "Dire 'À bientôt' (Ila liqa')"]
                    }
                }
            ]
        }
    ]
};

//======================================================================
// 2. DONNÉES DE MÉMORISATION (POUR CHAQUE ÉPISODE)
//======================================================================
export const memorizationData = {
    // Épisode 1: Identité
    "ep1-data": {
        phrases: [
            { arabe: "مَا اسْمُك؟", phonetique: "MASMOUKA?", francais: "QUEL EST ΤΟΝ ΝΟΜ ?" },
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
            { arabe: "الجَوُّ bَارِد", phonetique: "AL-JAWW BARID", francais: "IL FAIT FROID" },
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
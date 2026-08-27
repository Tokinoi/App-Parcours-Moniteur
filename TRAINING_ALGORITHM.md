# Fiche de soutenance - Algorithme de proposition de parcours

## 1. Objectif

L'application propose un parcours d'apprentissage a partir de POI reels stockes dans Supabase.

L'utilisateur peut demander :

- une session personnalisee selon un type d'exercice, une duree et sa position ;
- un parcours partageable a partir de presets predefinis.

Le moteur est une heuristique deterministe : a donnees identiques, il produit la meme proposition. Il n'utilise pas d'intelligence artificielle pour choisir les POI.

Fichiers principaux :

- `lib/training-engine.ts` : regles metier et selection des POI ;
- `lib/supabase-rest.ts` : chargement et conversion des POI Supabase ;
- `app/parcours.tsx` : choix utilisateur, localisation et affichage ;
- `app/home.tsx` : navigation GPS, timer et affichage du trajet routier.

## 2. Donnees d'entree

Le moteur recoit :

- `pois` : POI actifs venant de Supabase ;
- `origin` : position de depart de l'utilisateur ;
- `focus` : type de formation, par exemple `Giratoires` ;
- `durationMinutes` : duree choisie, parmi 20, 30, 45 ou 60 minutes.

Chaque POI contient notamment un nom, une description, une categorie et des coordonnees GPS.

Avant la generation, l'ecran demande la localisation. Si elle est refusee, l'application utilise une position par defaut autour de Lyon et l'indique a l'utilisateur.

## 3. Configuration pedagogique

Chaque focus possede une configuration :

- des mots-cles metier ;
- des types d'exercices ;
- une introduction pedagogique ;
- eventuellement une regle stricte.

Exemple pour `Giratoires` :

- mots-cles : `rond point`, `rond-point`, `giratoire`, `bretelle` ;
- exercices : prise d'information, placement de voie, cedez le passage ;
- regle stricte : oui.

Le moteur concatene le nom, la description et la categorie du POI. Le texte est normalise en minuscules et les accents sont retires. Ainsi, `priorite` et `priorite` sont traites de maniere equivalente.

## 4. Etapes de generation

### Etape A - Dedoublonnage

Les POI sont dedoublonnes par leur identifiant. Un meme POI ne peut donc pas apparaitre deux fois dans un parcours.

### Etape B - Filtrage metier

Le moteur elimine les POI qui ne correspondent pas au focus lorsque celui-ci est strict.

Pour `Giratoires`, un POI doit contenir au moins un mot-cle dans son nom, sa description ou sa categorie. Il faut au minimum trois POI correspondants pour construire cette session. Cela evite de proposer un parcours de giratoires a partir de POI non pertinents.

Pour les autres focus, la version actuelle est plus permissive : tous les POI actifs peuvent etre candidats, puis le classement favorise ceux qui contiennent les mots-cles du focus.

### Etape C - Calcul du nombre d'etapes

Le nombre cible est calcule ainsi :

```text
nombre cible = arrondi(duree en minutes / 8)
nombre cible borne entre 3 et 6
```

Exemples :

- 20 minutes -> 3 etapes ;
- 30 minutes -> 4 etapes ;
- 45 minutes -> 6 etapes ;
- 60 minutes -> 6 etapes, car le maximum est 6.

La borne evite les parcours trop courts ou trop longs a presenter et a suivre.

### Etape D - Classement des candidats

A chaque tour, chaque POI restant recoit un score :

```text
score = scoreFocus + scoreProximiteDepuisLeDernierPoint
         + 0,4 x scoreProximiteDepuisLeDepart
```

#### Score de focus

Chaque mot-cle present dans le texte du POI ajoute 18 points.

```text
scoreFocus = 18 x nombre de mots-cles trouves
```

Un POI qui correspond explicitement au vocabulaire de la formation est donc favorise.

#### Score de proximite

La distance est calculee avec la formule de Haversine, adaptee aux coordonnees GPS. Elle donne une distance a vol d'oiseau en metres entre deux points terrestres.

```text
scoreProximite = borne(120 - distance / 35, 0, 120)
```

Plus le POI est proche, plus son score est eleve. Au-dela d'une certaine distance, le score de proximite devient nul.

La distance au dernier POI favorise une progression locale. La distance au depart, avec un poids de 0,4, evite de construire une proposition qui s'eloigne inutilement de la zone de depart.

### Etape E - Selection gloutonne

Le moteur choisit le meilleur POI restant, l'ajoute au parcours, puis recommence depuis ce nouveau point.

C'est une strategie gloutonne : a chaque decision, on prend le meilleur candidat immediat selon le score courant. Elle est simple, rapide et suffisante pour proposer un parcours interactif, mais elle ne garantit pas mathematiquement le meilleur itineraire global possible.

Les POI selectionnes sont retires de la liste des candidats restants, ce qui garantit leur unicite.

### Etape F - Budget de distance

Un budget approximatif est initialise ainsi :

```text
budget = duree en minutes x 260 metres
```

A partir du troisieme POI selectionne, le moteur evite de depasser ce budget de plus de 250 metres. Ce budget sert de garde-fou pour conserver une proposition compatible avec la duree demandee.

Il s'agit d'une estimation, pas d'une duree de conduite exacte : la circulation, les feux et la vitesse reelle ne sont pas modelises par le moteur.

### Etape G - Fallback

Si la selection principale contient moins de trois POI, le moteur complete avec les meilleurs POI restants selon le focus et la distance au depart.

Pour un focus strict comme `Giratoires`, le filtre impose deja trois candidats minimum. Le fallback ne permet donc pas d'introduire un POI non giratoire.

Si aucun POI n'est disponible, la fonction retourne `null` et l'interface affiche un message explicatif.

### Etape H - Construction de l'objet parcours

Pour chaque POI selectionne, le moteur cree une etape avec :

- le POI ;
- son index ;
- une consigne pedagogique adaptee au focus.

Le resultat contient aussi le nom, la description, la duree, la competence, les types d'exercices, l'origine et le mode (`session` ou `shared`).

## 5. Deux modes utilisateur

### Session personnalisee

L'utilisateur choisit la duree et le focus. Le moteur construit directement une proposition a partir des POI actifs et de la position courante.

### Parcours partageables

Le moteur parcourt six presets :

- Giratoires express, 20 minutes ;
- Priorites & intersections, 30 minutes ;
- Centre-ville dense, 30 minutes ;
- Carrefours a feux, 45 minutes ;
- Arrets et stationnement, 45 minutes ;
- Parcours complet, 60 minutes.

Chaque preset est genere avec les POI reels disponibles. Les presets impossibles a construire sont retires de la liste.

Le resultat est trie par :

1. duree croissante ;
2. nom du focus en francais ;
3. distance du premier POI au depart.

## 6. Difference entre selection et navigation

La selection du parcours utilise la distance de Haversine, donc une distance geographique directe. Elle sert uniquement a choisir les POI pertinents et proches.

Apres le demarrage, l'application utilise OSRM pour demander un trajet routier entre la position GPS et les etapes restantes. OSRM ne decide pas quels POI choisir : il calcule la geometrie de la route a afficher sur la carte.

Si OSRM est indisponible, l'application conserve un tracé de secours reliant les waypoints.

Pendant le parcours :

- le GPS met a jour la position ;
- la distance au POI courant est recalculee ;
- le parcours passe en mode suivi ;
- une etape peut etre validee avec le bouton suivant ;
- un timer compare le temps ecoule a la duree demandee.

## 7. Complexite et choix techniques

Le moteur travaille en local apres le chargement des POI. Avec au plus six etapes, il effectue quelques classements de la liste restante.

Si `n` est le nombre de POI et `k` le nombre maximal d'etapes, la complexite est approximativement `O(k x n log n)`. Dans l'application, `k` est borne a 6, donc le cout reste faible pour un catalogue de POI classique.

Les avantages :

- comportement explicable devant un jury ;
- execution rapide ;
- pas de cout d'API pour la decision ;
- prise en compte simultanee du besoin pedagogique et de la proximite ;
- fonctionnement meme si le service de calcul routier est indisponible.

## 8. Limites actuelles et ameliorations possibles

Le moteur est une heuristique, pas un optimiseur de tournee complet. Il ne garantit donc pas le parcours routier globalement le plus court.

Autres limites :

- la distance de selection est a vol d'oiseau ;
- le budget utilise une vitesse moyenne approximative ;
- les focus non stricts acceptent tous les POI et les favorisent seulement par score ;
- le moteur ne connait pas le trafic en temps reel ;
- la pertinence depend de la qualite du nom, de la description et de la categorie saisies dans Supabase ;
- la duree demandee est une duree cible, pas une garantie de duree reelle.

Evolutions possibles :

- utiliser les distances routieres OSRM dans le score ;
- ajouter des regles strictes pour chaque focus ;
- prendre en compte le trafic ou le type de voie ;
- optimiser globalement l'ordre des etapes ;
- enrichir les POI avec des tags structures plutot que dependre uniquement du texte libre ;
- ajouter des tests sur les cas limites : moins de trois POI, doublons, POI tres eloignes et absence de resultat.

## 9. Questions probables du jury

### Pourquoi ne pas choisir les POI uniquement par distance ?

Parce qu'un POI proche n'est pas forcement pedagogiquement pertinent. Le score combine la proximite et la correspondance avec le focus demande.

### Comment garantissez-vous qu'un parcours de giratoires contient bien des giratoires ?

Le focus `Giratoires` est strict. Le nom, la description ou la categorie doit contenir un mot-cle de giratoire, et au moins trois POI correspondants sont necessaires.

### Est-ce de l'intelligence artificielle ?

Non. C'est un moteur de regles et de scoring deterministe. Ce choix est volontaire : il est rapide, testable, explicable et suffisant pour le besoin actuel.

### Pourquoi utiliser Haversine ?

Les POI sont definis par latitude et longitude. Haversine calcule correctement la distance entre deux coordonnees GPS sur une surface terrestre, contrairement a une simple soustraction des latitudes et longitudes.

### Pourquoi une strategie gloutonne ?

Elle donne rapidement une bonne proposition locale et reste facile a expliquer. Le nombre d'etapes est petit, donc cette approche est adaptee a une generation interactive. Une optimisation globale pourrait etre ajoutee plus tard si le volume ou les contraintes augmentent.

### OSRM choisit-il les POI ?

Non. Le moteur choisit les POI. OSRM calcule ensuite la route automobile entre les waypoints selectionnes.

### Que se passe-t-il si un POI est ajoute dans le back-office ?

L'ecran Parcours recharge les POI actifs au demarrage, puis les rafraichit periodiquement. La proposition est recalculee a partir de la nouvelle liste.

### Que se passe-t-il s'il n'y a pas assez de POI ?

La generation retourne `null` si aucun candidat n'est disponible. Pour les giratoires, elle retourne aussi `null` s'il y a moins de trois candidats pertinents, et l'interface explique la condition.

### Le parcours respecte-t-il exactement les 30 minutes ?

Non, 30 minutes est une cible de generation. Le moteur limite le nombre d'etapes et utilise un budget approximatif de distance. La duree reelle depend ensuite de la circulation et des conditions de conduite.

## 10. Phrase de synthese a retenir

> Le moteur charge les POI actifs reels, elimine les POI incompatibles avec le besoin, attribue a chaque candidat un score de pertinence et de proximite, selectionne progressivement les meilleurs POI sans doublon, puis OSRM calcule le trajet routier entre ces etapes.

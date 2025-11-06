# Modelify - Plateforme de demandes de modélisation 3D

Modelify est une plateforme web permettant aux utilisateurs de soumettre des demandes de projets de modélisation 3D en ligne. Le projet est composé d'un frontend React avec Bootstrap et d'un backend FastAPI.

## 🚀 Architecture du projet

```
Modelify/
├── frontend/          # Application React
│   ├── src/
│   │   ├── components/   # Composants réutilisables
│   │   ├── pages/       # Pages de l'application
│   │   ├── App.js       # Composant principal
│   │   └── index.js     # Point d'entrée
│   ├── public/         # Fichiers statiques
│   └── package.json    # Dépendances Node.js
│
├── backend/           # API FastAPI
│   ├── app/
│   │   ├── routers/    # Routes de l'API
│   │   ├── schemas/    # Modèles Pydantic
│   │   └── models/     # Modèles de base de données
│   ├── main.py        # Point d'entrée FastAPI
│   └── requirements.txt # Dépendances Python
│
└── README.md         # Documentation
```

## 🛠️ Installation et configuration

### Prérequis

- Node.js (v16 ou plus récent)
- Python 3.8+
- npm ou yarn

### Installation du frontend

```bash
cd frontend
npm install
```

### Installation du backend

```bash
cd backend
pip install -r requirements.txt
```

## 🚀 Démarrage du projet

### Démarrer le backend (FastAPI)

```bash
cd backend
python main.py
```

Le backend sera accessible sur : http://localhost:8000

Documentation API interactive : http://localhost:8000/docs

### Démarrer le frontend (React)

```bash
cd frontend
npm start
```

Le frontend sera accessible sur : http://localhost:3000

## 📋 Fonctionnalités

### Frontend (React + Bootstrap)
- ✅ Page d'accueil avec présentation des services
- ✅ Formulaire de demande de projet avec upload de fichiers
- ✅ Page à propos
- ✅ Page de contact
- ✅ Navigation responsive avec Bootstrap
- ✅ Design moderne et intuitif

### Backend (FastAPI)
- ✅ API RESTful pour les demandes de projets
- ✅ Gestion des messages de contact
- ✅ Upload de fichiers
- ✅ Documentation automatique avec Swagger
- ✅ CORS configuré pour le développement
- ✅ Validation des données avec Pydantic

## 🔗 Endpoints de l'API

### Projets
- `POST /api/projects` - Créer une demande de projet
- `GET /api/projects` - Lister toutes les demandes
- `GET /api/projects/{id}` - Récupérer une demande spécifique
- `PUT /api/projects/{id}/status` - Mettre à jour le statut

### Contact
- `POST /api/contact` - Envoyer un message de contact
- `GET /api/contact/messages` - Lister tous les messages
- `GET /api/contact/messages/{id}` - Récupérer un message spécifique

## 🗂️ Types de projets supportés

- Modélisation de produits
- Concepts créatifs
- Prototypage
- Modélisation architecturale
- Autres (personnalisé)

## 📝 Structure des données

### Demande de projet
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "project_type": "string",
  "title": "string", 
  "description": "string",
  "budget": "string",
  "deadline": "string"
}
```

## 🔧 Configuration

### Variables d'environnement (Backend)

Copiez `.env.example` vers `.env` et configurez :

```env
DATABASE_URL=sqlite:///./modelify.db
SECRET_KEY=your-secret-key-here
HOST=0.0.0.0
PORT=8000
```

## 🎨 Technologies utilisées

### Frontend
- React 18
- React Router DOM
- Bootstrap 5
- Axios pour les requêtes HTTP
- JavaScript (ES6+)

### Backend
- FastAPI
- Pydantic pour la validation
- Python 3.8+
- Uvicorn comme serveur ASGI

## 📱 Responsive Design

L'interface est entièrement responsive et optimisée pour :
- 📱 Mobiles
- 📱 Tablettes  
- 💻 Ordinateurs de bureau

## 🚀 Développement

### Scripts frontend disponibles

```bash
npm start      # Démarrer en mode développement
npm build      # Construire pour la production
npm test       # Lancer les tests
```

### Commandes backend utiles

```bash
python main.py           # Démarrer le serveur
uvicorn main:app --reload  # Démarrer avec auto-reload
```

## 📄 Licence

Ce projet est sous licence MIT.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📞 Support

Pour toute question ou problème, contactez-nous à : contact@modelify.fr
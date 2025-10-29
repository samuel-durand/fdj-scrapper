# 🌐 Sous-domaine o2switch pour le Backend

## ⚠️ IMPORTANT À SAVOIR

O2switch **ne peut PAS exécuter Node.js** directement (hébergement mutualisé).

**MAIS** tu peux :
1. ✅ Créer un sous-domaine sur o2switch
2. ✅ Le faire pointer vers ton backend Render
3. ✅ Avoir une URL personnalisée type `api.resultat-fdj.soqe8286.odns.fr`

---

## 🎯 Solution 1 : Sous-domaine pointant vers Render (RECOMMANDÉ)

### Architecture finale

```
Frontend   → resultat-fdj.soqe8286.odns.fr          (o2switch)
Backend    → api.resultat-fdj.soqe8286.odns.fr      (pointe vers Render)
            ↓
         Render.com (exécute vraiment Node.js)
```

### Étape 1 : Déployer le backend sur Render

1. Déployer sur Render comme prévu
2. URL temporaire : `https://loterie-backend.onrender.com`

### Étape 2 : Ajouter un domaine personnalisé sur Render

1. **Dashboard Render** → Ton service
2. **Settings** → **Custom Domain**
3. Ajouter : `api.resultat-fdj.soqe8286.odns.fr`
4. Render te donne un **CNAME** à configurer

### Étape 3 : Configurer le DNS sur o2switch

1. **cPanel o2switch** → **Zone Editor** ou **Domaines**
2. Ajouter un **enregistrement CNAME** :
   
   ```
   Type:     CNAME
   Nom:      api
   Pointe vers: [CNAME fourni par Render]
   TTL:      14400
   ```

3. Sauvegarder

### Étape 4 : Attendre la propagation DNS (5-30 min)

Une fois propagé, ton backend sera accessible sur :
```
https://api.resultat-fdj.soqe8286.odns.fr
```

### Étape 5 : Mettre à jour le frontend

Dans `.env.production` :
```env
VITE_API_URL=https://api.resultat-fdj.soqe8286.odns.fr/api
```

Rebuild et redéployer le frontend sur o2switch.

---

## 🎯 Solution 2 : Reverse Proxy PHP (Pas recommandé)

O2switch supporte PHP, donc techniquement tu pourrais créer un reverse proxy PHP qui redirige vers Render.

**Fichier** : `api/index.php` (sur o2switch)

```php
<?php
// Reverse proxy simple vers Render
$renderUrl = 'https://loterie-backend.onrender.com';
$path = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Construire l'URL complète
$fullUrl = $renderUrl . $path;

// Initialiser cURL
$ch = curl_init($fullUrl);

// Headers
$headers = getallheaders();
curl_setopt($ch, CURLOPT_HTTPHEADER, 
    array_map(function($k, $v) { return "$k: $v"; }, 
    array_keys($headers), $headers)
);

// Méthode HTTP
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

// Body pour POST/PUT
if ($method === 'POST' || $method === 'PUT') {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// Options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// Exécuter
$response = curl_exec($ch);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$responseHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);

// Retourner les headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo $responseBody;
curl_close($ch);
?>
```

**Problèmes** :
- ❌ Complexe à maintenir
- ❌ Latence supplémentaire
- ❌ Pas de websockets
- ❌ Limites PHP de o2switch

**Conclusion** : Utilise Solution 1 (CNAME)

---

## 🎯 Solution 3 : Architecture hybride recommandée

### Configuration finale optimale

```
┌─────────────────────────────────────────────────┐
│  Frontend (React)                               │
│  https://resultat-fdj.soqe8286.odns.fr         │
│  → Hébergé sur o2switch                        │
└─────────────────┬───────────────────────────────┘
                  │
                  │ API Calls
                  ↓
┌─────────────────────────────────────────────────┐
│  Sous-domaine o2switch (CNAME)                 │
│  https://api.resultat-fdj.soqe8286.odns.fr     │
│  → Pointe vers Render                          │
└─────────────────┬───────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────┐
│  Backend Node.js sur Render                    │
│  (exécution réelle)                            │
└─────────────────┬───────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────┐
│  MongoDB Atlas                                  │
│  (Base de données)                             │
└─────────────────────────────────────────────────┘
```

### Avantages

✅ **URLs personnalisées** avec ton domaine  
✅ **HTTPS gratuit** (via Render + Let's Encrypt)  
✅ **Professionnel** : tout sur ton domaine  
✅ **Simple** : juste un CNAME à configurer  
✅ **Performant** : pas de proxy PHP  

---

## 📋 Checklist complète

### Sur Render.com

- [ ] Déployer le backend
- [ ] Settings → Custom Domain
- [ ] Ajouter `api.resultat-fdj.soqe8286.odns.fr`
- [ ] Noter le CNAME fourni par Render

### Sur o2switch (cPanel)

- [ ] Zone Editor / Gestion DNS
- [ ] Ajouter enregistrement CNAME :
  - Nom : `api`
  - Pointe vers : `[CNAME Render]`
- [ ] Sauvegarder

### Attendre la propagation

- [ ] Tester : `nslookup api.resultat-fdj.soqe8286.odns.fr`
- [ ] Vérifier : `https://api.resultat-fdj.soqe8286.odns.fr/api/health`

### Mettre à jour le frontend

- [ ] Modifier `.env.production` : `VITE_API_URL=https://api.resultat-fdj.soqe8286.odns.fr/api`
- [ ] Build : `npm run build`
- [ ] Upload `dist/` vers o2switch

### Tester l'application complète

- [ ] Ouvrir `https://resultat-fdj.soqe8286.odns.fr`
- [ ] S'inscrire / Se connecter
- [ ] Générer des numéros
- [ ] Sauvegarder une combinaison
- [ ] Vérifier que tout fonctionne

---

## 🔧 Configuration DNS détaillée

### Exemple de configuration dans cPanel o2switch

```
Zone : soqe8286.odns.fr

Type    Nom    Pointe vers                                  TTL
─────────────────────────────────────────────────────────────────
CNAME   api    loterie-backend.onrender.com.               14400
```

**Important** : N'oublie pas le `.` à la fin du CNAME !

### Vérifier la propagation DNS

```bash
# Windows PowerShell
nslookup api.resultat-fdj.soqe8286.odns.fr

# Devrait retourner l'IP de Render
```

---

## 🌐 URLs finales

### En développement (local)

```
Frontend : http://localhost:5173
Backend  : http://localhost:5000
```

### En production

```
Frontend : https://resultat-fdj.soqe8286.odns.fr
Backend  : https://api.resultat-fdj.soqe8286.odns.fr
MongoDB  : mongodb+srv://... (MongoDB Atlas)
```

---

## 💰 Coûts

| Service | Hébergement | Coût |
|---------|-------------|------|
| **Frontend** | o2switch | Déjà payé |
| **Backend** | Render.com (pointe via CNAME) | 0€ |
| **Database** | MongoDB Atlas | 0€ |
| **Sous-domaine** | o2switch (inclus) | 0€ |
| **SSL** | Let's Encrypt (auto via Render) | 0€ |
| **TOTAL** | | **0€/mois** |

---

## 🎯 Avantages de cette architecture

### Avant (sans sous-domaine)

```
Frontend : resultat-fdj.soqe8286.odns.fr
Backend  : loterie-backend.onrender.com  ← URL Render générique
```

### Après (avec sous-domaine)

```
Frontend : resultat-fdj.soqe8286.odns.fr
Backend  : api.resultat-fdj.soqe8286.odns.fr  ← URL personnalisée !
```

**Avantages** :
- ✅ Tout sur ton domaine
- ✅ Plus professionnel
- ✅ Facilite les certificats SSL
- ✅ Simplifie les CORS
- ✅ Meilleure branding

---

## 🔥 Problèmes courants

### 1. Le CNAME ne fonctionne pas

**Causes possibles** :
- Propagation DNS en cours (attendre 30 min)
- CNAME mal configuré
- Cache DNS

**Solutions** :
```bash
# Vider le cache DNS local
ipconfig /flushdns

# Vérifier la propagation
https://dnschecker.org
```

### 2. "Your connection is not private" (SSL)

**Cause** : Certificat SSL en cours de génération sur Render

**Solution** : Attendre 10-15 minutes après l'ajout du domaine

### 3. 404 sur api.resultat-fdj...

**Cause** : Render n'a pas encore validé le domaine personnalisé

**Solution** : 
- Vérifier que le CNAME est bien configuré
- Attendre la validation DNS
- Redémarrer le service Render

---

## 🎉 Conclusion

**OUI, tu peux créer un sous-domaine avec o2switch !**

**MAIS** il pointera vers Render qui exécutera vraiment le backend Node.js.

**Résultat** : 
- URLs professionnelles sur ton domaine
- Backend fonctionnel sur Render
- 100% gratuit
- Configuration simple (juste un CNAME)

**Prêt à configurer ? Suis les étapes ci-dessus ! 🚀**


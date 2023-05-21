const express = require('express')
const app = express()
const mysql = require('mysql')
const port = 3000

function generateToken() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 20;
    let token = '';
    for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    token += characters.charAt(randomIndex);
    }
    return token;
}

// USER
    // ID
    // USERNAME
    // PASSWORD
    // TOKEN

// RESOURCE
    // ID
    // TITRE
    // CONTENT

// Connexion à la base de données
const connection = mysql.createConnection({
    host: 'mysql-fournel.alwaysdata.net', 
    user: 'fournel',
    password: 'Azerty.123',
    database: 'fournel_api'
});

connection.connect();

// POST http://localhost:3000/register
// Content-Type: application/json
// {
//   "username": "john",
//   "password": "password"
// }
// Inscription d'un utilisateur 
app.post('/register', (req, res) => {
    const credentials = req.body;
    connection.query(
        'INSERT INTO User (Username, Password) VALUES (' + credentials.username + ',' + credentials.password + ')', 
        function (error, results, fields) {
            if (error) throw error;
    });
    res.send()
})

// Connexion d'un utilisateur
// POST http://localhost:3000/login
// Content-Type: application/json
// {
//   "username": "john",
//   "password": "password"
// }
app.post('/login', (req, res) => {
    const credentials = req.body;
    if(!credentials.username || !credentials.password) {
        res.status(401).send('Accès non autorisé.');
    }
    connection.query(
        `SELECT * FROM User u WHERE u.username = '${credentials.username}'`, 
        function (error, results, fields) {
            if (error) throw error;
            const myUser = results[0];
            if (myUser && myUser.password === credentials.password) {
                const token = generateToken();
                connection.query(
                    `UPDATE User u SET Token ='${token}' WHERE u.username = '${credentials.username}'`, 
                    function (error, results, fields) {
                        if (error) throw error;
                        res.send('Authentification réussie.');
                    }
                );
            } else {
                res.status(401).send('Nom d\'utilisateur ou mot de passe incorrect.');
            }
        }
    );
});

// Création d'une ressource
// POST http://localhost:3000/resources
// Authorization: Bearer <TOKEN>
// Content-Type: application/json
// {
//   "title": "Ma première ressource",
//   "content": "Contenu de ma première ressource"
// }
app.post('/resources', (req, res) => {
    const token = req.headers['authorization'];
    if(!token){
        res.status(401).send('Accès non autorisé.');
    }
    connection.query(
        `SELECT * FROM User u WHERE u.Token = '${token}'`, 
        function (error, results, fields) {
            if (error) throw error;
            if (results[0]) {
                // Créé la ressources
                const ressource = req.body
                connection.query(
                    'INSERT INTO Ressources (Title, Content) VALUES (' + ressource.title + ',' + ressource.content + ')',  
                    function (error, finalresults, fields) {
                        if (error) throw error;
                        res.send(finalresults[0]);
                    })
            } else {
                res.status(401).send('Accès non autorisé.');
            }
        }
    );
});

app.post('/logout', (req, res) => {
    const credentials = req.body;
    if(!credentials.username || !credentials.password) {
        res.status(401).send('Accès non autorisé.');
    }
    // VÉRIFIER SI L'UTILISATEUR EXISTE ET S'IL A LE BON MOT DE PASSE EN BASE DE DONNÉES
    connection.query(
        `SELECT * FROM User u WHERE u.username = '${credentials.username}'`, 
        function (error, results, fields) {
            if (error) throw error;
            const myUser = results[0];
            // if(myUser.password === credentials.password) // VÉRIFIER QUE LE MOT DE PASSE CORRESPOND
            if (myUser && myUser.password === credentials.password) {
                // ENREGISTRER LE TOKEN EN BASE DE DONNÉES POUR L'UTILISATEUR CONNECTÉ
                connection.query(
                    `UPDATE User u SET Token = NULL WHERE u.username = '${credentials.username}'`, 
                    function (error, results, fields) {
                        if (error) throw error;
                        // Effectuer d'autres actions en cas de succès (si nécessaire)
                        res.send('Déconnexion réussie.');
                    }
                );
            } 
        }
    );
})

// Lecture de toutes les ressources
// GET http://localhost:3000/resources
// Authorization: Bearer <TOKEN>
app.get('/resources', (req, res) => {
    const token = req.headers['Authorization'];
    if(!token){
        res.status(401).send('Accès non autorisé.');
    }
    // VERIFIER TOKEN
    connection.query(
        `SELECT * FROM User u WHERE u.Token = ${token}`, 
        function (error, results, fields) {
            if (error) throw error;
            if(results[0]){
                
                let myResources;
                connection.query(
                `SELECT * FROM Resources`, 
                function (error, results, fields) {
                    if (error) throw error;
                    myResources = results;
                });
                res.send(myResources);
            } else {
                res.status(401).send('Accès non autorisé.');
            }
    });
})

// Mise à jour d'une ressource
// PUT http://localhost:3000/resources/<RESOURCE_ID>
// Authorization: Bearer <TOKEN>
// Content-Type: application/json

// {
//   "title": "Nouveau titre",
//   "content": "Nouveau contenu"
// } 

app.put('/resources/:monId', (req, res) => {
    const token = req.headers['Authorization'];
    if(!token){
        res.status(401).send('Accès non autorisé.');
    }
    // VERIFIER TOKEN
    connection.query(
        `SELECT * FROM User u WHERE u.Token = ${token}`, 
        function (error, results, fields) {
            if (error) throw error;
            if(results[0]){ 
                connection.query(
                    `UPDATE Resources SET Title = ${req.body.title}, Content = ${req.body.content} WHERE ID = ${req.params.monId}`, 
                    function (error, results, fields) {
                        if (error) throw error;
                });
                res.send()
            } else {
                res.status(401).send('Accès non autorisé.');
            }
    });
})

// Suppression d'une ressource
// DELETE http://localhost:3000/resources/<RESOURCE_ID>
// Authorization: Bearer <TOKEN>
app.delete('/resources/:monId', (req, res) => {
    const token = req.headers['Authorization'];
    if(!token){
        res.status(401).send('Accès non autorisé.');
    }
    // VERIFIER TOKEN
    connection.query(
        `SELECT * FROM User u WHERE u.Token = ${token}`, 
        function (error, results, fields) {
            if (error) throw error;
            if(results[0]){
                connection.query(
                    `DELETE FROM Resources WHERE ID = ${req.params.monId}`, 
                    function (error, finalresults, fields) {
                        if (error) throw error;
                        res.send(finalresults)
                });
            } else {
                res.status(401).send('Accès non autorisé.');
            }
    });
})

app.get('/toto', (req, res) => {
    // VERIFIER TOKEN
    connection.query(
        'INSERT INTO User (Username, Password) VALUES("toto", "tata")',
        function (error, results, fields) {
            if (error) throw error;
        });
    res.send("changement effectué")
    
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose()
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

//Middleware
const { authenticateToken, controlExistingToken } = require('./middleware/auth.middleware')

// get config vars
dotenv.config();

const db = new sqlite3.Database(process.env.DB_FILE)
const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.get('/drinks', (req, res) => {

    db.all('SELECT * FROM Drinks;', (err, row) => {
        const r = row;
        res.json({ drinks: r });
    })
});

app.get('/drinks/:id', (req, res) => {
    const id = req.params.id;

    db.get('SELECT * FROM Drinks WHERE id = $id;', { $id: id }, (err, row) => {
        const r = row;
        res.json({ drink: r });
    })
});

app.put('/drinks/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    const name = req.body.name

    db.run("UPDATE Drinks SET name = $name WHERE id = $id", {
        $id: id,
        $name: name
    }, (err) => {
        if (err)
            console.log(err)
        else
            res.status(200)/* .json({success:true}) */;
    })


});

app.post('/drinks', authenticateToken, (req, res) => {
    const name = req.body.name
    db.get('SELECT COUNT(id) FROM Drinks;', [], (err, row) => {
        const r = ++row['COUNT(id)'];

        db.run('INSERT INTO Drinks (id,name) VALUES ($id,$name);', {
            $id: r,
            $name: name
        }, (err) => {
            if (err) {
                console.log(err)
                res.send(err)
            }
            else {
                db.get('SELECT * FROM Drinks WHERE id = $id;', { $id: r }, (err, row) => {
                    const r = row;
                    res.status(200).json({ drink: r });
                })
            }

        })
    })
});

app.post('/register', controlExistingToken, (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    db.get('SELECT COUNT(id) FROM Users WHERE email=$username;', {
        $username: username,
    }, (err, exsisting) => {
        const resultQuery = exsisting['COUNT(id)'];

        if (resultQuery === 0) {
            db.get('SELECT COUNT(id) FROM Users;', [], (err, row) => {
                if (err)
                    res.send(err)

                const r = ++row['COUNT(id)'];

                db.run('INSERT INTO Users (id,email,password) VALUES ($id,$username,$password);', {
                    $id: r,
                    $username: username,
                    $password: password
                }, (err) => {
                    if (err)
                        console.log(err)
                    else {
                        const token = generateAccessToken({ username: username });
                        res.status(200).json({ token: token, expire: '2h' });
                    }
                })
            })
        } else {
            res.send("User Alredy Exsisting")
        }
    })
});

app.post('/login', controlExistingToken, (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    db.get('SELECT COUNT(id) FROM Users WHERE email=$username AND password=$password;', {
        $username: username,
        $password: password
    }, (err, row) => {
        const r = row['COUNT(id)'];
        console.log(r)

        if (r === 1) {
            const token = generateAccessToken({ username: username });
            res.status(200).json({ token: token, expire: '2h' });
        } else if (r === 0) {
            res.status(401).send('Unauthorized');
        } else if (r > 1) {
            res.send('SHIT')
        }
    })
});

function generateAccessToken(username) {
    return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: '2h' });
}


app.listen(PORT, () => console.log(`Hello world app listening on port ${PORT}!`))
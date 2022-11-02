const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database('E:/MySqlLite/drinks.db')
const app = express();

const port = 3000;


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

app.put('/drinks/:id', (req, res) => {
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

app.post('/drinks', (req, res) => {
    const id = req.body.id;
    const name = req.body.name

    db.run('INSERT INTO Drinks (id,name) VALUES ($id,$name);', {
        $id: id,
        $name: name
    }, (err) => {
        if (err)
            console.log(err)
        else {
            db.get('SELECT * FROM Drinks WHERE id = $id;', { $id: id }, (err, row) => {
                const r = row;
                res.status(200).json({ drink: r });
            })
        }
            
    })
});

app.listen(port, () => console.log(`Hello world app listening on port ${port}!`))
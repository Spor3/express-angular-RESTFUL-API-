//Imports package
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
//Middleware
const {
  authenticateToken,
  controlExistingToken,
} = require("./middleware/auth.middleware");
//Hash Password Service
const {
  hashPassword,
  comparePassword,
} = require("./_service/hashPassword.service");
// get config vars
dotenv.config();
//Inizialize db app and PORT
const db = new sqlite3.Database(process.env.DB_FILE);
const app = express();
const PORT = process.env.PORT;
//CORS and BodyParser
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

/* ENDPOINT /drinks */

//GET all Drinks (res NO BODY)
app.get("/drinks", (req, res) => {
  db.all("SELECT * FROM Drinks;", (err, row) => {
    const r = row;
    res.json({ drinks: r });
  });
});
/*POST(create) new single drink  
  req(body.name:string)*
  (NEED AUTHENTICATION)*/
app.post("/drinks", authenticateToken, (req, res) => {
  const name = req.body.name;
  db.get("SELECT MAX(id) FROM Drinks;", [], (err, row) => {
    const r = ++row["MAX(id)"];

    db.run(
      "INSERT INTO Drinks (id,name) VALUES ($id,$name);",
      {
        $id: r,
        $name: name,
      },
      (err) => {
        if (err) {
          console.log(err);
          res.send(err);
        } else {
          db.get(
            "SELECT * FROM Drinks WHERE id = $id;",
            { $id: r },
            (err, row) => {
              const r = row;
              res.status(200).json({ drink: r });
            }
          );
        }
      }
    );
  });
});

/* ENDPOINT /drinks/:id  */

/*GET single Drink by id
    req(params.id:string)*
*/
app.get("/drinks/:id", (req, res) => {
  const id = req.params.id;

  db.get("SELECT * FROM Drinks WHERE id = $id;", { $id: id }, (err, row) => {
    const r = row;
    res.json({ drink: r });
  });
});
/*PUT(update) single drink by id
    req(body.name:string)*
    req(params.id:string)*
    (NEED AUTHENTICATION)
*/
app.put("/drinks/:id", authenticateToken, (req, res) => {
  const id = req.params.id;
  const name = req.body.name;

  db.run(
    "UPDATE Drinks SET name = $name WHERE id = $id",
    {
      $id: id,
      $name: name,
    },
    (err) => {
      if (err) console.log(err);
      else res.status(200) /* .json({success:true}) */;
    }
  );
});

/* ENDPOINT AUTH /register, /login */

/* POST(create) new user
     req(body.username:string)*
     req(body.password:string)* 
     (NEED NO AUTHENTICATION(NO JWT TOKEN))  */
app.post("/register", controlExistingToken, async (req, res) => {
  const username = req.body.username;
  const password = await hashPassword(req.body.password);

  db.get(
    "SELECT COUNT(id) FROM Users WHERE email=$username;",
    {
      $username: username,
    },
    (err, exsisting) => {
      const resultQuery = exsisting["COUNT(id)"];

      if (resultQuery === 0) {
        db.get("SELECT MAX(id) FROM Users;", [], (err, row) => {
          if (err) res.send(err);

          const r = ++row["MAX(id)"];

          db.run(
            "INSERT INTO Users (id,email,password) VALUES ($id,$username,$password);",
            {
              $id: r,
              $username: username,
              $password: password,
            },
            (err) => {
              if (err) console.log(err);
              else {
                const token = generateAccessToken({ username: username });
                res.status(200).json({ token: token, expire: "2h" });
              }
            }
          );
        });
      } else {
        res.send("User Alredy Exsisting");
      }
    }
  );
});
/* POST login user
      req(body.username)*
      req(body.password)* 
   (NEED NO AUTHENTICATION(NO JWT TOKEN))
 */
app.post("/login", controlExistingToken, (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  db.get(
    "SELECT password FROM Users WHERE email=$username;",
    {
      $username: username,
    },
    async (err, row) => {
      if (err) res.send(err);

      const receivedPassword = row.password;
      const passwordCompare = await comparePassword(password, receivedPassword);

      if (passwordCompare) {
        const token = generateAccessToken({ username: username });
        res.status(200).json({ token: token, expire: "2h" });
      } else {
        res.status(401).send("Unauthorized");
      }
    }
  );
});
/* Function that generate JWT Access Token
    param username:string user Object with personal information(only username)
    return JWT Token
*/
function generateAccessToken(username) {
  return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: "2h" });
}
//RUN app
app.listen(PORT, () => console.log(`Listening on port ${PORT}!`));

//An Active auth string
/* eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IkFkbWluIiwiaWF0IjoxNjY3NTUzNjc5LCJleHAiOjE2Njc1NjA4Nzl9.lG-RI8WvqQbWJJ23IuLDBKo9kpcq7SizmawMldNF-UM */

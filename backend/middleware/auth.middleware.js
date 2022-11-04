const jwt = require('jsonwebtoken');
/* Function that verify if a JWS Token is rigth or not and move on in if rigth
   Params:
     req: The request
     res: The response
     next: middleware function to move on */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {

        if (err) return res.sendStatus(403)

        req.user = user

        next()
    })
}
/* Function that verify if a JWS Token already existing and move on only if not
   Params:
     req: The request
     res: The response
     next: middleware function to move on */
function controlExistingToken(req, res, next) {

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null){
        next()
    }else{

    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {

        if (err) return res.sendStatus(403)

        res.send('Alreedy Logged')
    })
    }
}
//Export module
module.exports = {authenticateToken, controlExistingToken};
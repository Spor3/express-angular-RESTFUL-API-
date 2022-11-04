const bcrypt = require("bcrypt")
/* Function that hash a plainText password
   Params:
     plaintextPassword:string The string to hash
   Return:
     The hashed string*/
async function hashPassword(plaintextPassword) {
    const hash = await bcrypt.hash(plaintextPassword, 10);
    
    return hash;
}
 /* Function that compare a plainText with hashText 
    Params:
      plaintextPassword:string The plainText string to compare
      hash:string The hash string to compare
    Return:
      True if the two params are equals else false*/
async function comparePassword(plaintextPassword, hash) {
    const result = await bcrypt.compare(plaintextPassword, hash);
    return result;
}

module.exports = {hashPassword, comparePassword}
const bcrypt = require('bcrypt')

async function hashing(password){

    const salt = await bcrypt.genSalt(10);
    const hashpass = await bcrypt.hash(password,salt);

    return hashpass;
}

module.exports=hashing;
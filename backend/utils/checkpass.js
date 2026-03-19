const bcrypt = require('bcrypt')

async function check(password,dbpass)
{
   
    const valid=await bcrypt.compare(password,dbpass);

    return valid;
}

module.exports=check;
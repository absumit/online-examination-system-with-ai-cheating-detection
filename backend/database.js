const mongoose=require('mongoose')

async function main(){
    uri=process.env.DB_CRED;

    try{
        mongoose.connect(uri)
    }
    catch(err)
    {
        console.log("error ",err)
        throw(err)
    }
}

module.exports=main;
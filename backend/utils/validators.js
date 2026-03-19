const validator=require("validator")

function validuser(data){
    const mandatoryfield=["name","email","password"]

    const isallowed=mandatoryfield.every((k)=>Object.keys(data).includes(k));

    if(!isallowed)
        throw new Error("Name, email, and password are required")
    if(!validator.isEmail(data.email))
        throw new Error("Invalid email format")
     if(data.password.length < 6)
            throw new Error("Password must be at least 6 characters long");

     if(data.name.length>20 || data.name.length<3 )
        throw new Error("Name length should be between 3 and 20 characters")
}

module.exports=validuser;
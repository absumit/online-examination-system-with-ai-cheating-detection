const mongoose=require('mongoose')
const {Schema}=mongoose

const newschema = new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    age:{
        type:Number
    },
    role:{
        type:String,
        enum:['admin','student'],
        default:'student'
    },
    department:{
        type:String
    },
    enrollmentNumber:{
        type:String
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})

const user=mongoose.model('user',newschema)

module.exports=user;
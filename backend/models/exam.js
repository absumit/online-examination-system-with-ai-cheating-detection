const mongoose=require('mongoose')
const {Schema}=mongoose

const newschema = new Schema({
    title:{
        type:String,
        required:true,
        trim:true
    },
    subject:{
        type:String,
        required:true
    },
    description:{
        type:String
    },
    duration:{
        type:Number,
        required:true,
        default:60
    },
    totalQuestions:{
        type:Number,
        required:true
    },
    totalMarks:{
        type:Number,
        required:true
    },
    passingScore:{
        type:Number,
        required:true
    },
    difficulty:{
        type:String,
        enum:['Easy','Medium','Hard'],
        default:'Medium'
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    questions:[{
        questionText: String,
        options: [String],
        correctAnswer: String,
        marks: Number,
    }],
    status:{
        type:String,
        enum:['Draft','Active','Inactive','Closed'],
        default:'Draft'
    },
    startDate:{
        type:Date
    },
    endDate:{
        type:Date
    },
    isPublished:{
        type:Boolean,
        default:false
    },
    maxAttempts:{
        type:Number,
        default:1
    },
    showResults:{
        type:Boolean,
        default:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    updatedAt:{
        type:Date,
        default:Date.now
    }
})

const exam = mongoose.model('exam',newschema)

module.exports = exam;
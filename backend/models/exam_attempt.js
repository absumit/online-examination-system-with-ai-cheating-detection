const mongoose=require('mongoose')
const {Schema}=mongoose

const newschema = new Schema({
    examId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'exam',
        required:true
    },
    studentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    answers:[{
        questionId:mongoose.Schema.Types.ObjectId,
        questionText:String,
        selectedAnswer:[String], // Can be array of strings for multiple answers or single answer
        correctAnswer:String,
        correctAnswers:[String], // For multiple correct answers
        isCorrect:Boolean,
        marksObtained:Number,
        marks:Number
    }],
    totalMarksObtained:{
        type:Number,
        default:0
    },
    totalTime:{
        type:Number,
        default:0
    },
    totalQuestions:{
        type:Number
    },
    correctAnswers:{
        type:Number,
        default:0
    },
    wrongAnswers:{
        type:Number,
        default:0
    },
    unansweredQuestions:{
        type:Number,
        default:0
    },
    percentage:{
        type:Number,
        default:0
    },
    isPassed:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        enum:['InProgress','Submitted','Graded'],
        default:'InProgress'
    },
    startTime:{
        type:Date,
        default:Date.now
    },
    endTime:{
        type:Date
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    tabSwitches:{
        type:Number,
        default:0
    },
    isFlaggedSuspicious:{
        type:Boolean,
        default:false
    }
})

const exam_attempt = mongoose.model('exam_attempt',newschema)

module.exports = exam_attempt;

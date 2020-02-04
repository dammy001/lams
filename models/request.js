const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const requestSchema = new Schema({
    duration : {
        type : Number,
        required : true
    },
    category : {
        type : String,
        required : true
    },
    info : {
        type : String,

    },
    approval : {
        type : Number,
        required : true
    },
    userId : {
        type : Schema.Types.ObjectId,
        required : true,
        ref : 'User'
    },
    attachment : {
        type :  String,
        required : true
    },
    date : {
        type : String,
        required : true
    },
    withdraw : String
});



module.exports = mongoose.model('Request', requestSchema);
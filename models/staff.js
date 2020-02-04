const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const staffSchema = new Schema({
    email : {
        type : String,
        required : true
    },
    staffToken : {
        type : String,
        required : true
    },
    status : Boolean
});



module.exports = mongoose.model('Staff', staffSchema);
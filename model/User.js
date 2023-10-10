const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    username: { // This is the email
        type: String,
        required: true
    },
    password: {
        type: String
    },
    tour: {
        type: String,
        required: true
    },
    files: [{
        name: String,
        path: String
    }],
    isAdmin: {
        type: Boolean,
        default: false
    }
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);

const mongoose = require('mongoose');
const User = require("./model/User");

mongoose.connect("mongodb+srv://klaychop1:1234567890@cluster0.xrngmcy.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });

const adminUser = new User({
    firstname: "Klay",
    lastname: "Hopgood",
    username: "klaychop1@gmail.com",
    tour: "None",
    isAdmin: true
});

User.register(adminUser, "fish", function(err, user) {
    if (err) {
        console.log(err);
    } else {
        console.log("Admin user created");
    }
    mongoose.connection.close();
});

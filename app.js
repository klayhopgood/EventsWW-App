var express = require("express"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    User = require("./model/User"),
    multer = require('multer'),
    fs = require('fs'), // only declared once
    path = require("path"), // only declared once
    app = express();

mongoose.connect("mongodb+srv://klaychop1:1234567890@cluster0.xrngmcy.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require("express-session")({
    secret: "Rusty is a dog",
    resave: false,
    saveUninitialized: false
}));

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.isAdmin) {
        return next();
    }
    res.redirect('/');
}

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

app.use(express.static(__dirname + '/public'));

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/dashboard", isLoggedIn, function (req, res) {
    res.render("secret");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/register", function(req, res) {
    User.register(new User({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        username: req.body.username,
        tour: req.body.tour
    }), req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function() {
            res.redirect("/dashboard");
        });
    });
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login"
}), function(req, res) {});

app.get("/logout", function (req, res) {
    req.session.destroy();
    res.clearCookie('connect.sid');
    res.redirect("/");
});

app.get("/files", isLoggedIn, async function(req, res) {
    try {
        const user = await User.findOne({ username: req.user.username });
        res.render("files", { files: user.files });
    } catch (err) {
        console.error(err);
        res.redirect("/dashboard");
    }
});

app.get("/download/:filename", isLoggedIn, function(req, res) {
    const filePath = path.join(__dirname, "uploads", req.params.filename);
    res.download(filePath);
});

app.get("/admin", isLoggedIn, isAdmin, async function(req, res) {
    // Read the uploaded files from the uploads directory
    const files = fs.readdirSync(path.join(__dirname, 'uploads'));

    // Get the list of all users
    const users = await User.find({});

    // For now, we assume there's a static list of tours. This can be dynamic in a real-world scenario.
    const tours = ["Ashes2023"]; // This should be dynamic in the future.

    res.render("admin", { files: files, tours: tours, users: users });
});

app.post('/admin/distributeByUser', isLoggedIn, isAdmin, async function(req, res) {
    try {
        let selectedFiles = req.body.selectedFiles; // Use 'let' here
        if (typeof selectedFiles === "string") {
            selectedFiles = [selectedFiles];
        }
        let userNames = req.body.userNames;
        if (typeof userNames === "string") {
            userNames = [userNames];
        }

        const updates = selectedFiles.map(file => ({ name: file, path: `uploads/${file}` }));
        console.log("Updates:", updates);
        userNames.forEach(async (name) => {
            const [firstName, lastName] = name.split(' ');
            await User.updateOne({ firstname: firstName, lastname: lastName }, { $push: { files: { $each: updates } } });
        });
        res.redirect('/admin?success=true');
    } catch (err) {
        console.error(err);
        res.redirect('/admin?error=true');
    }
});


app.post('/admin/distributeByTour', isLoggedIn, isAdmin, async function(req, res) {
    try {
        const selectedFiles = Array.isArray(req.body.selectedFiles) ? req.body.selectedFiles : [req.body.selectedFiles];
        const updates = selectedFiles.map(file => ({ name: file, path: `uploads/${file}` }));

        const tours = Array.isArray(req.body.tour) ? req.body.tour : [req.body.tour];
        for (let tour of tours) {
            await User.updateMany({ tour: tour }, { $push: { files: { $each: updates } } });
        }
        res.redirect('/admin?success=true');
    } catch (err) {
        console.error(err);
        res.redirect('/admin?error=true');
    }
});

app.post("/admin/upload", upload.single('file'), function(req, res) {
    // If no file was uploaded
    if (!req.file) {
        return res.redirect('/admin?error=true&message=No file uploaded');
    }

    // Here, you can save the file details to your database or perform other logic.
    // For now, we'll just redirect back to the admin page.

    console.log('Uploaded File Details:', req.file);
    res.redirect('/admin?success=true&message=File uploaded successfully');
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
}

var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server Has Started!");
});

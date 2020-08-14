//jshint esversion:6

require('dotenv').config();

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require ("mongoose");

//for use in passport with mongoose -- note that this code must be done in order presented

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

// must be placed before db connection

app.use(session({
    secret: 'our little secret test',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB",
    { useNewUrlParser: true,
      useUnifiedTopology: true
    });

mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);  // hash and salt passwords & save users

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// serialize and desearalize are necessary to use with sessions.
passport.serializeUser(User.serializeUser());  //creates user cookie for session (user identifications)
passport.deserializeUser(User.deserializeUser());  //allows passport to open cookie and read message inside

//end of passport (specifically ordered code)

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/secrets", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.render("/login");
    }
});

app.post("/register", function(req, res) {

    //using the passportLocalMongoose is utilized here to to do user create, saving, etc.
    User.register({username: req.body.username}, req.body.password, function (err, user){
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });

});

app.post("/login", function(req, res){
    const user = new User ({
        username: req.body.username,
        password: req.body.password
    });
    console.log("user=", username);
    console.log("password=", password);
    // req.login is a passport supplied function
    req.login(user, function(err){
        if (err) {
            console.log(err);
        } else {
            // passport.authenticate validates and creates a session cookie
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});



//process.env.PORT is for heroku  5500 is local port

let port = process.env.PORT;

if (port == null || port == ""){
  port = 5500;
}

app.listen(port, function () {
  console.log ("Server started on port:  ", port);
});
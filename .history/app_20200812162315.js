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
const passport-local-mongoose = require("passport-local-mongoose");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

// must be placed before db connection

app.use(session({
    secret: 'rlittlesecrettest',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB",
    { useNewUrlParser: true,
      useUnifiedTopology: true
    });

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

userSchema.plugin(passport-local-mongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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



});






//process.env.PORT is for heroku  5500 is local port

let port = process.env.PORT;

if (port == null || port == ""){
  port = 5500;
}

app.listen(port, function () {
  console.log ("Server started on port:  ", port);
});
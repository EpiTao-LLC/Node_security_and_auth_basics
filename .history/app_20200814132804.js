//jshint esversion:6

//includes Google 0Auth2 example

require('dotenv').config();

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require ("mongoose");
const findOrCreate = require("mongoose-findorcreate");

//for use in passport with mongoose -- note that this code must be done in order presented

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;

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
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);  // hash and salt passwords & save users
userSchema.plugin(findOrCreate);  // finds or creates google authenticated 0Auth users

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// serialize and desearalize are necessary to use with sessions.
// passport.serializeUser(User.serializeUser());       //these two calls are replaced with below.  These two only handle local auth
// passport.deserializeUser(User.deserializeUser());   //bottom two are correct for local and other strategies (i.e. 0Auth / google)

passport.serializeUser(function(user, done) {   //creates user cookie for session (user identifications)
    done(null, user.id);
  });

passport.deserializeUser(function(id, done) {   //allows passport to open cookie and read message inside
    User.findById(id, function(err, user) {
      done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:5500/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {   ////REQUIRES mongoose-findorcreate
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//end of passport (specifically ordered code)

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
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
        res.render("login");
    }
});

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
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
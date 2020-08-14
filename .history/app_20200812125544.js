//jshint esversion:6

require('dotenv').config();

//for password hash
const bcrypt = require("bcrypt");
const saltRounds = 10;  //used with bcrypt to add rnd number to passwords before hash

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require ("mongoose");
// const encrypt = require('mongoose-encryption'); hashing is better
const { request } = require("express");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

mongoose.connect("mongodb://localhost:27017/userDB",
    { useNewUrlParser: true,
      useUnifiedTopology: true
    });

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

// encryption methods removed -- bcrypt w/salt and hashing is better.
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

// encrypt plugin must be added before new User created

const User = new mongoose.model("User", userSchema);


//process.env.PORT is for heroku  5500 is local port

let port = process.env.PORT;

if (port == null || port == ""){
  port = 5500;
}

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/register", function(req, res) {

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newUser = new User ({
            email:  req.body.username,
            password: hash
        });
        newUser.save(function(err) {
            if (err) {
                console.log(err);
            } else {
                res.render("secrets");
            }
        });
    });
});

app.post("/login", function(req, res){
    User.findOne({email: req.body.username}, function(err, foundUser){
       if (err) {
           console.log("login user quearyfound ERROR:  ",err);
       } else {
           if (foundUser) {
                bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
                    if (result) {
                            res.render("secrets");
                    }
                });
           }
       }
   });
});












app.listen(port, function () {
  console.log ("Server started on port:  ", port);
});
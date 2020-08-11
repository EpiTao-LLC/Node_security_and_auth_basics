//jshint esversion:6

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require ("mongoose");
const encrypt = require('mongoose-encryption');
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

const secret = "Thisisasecretstring";
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

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
    const newUser = new User ({
        email:  req.body.username,
        password: req.body.password
    });
    newUser.save(function(err) {
        if (err) {
            console.log(err);
        } else {
            res.render("secrets");
        }
    });
});

app.post("/login", function(req, res){
    User.findOne({email: req.body.username}, function(err, foundUser){
       if (err) {
           console.log(err);
       } else {
           if (foundUser) {
               if (foundUser.password === req.body.password) {
                   res.render("secrets");
               }

           }
       }
   });
});












app.listen(port, function () {
  console.log ("Server started on port:  ", port);
});
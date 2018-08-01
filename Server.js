const express = require('express')
const app = express()
var fs = require('fs');
var key = fs.readFileSync('encryption/private.key');
var cert = fs.readFileSync( 'encryption/primary.crt' );
var ca = fs.readFileSync( 'encryption/intermediate.crt' );
var https = require('https');
var SignupJS = require("./public/js/signup.js");
var LoginJS =require ("./public/js/login.js");
const bodyParser = require('body-parser');
var options = {
key: key,
cert: cert,
ca: ca
};
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/', function (req, res) {
  console.log('working');
  res.sendFile('index.html');
})
app.post('/signup',function(req, res){
  console.log('hit sign up');
  SignupJS.signup(req, res);

})
app.post('/login', function(req, res){
  console.log('hit login');
  LoginJS.login(req, res);
})
https.createServer(options, app).listen(3000);
console.log('Server started!');

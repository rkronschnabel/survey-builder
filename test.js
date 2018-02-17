var express = require('express');
var mysql = require('mysql');
var app = express();
var bodyParser = require('body-parser');
var http = require('http');
var url = require('url');
var nodemailer = require('nodemailer');
var json = require('config.json')('lib/config.json');
var fs= require('fs');
var config = JSON.parse(fs.readFileSync('lib/config.json','utf8'));
var returnedArray = new Array();
var returned = "";
var authenticated = 0;
var admininstrator = 0;
var username = "";
var userid = null;
var adminuserid = null;
var fromemail = "";
var fpemail = "";
var surveyidselection = null;
var host_address = "http://localhost:3000/"

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

var pool = mysql.createPool({
    connectionLimit : 100, //important
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database : 'surveyBuilder',
    debug    :  false
});

var emailtransporter = nodemailer.createTransport({
    service: config.emailaccount.service,
    auth: {
        user: config.emailaccount.user,
        pass: config.emailaccount.pass
    }
});

var fromemail = "eponymousryan@gmail.com";

var mailOptions = {
    from: "",
    to: "",
    subject: "",
    html: ""
};

function handle_database(req,res) {

    
}

function show_user(err,connection,res) {
    console.log("show_user");
    connection.query("select * from user",function(err,rows){
        connection.release();
        if(!err) {
            res.json(rows);
        }           
    });
}

function show_survey(err,connection,res) {
    console.log("show_survey");
    connection.query("select * from survey",function(err,rows){
        connection.release();
        if(!err) {
            res.json(rows);
        }           
    });
}

function authenticate(err,connection,res,req,callback) {
    console.log("authenticate");
    var un = req.body.username;
    var pswd = req.body.password;
    var loggedin = 0;
    var returnArray = [];
    connection.query("select * from user WHERE username=? AND password=?",[un,pswd],function(err,rows){
        connection.release();
        if(!err & rows[0] != null) {             
            console.log(rows[0]);
            if (rows[0].username == un & rows[0].password == pswd) {
                loggedin = 1;
                console.log("Logged In = " + loggedin);
                returnArray = [rows[0].userid, loggedin, rows[0].admin, rows[0].username];
                console.log("Return Array = " + returnArray);
            }   
        }    
        else {
            console.log("Logged In = " + loggedin);
            returnArray = [null, loggedin, null, null];
            console.log("Return Array = " + returnArray);
        } 
        console.log("returnArray = " + returnArray);  
        return callback(returnArray);
    });
}

function checkemail(err,connection,res,req,callback) {
    console.log("check email");
    var email = req.body.email;
    var returnVar = [];
    connection.query("select email from user WHERE email=?",[email],function(err,rows){
        connection.release();
        if(!err & rows[0] != null) {             
            console.log(rows[0]);
            if (rows[0].email == email) {
                console.log("rows[0].email = " + rows[0].email);
                returnVar = [rows[0].email];
            }   
        }    
        else {
            returnVar = [null];
        }   
        console.log("returnVar = " + returnVar);
        return callback(returnVar);
    });
}
        
/**var insert = url.parse(req.url,true).query;
var par = [insert.username, insert.password, insert.email, insert.admin];

connection.query("INSERT INTO user (username, password, email, admin) VALUES (?,?,?,?)",par,function(err,rows){
    connection.release();
    if(err) {
        res.json("Pass different params");
    }   
    if(!err) {
        res.json(rows);
    }       
});**/

function update_password(err,connection,res,req,callback) {
    console.log("update password");
    var password = req.body.password;
    var returnVar = [];
    var par = [password, email];
    connection.query("UPDATE user SET password = ? WHERE email = ?",par,function(err,rows){
        connection.release();
        if(!err) {
            returnVar = 1;
        } else {
            returnVar = 0;
        }
        return callback(returnVar);
    });
}

function createuser(err,connection,res,req,callback) {
    console.log("check user");
    var un = req.body.username;
    var pw = 'updatesoon';
    var e = req.body.email;
    if(req.body.admin == "on") {
        var a = 1;
    } else {
        var a = 0;
    }
    var returnVar = [];
    var par = [un, pw, e, a];
    connection.query("INSERT INTO user (username, password, email, admin) VALUES (?,?,?,?)",par,function(err,rows){
        connection.release();
        if(!err) {
            returnVar = 1;
        } else {
            console.log(err);
            returnVar = 0;
        }
        return callback(returnVar);
    });
}

function updateduser(err,connection,res,req,aid,callback) {
    console.log("check user");
    var un = req.body.username;
    var e = req.body.email;
    if(req.body.admin == "on") {
        var a = 1;
    } else {
        var a = 0;
    }
    var returnVar = [];
    var par = [un, e, a, aid];
    connection.query("UPDATE user (username, email, admin) VALUES (?,?,?) WHERE userid = ?",par,function(err,rows){
        connection.release();
        if(!err) {
            returnVar = 1;
        } else {
            returnVar = 0;
        }
        return callback(returnVar);
    });
}

function createsurvey(err,connection,res,req,callback) {
    console.log("check user");
    var a = req.body.alias;
    var l = 0;
    var ll = host_address + a;
    var tl = host_address + a + "?testing=1";
    var returnVar = [];
    var par = [a, l, ll, tl, userid];
    connection.query("INSERT INTO survey (surveyalias, live, livelink, testlink, userid) VALUES (?,?,?,?,?)",par,function(err,rows){
        connection.release();
        if(!err) {
            returnVar = 1;
        } else {
            console.log(err);
            returnVar = 0;
        }
        return callback(returnVar);
    });
}

function updatesurvey(err,connection,res,req,sid,callback) {
    console.log("check user");
    var a = req.body.alias;
    var sn = req.body.surveyname;
    var ll = host_address + a;
    var tl = host_address + a + "?testing=1";
    var returnVar = [];
    var par = [a, ll, tl, sid];
    connection.query("UPDATE survey (surveyalias, livelink, testlink) VALUES (?,?,?) WHERE surveyid = ?",par,function(err,rows){
        connection.release();
        if(!err) {
            returnVar = 1;
        } else {
            returnVar = 0;
        }
        return callback(returnVar);
    });
}

function show_page(fn,req,res){
    fs.readFile(fn, function(err, data) {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/html'});
            return res.end("404 Not Found" + req);
        }
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        return res.end();
    });
}

app.all("*",function(req,res){
    var taco = "taco";
    res.write(taco);
    res.write(taco);
    console.log(res);
    res.end();
});



app.listen(3000);
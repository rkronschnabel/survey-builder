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
var fromemail = "";
var fpemail = "";

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

    pool.getConnection(function(err,connection){
        if (err) {
          connection.release();
          res.json({"code" : 100, "status" : "Error in connection database"});
          return;
        }   

        console.log('connected as id ' + connection.threadId);
        
        var q = url.parse(req.url,true);
        console.log("req.url = " + req.url);  
        console.log("q.pathname = " + q.pathname);  
        var filename = "./pages" + q.pathname;
        var filenames = [];
        console.log("filename = " + filename);  

        if (q.pathname == "/"){
            if(authenticated == 0){
                filename = "./pages/login.html";
                show_page(filename,req,res);
            } else {
                filename = "./pages/dashboard.html";
                show_page(filename,req,res);
            }
        }  

        if (q.pathname == "/logout"){
            authenticated = 0;
            filename = "./pages/login.html";
            show_page(filename,req,res);
        }  

        if (q.pathname == "/forgotpassword"){
            filename = "./pages/forgotpassword.html";
            show_page(filename,req,res);
        }  

        if (q.pathname == "/sendpassword"){
            checkemail(err,connection,res,req,function(result){
                returned=result;
                if(returned != null){
                    filename = "./pages/emailsent.html";
                    mailOptions = {
                        from: fromemail,
                        to: returned,
                        subject: "Forgot Password",
                        html: 'Click <a href="http://localhost:3000/resetpassword?email=' + returned + '">here</a> to reset password.'
                    };
                    emailtransporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                    });
                } else {
                    filename = "./pages/forgotpassword.html";
                }
                show_page(filename,req,res);
            });
        }  

        if (q.pathname == "/resetpassword"){
            email = q.query.email;
            filename = "./pages/resetpassword.html"
            show_page(filename,req,res); 
        }

        if (q.pathname == "/sendnewpassword"){
            if(req.body.password == req.body.confirmpassword){
                update_password(err,connection,res,req,function(result){
                    authenticated = 0;
                    returnedArray=result;
                    if (returned == 1){
                        filename = "./pages/resetpassword.html";
                    } else {
                        filename = "./pages/success.html";          
                    }
                    show_page(filename,req,res);   
                });    
            } else {
                filename = "./pages/resetpassword.html";
                show_page(filename,req,res);   
            }       
        }

        if (q.pathname == "/login"){
            authenticate(err,connection,res,req,function(result){
                authenticated = 0;
                returnedArray=result;
                if (returnedArray[1] == 1){
                    authenticated = 1;
                    filename = "./pages/dashboard.html";
                } else {
                    filename = "./pages/login.html";          
                }
                show_page(filename,req,res);   
            });
        }
        
        if (q.pathname == "/test.html"){
            show_survey(err,connection,res);
        }
        /**connection.query("select * from user",function(err,rows){
            connection.release();
            if(!err) {
                res.json(rows);
            }           
        });**/
        
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

        connection.on('error', function(err) {      
              res.json({"code" : 100, "status" : "Error in connection database"});
              return;     
        });
  });
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
    connection.query("select username, password, userid from user WHERE username=? AND password=?",[un,pswd],function(err,rows){
        connection.release();
        if(!err & rows[0] != null) {             
            console.log(rows[0]);
            if (rows[0].username == un & rows[0].password == pswd) {
                loggedin = 1;
                console.log("Logged In = " + loggedin);
                returnArray = [rows[0].userid, loggedin];
                console.log("Return Array = " + returnArray);
            }   
        }    
        else {
            console.log("Logged In = " + loggedin);
            returnArray = [null, loggedin];
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
    handle_database(req,res);
});



app.listen(3000);
var express = require('express');
var mysql = require('mysql');
var app = express();
var bodyParser = require('body-parser');
var http = require('http');
var url = require('url');
var json = require('config.json')('lib/config.json');
var fs= require('fs');
var config = JSON.parse(fs.readFileSync('lib/config.json','utf8'));
var returnedArray = new Array();
var returned = "";
var authenticated = 0;

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
                } else {
                    filename = "./pages/forgotpassword.html";
                }
                show_page(filename,req,res);
            });
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
                returnVar = email;
            }   
        }    
        else {
            returnVar = null;
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
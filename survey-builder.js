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
var adminusername = "";
var adminemail = "";
var adminflag = null;
var fromemail = "";
var fpemail = "";
var surveyidselection = null;
var host_address = "http://localhost:3000/"
var file_server_address = "http://localhost:3001/"

http.createServer(function (req, res) {
  var q = url.parse(req.url, true);
  console.log(q);
  var css = "." + q.pathname;
  console.log(css);
  fs.readFile(css, function(err, data) {
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'});
      return res.end("404 Not Found");
    }  
    res.writeHead(200, {'Content-Type': 'text/css'});
    res.write(data);
    return res.end();
  });
}).listen(3001);

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

        alteredpath = "";

        console.log("New Entrance");
        for(i = 1; i < q.pathname.length; i++){
            console.log("q.pathname");
            console.log(q.pathname);
            alteredpath = alteredpath + q.pathname.charAt(i);
            console.log("Altered Path");
            console.log(alteredpath);
        }
        var displaysurveyid = null;
        getsurveysidbyalias(err,connection,res,req,function(result){
            returnedArray=result;
            if(returnedArray[0] != null){
                displaysurveyid = returnedArray[0].surveyid;
                if(returnedArray[0].live == 1 || q.query.testing == 1){
                    var titletag = '<title>Survey ' + alteredpath +  '</title>';
                    var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                    var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                    if(q.query.testing == 1){
                        scripting = scripting + '<script>$(document).ready(function() {$("#surveysubmit").attr("action", "/testsurveycompletion");});</script>';
                    }
                    var headercontent = '<h1>' + alteredpath +  '</h1>';
                    filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",1,"./surveytemplates" + q.pathname + ".html",1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                    readandadd(filenames,req,res,function(result){
                        res.write(result);
                        res.end();
                    }); 
                } else {
                    var titletag = '<title>Survey ' + alteredpath +  '</title>';
                    var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                    var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                    var headercontent = '<h1>' + alteredpath +  ' Survey</h1>';
                    var maincontent = '<h2>' + alteredpath +  ' is not live yet!</h2>';
                    filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                    readandadd(filenames,req,res,function(result){
                        res.write(result);
                        res.end();
                    }); 
                }
            } 
        });

        if (q.pathname == "/surveysubmit"){
            surveyidselection = q.query.surveyid;
            var keys = Object.keys(req.body);
            var keyname = "";
            var sql = 'INSERT INTO responses' + surveyidselection + ' (finishtime';
            for(i=0; i < keys.length; i++){
                console.log(keys[i]);
                sql = sql + ',';
                sql = sql + keys[i];
            }
            sql = sql + ') VALUES (NOW()';
            for(i=0; i < keys.length; i++){
                keyname = keys[i];
                console.log(keyname);
                sql = sql + ',';
                sql = sql + req.body[keyname];
            }
            sql = sql + ')';
            console.log('---------------------------------------');
            console.log('-----------SURVEYSUBMIT VARS-----------');
            console.log('---------------------------------------');
            console.log(sql);
            getsurvey(err,connection,res,req,function(result){ 
                connection.query(sql,function(err,rows){
                    if(!err) {
                        errormsg = '';
                    } else {
                        console.log(err);
                        errormsg = '<div class="errormsg"><p>Failed to create response table</p></div>';
                    }
                });
                returnedArray=result;
                if(returnedArray[0].live == 1){
                    var titletag = '<title>Survey Completed</title>';
                    var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                    var scripting = '';
                    var headercontent = '<h1>Survey Builder</h2>';
                    var errormsg = '';
                    var maincontent = errormsg + '<h2>Survey Complete</h2><p>The survey has been completed and your answers have been recorded.</p>';
                    if (returnedArray != null){
                        filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                        readandadd(filenames,req,res,function(result){
                            res.write(result);
                            res.end();
                        }); 
                    }  
                } else {
                    var titletag = '<title>Survey Is Not Live</title>';
                    var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                    var scripting = '';
                    var headercontent = '<h1>Survey Builder</h1><h2>Survey Is Not Live</h2>';
                    var errormsg = '';
                    var maincontent = errormsg + '<p>This survey is still being tested, no data was recorded.</p>';
                    if (returnedArray != null){
                        filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                        readandadd(filenames,req,res,function(result){
                            res.write(result);
                            res.end();
                        }); 
                    }  
                }
            });   
        }

        if (q.pathname == "/testsurveycompletion"){
            var titletag = '<title>Survey Is Not Live</title>';
            var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
            var scripting = '';
            var headercontent = '<h1>Survey Builder</h1><h2>Survey Is Not Live</h2>';
            var errormsg = '';
            var maincontent = errormsg + '<p>This survey is still being tested, no data was recorded.</p>';
            if (returnedArray != null){
                filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                readandadd(filenames,req,res,function(result){
                    res.write(result);
                    res.end();
                }); 
            }  
        }  

        if (q.pathname == "/"){
            if(authenticated == 0){
                var titletag = '<title>Survey Builder - Login</title>';
                var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li></ul></div>';
                var errormsg = '';
                var maincontent = errormsg + '<h2>Login</h2><form action="/login" method="post"><div><div class="nobox"><label>Name:</label><input type="text" name="username" required></div><div class="nobox"><label>Password:</label><input type="password" name="password" required></div></div><div class="formsubmit nobox"><div><button type="submit">Login</button></div><a href="/forgotpassword">Forgot Password</a></div></form>';
                if (returnedArray != null){
                    filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                    readandadd(filenames,req,res,function(result){
                        res.write(result);
                        res.end();
                    }); 
                }   
            } else {
                getsurveys(err,connection,res,req,function(result){
                    returnedArray=result;
                    var titletag = '<title>Survey Builder - Dashboard</title>';
                    var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                    var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                    var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li><li><a href="/logout">Logout</a></li></ul></div><h2>Dashboard</h2>';
                    var errormsg = '';
                    var maincontent = errormsg + '<div class="h-buttons"><a href="/admin" class="button">Admin</a></div><div class="h-buttons"><a href="/newsurvey" class="button">+ New Survey</a></div><div class="dashboardtable"><table><tr><td>Survey Name</td><td>Survey Link</td><td>Test Link</td><td>Edit</td><td>Export</td></tr>';
                    var row = "";
                    var table = "";
                    for(i = 0; i < returnedArray.length; i++){
                        row = "";
                        row = '<tr><td>' + returnedArray[i].surveyalias + '</td>';
                        if (returnedArray[i].live == 1){
                            row = row + '<td><a class="button" href="' + returnedArray[i].livelink + ' "target="_blank">Live Link</a></td>';
                            row = row + '<td><a class="button ghost" href="' + returnedArray[i].testlink + ' "target="_blank">Test Survey</a></td>';
                        } else {
                            row = row + '<td>Not Live</td>';
                            row = row + '<td><a class="button" href="' + returnedArray[i].testlink + '"target="_blank">Test Survey</a></td>';
                        }
                        row = row + '<td><a class="button" href="' + host_address + 'editsurvey?surveyid=' + returnedArray[i].surveyid + '">Edit</a></td>';
                        row = row + '<td><a class="button" href="' + host_address + 'exportsurvey?surveyid=' + returnedArray[i].surveyid + '">Export</a></td><tr>'; 
                        table = table + row;                            
                    }
                    maincontent = maincontent + table;
                    maincontent = maincontent + '</table></div>';

                    console.log(table);
                    if (returnedArray != null){
                        filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                        readandadd(filenames,req,res,function(result){
                            res.write(result);
                            res.end();
                        }); 
                    }             
                }); 
            }
        }  

        if (q.pathname == "/logout"){
            authenticated = 0;
            administrator = 0;
            username = "";
            var titletag = '<title>Survey Builder - Login</title>';
            var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
            var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
            var headercontent = '<h1>Survey Builder</h1>';
            var errormsg = '';
            var maincontent = errormsg + '<h2>Login</h2><form action="/login" method="post"><div><div class="nobox"><label>Name:</label><input type="text" name="username" required></div><div class="nobox"><label>Password:</label><input type="password" name="password" required></div></div><div class="formsubmit nobox"><div><button type="submit">Login</button></div><a href="/forgotpassword">Forgot Password</a></div></form>';
            if (returnedArray != null){
                filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                readandadd(filenames,req,res,function(result){
                    res.write(result);
                    res.end();
                }); 
            }   
        }  

        if (q.pathname == "/forgotpassword"){
            var titletag = '<title>Survey Builder - Forgot Password</title>';
            var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
            var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
            var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li></ul></div><h2>Forgot Password</h2>';
            var errormsg = '';
            var maincontent = errormsg + '<form action="/sendpassword" method="post"><div><label>Email:</label><input type="text" name="email" required></div><div class="formsubmit nobox"><div><button type="submit">Send Password</button></div></div></form>';
            if (returnedArray != null){
                filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                readandadd(filenames,req,res,function(result){
                    res.write(result);
                    res.end();
                }); 
            }   
        }  

        if (q.pathname == "/sendpassword"){
            checkemail(err,connection,res,req,function(result){
                returned=result;
                console.log(returned);
                console.log(returned[0]);
                if(returned[0] != null){
                    var titletag = '<title>Survey Builder - Email Sent</title>';
                    var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                    var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                    var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li></ul></div>';
                    var errormsg = '';
                    var maincontent = errormsg + '<h2>Email Sent</h2><p>A password reset email is on the way to ' + returned + '.</p>';
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
                    var titletag = '<title>Survey Builder - Forgot Password</title>';
                    var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                    var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                    var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li></ul></div><h2>Forgot Password</h2>';
                    var errormsg = '<div class="errormsg"><p>Please enter a valid email address.</p></div>';
                    var maincontent = errormsg + '<form action="/sendpassword" method="post"><div><label>Email:</label><input type="text" name="email" required></div><div class="formsubmit nobox"><div><button type="submit">Send Password</button></div></div></form>';
                }   
                filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"]; 
                readandadd(filenames,req,res,function(result){
                    res.write(result);
                    res.end();
                }); 
            });
        }  
        
        if (q.pathname == "/sendreset"){
            checkemail(err,connection,res,req,function(result){
                returned=result;
                console.log(returned);
                console.log(returned[0]);
                if(returned[0] != null){
                    var titletag = '<title>Survey Builder - Email Sent</title>';
                    var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                    var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                    var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li></ul></div>';
                    var errormsg = '';
                    var maincontent = errormsg + '<h2>Email Sent</h2><p>A password reset email is on the way to ' + returned + '.</p>';
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
                    var titletag = '<title>Survey Builder - Forgot Password</title>';
                    var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                    var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                    var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li></ul></div><h2>Forgot Password</h2>';
                    var errormsg = '<div class="errormsg"><p>Please enter a valid email address.</p></div>';
                    var maincontent = errormsg + '<form action="/sendpassword" method="post"><div><label>Email:</label><input type="text" name="email" required></div><div class="formsubmit nobox"><div><button type="submit">Send Password</button></div></div></form>';
                }   
                filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"]; 
                readandadd(filenames,req,res,function(result){
                    res.write(result);
                    res.end();
                }); 
            });
        }  

        if (q.pathname == "/resetpassword"){
            email = q.query.email;
            var titletag = '<title>Survey Builder - Reset Password</title>';
            var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
            var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
            var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li></ul></div><h2>Reset Password</h2>';
            var errormsg = '';
            var maincontent = errormsg + '<form action="/sendnewpassword" method="post"><div><div class="nobox"><label>Password:</label><input type="password" name="password" required></div><div class="nobox"><label>Confirm Password:</label><input type="password" name="confirmpassword" required></div></div><div class="formsubmit nobox"><div><button type="submit">Reset Password</button></div></div></form>';
            if (returnedArray != null){
                filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                readandadd(filenames,req,res,function(result){
                    res.write(result);
                    res.end();
                }); 
            }   
        }

        if (q.pathname == "/sendnewpassword"){
            if(req.body.password == req.body.confirmpassword){
                update_password(err,connection,res,req,function(result){
                    authenticated = 0;
                    returnedArray=result;
                    console.log("returned array = ");
                    console.log(returnedArray);
                    console.log(returnedArray[0]);
                    if (returnedArray == 1){
                        var titletag = '<title>Survey Builder - Login</title>';
                        var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                        var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                        var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li></ul></div>';
                        var errormsg = '<div class="errormsg"><p>Your password has been reset.</p></div>';
                        var maincontent = '<h2>Login</h2>' + errormsg + '<form action="/login" method="post"><div><div class="nobox"><label>Name:</label><input type="text" name="username" required></div><div class="nobox"><label>Password:</label><input type="password" name="password" required></div></div><div class="formsubmit nobox"><div><button type="submit">Login</button></div><a href="/forgotpassword">Forgot Password</a></div></form>';
                        if (returnedArray != null){
                            filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                            readandadd(filenames,req,res,function(result){
                                res.write(result);
                                res.end();
                            }); 
                        }      
                    } else {
                        var titletag = '<title>Survey Builder - Reset Password</title>';
                        var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                        var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                        var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li></ul></div><h2>Reset Password</h2>';
                        var errormsg = '<div class="errormsg"><p>Invalid reset password link.  Please use the link sent in your email.</p></div>';
                        var maincontent = errormsg + '<form action="/sendnewpassword" method="post"><div><div class="nobox"><label>Password:</label><input type="password" name="password" required></div><div class="nobox"><label>Confirm Password:</label><input type="password" name="confirmpassword" required></div></div><div class="formsubmit nobox"><div><button type="submit">Reset Password</button></div></div></form>';
                        if (returnedArray != null){
                            filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                            readandadd(filenames,req,res,function(result){
                                res.write(result);
                                res.end();
                            }); 
                        }        
                    }
                });    
            } else {
                var titletag = '<title>Survey Builder - Reset Password</title>';
                var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li></ul></div><h2>Reset Password</h2>';
                var errormsg = '<div class="errormsg"><p>Your password did not match your confirmation password.</p></div>';
                var maincontent = errormsg + '<form action="/sendnewpassword" method="post"><div class="nobox"><div><label>Password:</label><input type="password" name="password" required></div><div class="nobox"><label>Confirm Password:</label><input type="password" name="confirmpassword" required></div></div><div class="formsubmit nobox"><div><button type="submit">Reset Password</button></div></div></form>';
                if (returnedArray != null){
                    filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                    readandadd(filenames,req,res,function(result){
                        res.write(result);
                        res.end();
                    }); 
                }    
            }       
        }

        if (q.pathname == "/login"){
            console.log("req = " + req);
            console.log("req.body = " + req.body);
            authenticate(err,connection,res,req,function(result){
                authenticated = 0;
                returnedArray=result;
                if (returnedArray[1] == 1){
                    authenticated = 1;
                    userid=result[0];
                    administrator = result[2];
                    username = result[3];
                    getsurveys(err,connection,res,req,function(result){
                        returnedArray=result;
                        var titletag = '<title>Survey Builder - Dashboard</title>';
                        var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                        var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                        var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li><li><a href="/logout">Logout</a></li></ul></div><h2>Dashboard</h2>';
                        var errormsg = '';
                        var maincontent = errormsg + '<div class="h-buttons"><a href="/admin" class="button">Admin</a></div><div class="h-buttons"><a href="/newsurvey" class="button">+ New Survey</a></div><div class="dashboardtable"><table><tr><td>Survey Name</td><td>Survey Link</td><td>Test Link</td><td>Edit</td><td>Export</td></tr>';
                        var row = "";
                        var table = "";
                        for(i = 0; i < returnedArray.length; i++){
                            row = "";
                            row = '<tr><td>' + returnedArray[i].surveyalias + '</td>';
                            if (returnedArray[i].live == 1){
                                row = row + '<td><a class="button" href="' + returnedArray[i].livelink + ' "target="_blank">Live Link</a></td>';
                                row = row + '<td><a class="button ghost" href="' + returnedArray[i].testlink + ' "target="_blank">Test Survey</a></td>';
                            } else {
                                row = row + '<td>Not Live</td>';
                                row = row + '<td><a class="button" href="' + returnedArray[i].testlink + '"target="_blank">Test Survey</a></td>';
                            }
                            row = row + '<td><a class="button" href="' + host_address + 'editsurvey?surveyid=' + returnedArray[i].surveyid + '">Edit</a></td>';
                            row = row + '<td><a class="button" href="' + host_address + 'exportsurvey?surveyid=' + returnedArray[i].surveyid + '">Export</a></td><tr>'; 
                            table = table + row;                            
                        }
                        maincontent = maincontent + table;
                        maincontent = maincontent + '</table></div>';
    
                        console.log(table);
                        if (returnedArray != null){
                            filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                            readandadd(filenames,req,res,function(result){
                                res.write(result);
                                res.end();
                            }); 
                        }              
                    }); 
                } else {
                    var titletag = '<title>Survey Builder - Login</title>';
                    var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                    var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                    var headercontent = '<h1>Survey Builder</h1>';
                    var errormsg = '<div class="errormsg"><p>Please enter the correct username and password.</p></div>';
                    var maincontent = '<h2>Login</h2>' + errormsg + '<form action="/login" method="post"><div><div class="nobox"><label>Name:</label><input type="text" name="username" required></div><div class="nobox"><label>Password:</label><input type="password" name="password" required></div></div><div class="formsubmit nobox"><div><button type="submit">Login</button></div><a href="/forgotpassword">Forgot Password</a></div></form>';
                    if (returnedArray != null){
                        filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                        readandadd(filenames,req,res,function(result){
                            res.write(result);
                            res.end();
                        }); 
                    }        
                }
            });
        }

        if (q.pathname == "/admin"){
            var titletag = '<title>Survey Builder - Admin</title>';
            var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
            var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
            var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li><li><a href="/logout">Logout</a></li></ul></div><h2>Admin</h2>';
            var errormsg = '';
            if (administrator == 1){
                var maincontent = errormsg + '<ul><li><a href="/adduser">Add User</a></li><li><a href="/edituser">Edit User</a></li><li><a href="/deleteresponse">Delete Response</a></li><li><a href="/deletesurvey">Delete Survey</a></li></ul>';
            } else {
                var maincontent = errormsg + '<ul><li><a href="/deleteresponse">Delete Response</a></li><li><a href="/deletesurvey">Delete Survey</a></li></ul>';
            }
            if (returnedArray != null){
                filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                readandadd(filenames,req,res,function(result){
                    res.write(result);
                    res.end();
                }); 
            }       
        }

        /** NOT FINAL **/

        if (q.pathname == "/adduser"){
            adminuserid = null;
            var titletag = '<title>Survey Builder - User</title>';
            var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
            var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
            var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li><li><a href="/logout">Logout</a></li></ul></div><h2>User Configuration</h2>';
            var errormsg = '';
            var maincontent = errormsg + '<form action="/userupdate" method="post"><div><div class="nobox"><label>Username:</label><input type="text" name="username" required></div><div class="nobox"><label>Email Address:</label><input type="text" name="email" required></div><div class="nobox"><label>Admin</label><input type="checkbox" name="admin"></div></div><div class="formsubmit nobox"><a href="/sendreset">Reset Password</a></div><div class="formsubmit nobox"><div><button type="submit">Save</button></div></div></form>';
            if (returnedArray != null){
                filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                readandadd(filenames,req,res,function(result){
                    res.write(result);
                    res.end();
                }); 
            } 
        }

        if (q.pathname == "/userupdate"){
            console.log("Admin User Id = " + adminuserid)
            if (adminuserid == null) {
                createuser(err,connection,res,req,function(result){
                    returned=result;
                    if (returned == 1){
                        var titletag = '<title>Survey Builder - Admin</title>';
                        var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                        var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                        var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li><li><a href="/logout">Logout</a></li></ul></div><h2>Admin</h2>';
                        var errormsg = '<div class="errormsg"><p>User has been created.</p></div>';
                        if (administrator == 1){
                            var maincontent = errormsg + '<ul><li><a href="/adduser">Add User</a></li><li><a href="/edituser">Edit User</a></li><li><a href="/deleteresponse">Delete Response</a></li><li><a href="/deletesurvey">Delete Survey</a></li></ul>';
                        } else {
                            var maincontent = errormsg + '<ul><li><a href="/deleteresponse">Delete Response</a></li><li><a href="/deletesurvey">Delete Survey</a></li></ul>';
                        }  
                    } else {
                        adminuserid = null;
                        var titletag = '<title>Survey Builder - User</title>';
                        var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                        var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                        var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li><li><a href="/logout">Logout</a></li></ul></div><h2>User Configuration</h2>';
                        var errormsg = '<div class="errormsg"><p>Username creation failed.</p></div>';
                        var maincontent = errormsg + '<form action="/userupdate" method="post"><div><div class="nobox"><label>Username:</label><input type="text" name="username" required></div><div class="nobox"><label>Email Address:</label><input type="text" name="email" required></div><div class="nobox"><label>Admin</label><input type="checkbox" name="admin"></div></div><div class="formsubmit nobox"><a href="/sendreset">Reset Password</a></div><div class="formsubmit nobox"><div><button type="submit">Save</button></div></div></form>';
                    }
                    if (returnedArray != null){
                        filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                        readandadd(filenames,req,res,function(result){
                            res.write(result);
                            res.end();
                        }); 
                    }  

                });
            } else {
                updateuser(err,connection,res,req,function(result){
                    returnedArray=result;
                    if (returnedArray == 1){
                        var titletag = '<title>Survey Builder - Admin</title>';
                        var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                        var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                        var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li><li><a href="/logout">Logout</a></li></ul></div><h2>Admin</h2>';
                        var errormsg = '<div class="errormsg"><p>User has been updated.</p></div>';
                        if (administrator == 1){
                            var maincontent = errormsg + '<ul><li><a href="/adduser">Add User</a></li><li><a href="/edituser">Edit User</a></li><li><a href="/deleteresponse">Delete Response</a></li><li><a href="/deletesurvey">Delete Survey</a></li></ul>';
                        } else {
                            var maincontent = errormsg + '<ul><li><a href="/deleteresponse">Delete Response</a></li><li><a href="/deletesurvey">Delete Survey</a></li></ul>';
                        }
                    } else {
                        adminuserid = null;
                        var titletag = '<title>Survey Builder - User</title>';
                        var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                        var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                        var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li><li><a href="/logout">Logout</a></li></ul></div><h2>User Configuration</h2>';
                        var errormsg = '<div class="errormsg"><p>Username update failed.</p></div>';
                        var maincontent = errormsg + '<form action="/userupdate" method="post"><div><div class="nobox"><label>Username:</label><input type="text" name="username" required></div><div class="nobox"><label>Email Address:</label><input type="text" name="email" required></div><div class="nobox"><label>Admin</label><input type="checkbox" name="admin"></div></div><div class="formsubmit nobox"><a href="/sendreset">Reset Password</a></div><div class="formsubmit nobox"><div><button type="submit">Save</button></div></div></form>';
                    }
                    if (returnedArray != null){
                        filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                        readandadd(filenames,req,res,function(result){
                            res.write(result);
                            res.end();
                        }); 
                    }  
                });
            }
        }

        if (q.pathname == "/edituser") { 
            getallusers(err,connection,res,req,function(result){
                returnedArray=result;
                var titletag = '<title>Survey Builder - Edit User</title>';
                var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li><li><a href="/logout">Logout</a></li></ul></div><h2>Edit User</h2>';
                var errormsg = '';
                var maincontent = errormsg + '<form action="/chooseuser" method="post"><div><select name="user">';                
                var option = "";
                var options = "";
                for(i = 0; i < returnedArray.length; i++){
                    option = "";
                    option = '<option value=' + returnedArray[i].userid + '>' + returnedArray[i].username + '</option>';
                    options = options + option;                            
                }
                maincontent = maincontent + options;
                maincontent = maincontent + '</select></div><div class="formsubmit nobox"><div><button type="submit">Edit</button></div></div></form>';
                if (returnedArray != null){
                    filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                    readandadd(filenames,req,res,function(result){
                        res.write(result);
                        res.end();
                    }); 
                }             
            }); 
        }

        if (q.pathname == "/chooseuser"){
            console.log("req.body.user = " + req.body.user);
            getuser(err,connection,res,req,function(result){
                returnedArray=result;
                console.log("result = ");
                console.log(result);
                console.log(result[0]);
                adminuserid = null;
                var titletag = '<title>Survey Builder - User</title>';
                var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li><li><a href="/logout">Logout</a></li></ul></div><h2>User Configuration</h2>';
                var errormsg = '';
                adminemail = returnedArray[0].email;
                adminuserid = returnedArray[0].userid;
                if(returnedArray[0].admin == 1) {
                    var maincontent = errormsg + '<form action="/userupdate" method="post"><div><div class="nobox"><label>Username:</label><input value="' + returnedArray[0].username + '" type="text" name="username" required></div><div class="nobox"><label>Email Address:</label><input value="' + returnedArray[0].email + '" type="text" name="email" required></div><div class="nobox"><label>Admin</label><input type="checkbox" name="admin" checked></div></div><div class="formsubmit nobox"><a href="/sendreset">Reset Password</a></div><div class="formsubmit nobox"><div><button type="submit">Save</button></div></div></form>';
                } else {
                    var maincontent = errormsg + '<form action="/userupdate" method="post"><div><div class="nobox"><label>Username:</label><input value="' + returnedArray[0].username + '" type="text" name="username" required></div><div class="nobox"><label>Email Address:</label><input value="' + returnedArray[0].email + '" type="text" name="email" required></div><div class="nobox"><label>Admin</label><input type="checkbox" name="admin"></div></div><div class="formsubmit nobox"><a href="/sendreset">Reset Password</a></div><div class="formsubmit nobox"><div><button type="submit">Save</button></div></div></form>';
                }
                if (returnedArray != null){
                    filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                    readandadd(filenames,req,res,function(result){
                        res.write(result);
                        res.end();
                    }); 
                }             
            }); 
        }

        if (q.pathname == "/deleteresponse") { 
            getsurveys(err,connection,res,req,function(result){
                returnedArray=result;
                var titletag = '<title>Survey Builder - Choose Survey</title>';
                var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li><li><a href="/logout">Logout</a></li></ul></div><h2>Choose Survey</h2>';
                var errormsg = '';
                var maincontent = errormsg + '<form action="/choosesurveydeleteresponseid" method="post"><div><select name="survey">';                
                var option = "";
                var options = "";
                for(i = 0; i < returnedArray.length; i++){
                    option = "";
                    option = '<option value=' + returnedArray[i].surveyid + '>' + returnedArray[i].surveyalias + '</option>';
                    options = options + option;                            
                }
                maincontent = maincontent + options;
                maincontent = maincontent + '</select></div><div class="formsubmit nobox"><div><button type="submit">Next</button></div></div></form>';
                if (returnedArray != null){
                    filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                    readandadd(filenames,req,res,function(result){
                        res.write(result);
                        res.end();
                    }); 
                }             
            }); 
        }

        

        if (q.pathname == "/choosesurveydeleteresponseid") { 
            surveyidselection = req.body.survey; 
            var titletag = '<title>Survey Builder - Delete Responses</title>';
            var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
            var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
            var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li><li><a href="/logout">Logout</a></li></ul></div><h2>Delete Responses</h2>';
            var errormsg = '';
            var maincontent = errormsg + '<form action="/deleteresponseids" method="post"><div><label>Enter responseid\'s seperated by a comma:</label><textarea cols="40" rows="5" name="responseids"></textarea></div><div class="formsubmit nobox"><div><button type="submit">Save</button></div></div></form>';
            if (returnedArray != null){
                filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                readandadd(filenames,req,res,function(result){
                    res.write(result);
                    res.end();
                }); 
            }   
        }

        if (q.pathname == "/deleteresponseids"){
            deleteresponses(err,connection,res,req,function(result){
                returnedArray=result;
                var titletag = '<title>Survey Builder - Admin</title>';
                var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li><li><a href="/logout">Logout</a></li></ul></div><h2>Admin</h2>';
                var errormsg = '<div class="errormsg"><p>Responses have been deleted.</p></div>';
                if (administrator == 1){
                    var maincontent = errormsg + '<ul><li><a href="/adduser">Add User</a></li><li><a href="/edituser">Edit User</a></li><li><a href="/deleteresponse">Delete Response</a></li><li><a href="/deletesurvey">Delete Survey</a></li></ul>';
                } else {
                    var maincontent = errormsg + '<ul><li><a href="/deleteresponse">Delete Response</a></li><li><a href="/deletesurvey">Delete Survey</a></li></ul>';
                }
                if (returnedArray != null){
                    filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                    readandadd(filenames,req,res,function(result){
                        res.write(result);
                        res.end();
                    }); 
                }             
            }); 
        }

        if (q.pathname == "/deletesurvey"){
            getsurveys(err,connection,res,req,function(result){
                returnedArray=result;
                var titletag = '<title>Survey Builder - Choose Survey</title>';
                var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li><li><a href="/logout">Logout</a></li></ul></div><h2>Choose Survey</h2>';
                var errormsg = '';
                var maincontent = errormsg + '<form action="/sendsurveydeletion" method="post"><div><select name="survey">';                
                var option = "";
                var options = "";
                for(i = 0; i < returnedArray.length; i++){
                    option = "";
                    option = '<option value=' + returnedArray[i].surveyid + '>' + returnedArray[i].surveyalias + '</option>';
                    options = options + option;                            
                }
                maincontent = maincontent + options;
                maincontent = maincontent + '</select></div><div class="formsubmit nobox"><div><button type="submit">DELETE</button></div></div></form>';
                if (returnedArray != null){
                    filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                    readandadd(filenames,req,res,function(result){
                        res.write(result);
                        res.end();
                    }); 
                }             
            }); 
        }

        if (q.pathname == "/sendsurveydeletion"){
            surveyidselection = req.body.survey;
            deletesurvey(err,connection,res,req,function(result){
                returnedArray=result;
                var errormsg = '';
                var sqlstr = 'DROP TABLE IF EXISTS responses' + surveyidselection;
                connection.query(sqlstr,function(err,rows){
                    if(!err) {             
                        errormsg = '';
                    }    
                    else {
                        console.log(err);
                        errormsg = '<div class="errormsg"><p>Failed to delete response table</p></div>';
                    }   
                });                
                var titletag = '<title>Survey Builder - Admin</title>';
                var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
                var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li><li><a href="/logout">Logout</a></li></ul></div><h2>Admin</h2>';
                errormsg = errormsg + '<div class="errormsg"><p>Survey has been deleted.</p></div>';
                if (administrator == 1){
                    var maincontent = errormsg + '<ul><li><a href="/adduser">Add User</a></li><li><a href="/edituser">Edit User</a></li><li><a href="/deleteresponse">Delete Response</a></li><li><a href="/deletesurvey">Delete Survey</a></li></ul>';
                } else {
                    var maincontent = errormsg + '<ul><li><a href="/deleteresponse">Delete Response</a></li><li><a href="/deletesurvey">Delete Survey</a></li></ul>';
                }
                if (returnedArray != null){
                    filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                    readandadd(filenames,req,res,function(result){
                        res.write(result);
                        res.end();
                    }); 
                }             
            }); 
        }

        if (q.pathname == "/editsurvey"){
            surveyidselection = q.query.surveyid;
            if (returnedArray != null){
                filenames = [1,"./surveytemplates/surveybuilder" + surveyidselection + ".html"];     
                readandadd(filenames,req,res,function(result){
                    res.write(result);
                    res.end();
                }); 
            }    
        }

        if (q.pathname == "/exportsurvey"){
            surveyidselection = q.query.surveyid;
            getsurveyresults(err,connection,res,req,function(result){
                console.log('getsurveyresults finished!');
                var content="";
                var responsefilename = 'results' + surveyidselection + '.txt';
                var exportfile = './tmp/' + responsefilename;
                var downloadfilepath = '/tmp/' + responsefilename;
                console.log("result = ");
                console.log(result);
                console.log(result[0]);
                if (result[0] != null){
                    returnedArray=result;
                    var keys = Object.keys(returnedArray[0]);
                    var row = "";
                    var keyname = "";
                    keyname = keys[0];
                    for(k = 0; k < keys.length; k++){
                        keyname = keys[k];
                        row = row + keyname;
                        if(k != (keys.length - 1)){
                            row = row + '\t';
                        }

                    }
                    row = row + '\n';
                    content = content + row;
                    row = "";
                    for(i = 0; i < returnedArray.length; i++){
                        for(x = 0; x < keys.length; x++){
                            keyname = keys[x];
                            row = row + returnedArray[i][keyname];
                            if(x != (keys.length - 1)){
                                row = row + '\t';
                            }
                        }
                        row = row + '\n';
                        content = content + row;
                        row = "";
                    }
                } else { 
                    content = "No data yet";
                }
                
                fs.writeFile(exportfile, content, function (err) {
                    if (err) throw err;
                    console.log('Saved!');
                    fs.exists(exportfile, function(exists){
                        console.log('exists finished!');
                        if(exists){
                        res.writeHead(200, {
                        "Content-Type": "application/octet-stream",
                        "Content-Disposition": "attachment; filename=" + responsefilename
                        });
                        res.write(content);
                        res.end();
                        } else {
                            res.writeHead(400, {"Content-Type": "text/plain"});
                            res.end("ERROR File does not exist");
                          }
                    });
                  }); 
            }); 
        }

        if (q.pathname == "/newsurvey"){
            surveyidselection = null; 
            var titletag = '<title>Survey Builder - Survey Configuration</title>';
            var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
            var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>' + '<script>var qtagcounter = 0;var rocounter = 0;var idname = "";$(document).ready(function() {$("button[name=\'addelement\']").on("click", function(event){rocounter = 0;qtagcounter++;rocounter++;idname = "#container";var question = $(\'<div id="question\' + qtagcounter + \'" class="qlabel"><h3>Question \' + qtagcounter + \'</h3><input type="text" name="q\' + qtagcounter + \'" placeholder="Question \' + qtagcounter + \' text" required><div id="responseoption\' + qtagcounter + \'_\' + rocounter + \'" class="responseoptions"><input type="text" name="o\' + qtagcounter + \'_\' + rocounter + \'" placeholder="Option \' + rocounter + \' text" required></div></div>\');console.log(question);$("#container").append(question);rocounter++;idname = "#question" + qtagcounter;question = $(\'<div id="responseoption\' + qtagcounter + \'_\' + rocounter + \'" class="responseoptions"><input type="text" name="o\' + qtagcounter + \'_\' + rocounter + \'" placeholder="Option \' + rocounter + \' text" required></div></div>\');console.log(question);$(idname).append(question);idname = "#container";question = $(\'<div id="questionbutton\' + qtagcounter + \'_\' + rocounter + \'" class="questionbutton"><button value="generate new element" name="addro" type="button">Add Option</button></div>\');console.log(question);$(idname).append(question);});$("#container").on("click",\'button\', function(event){rocounter++;idname = "#question" + qtagcounter;question = $(\'<div id="responseoption\' + qtagcounter + \'_\' + rocounter + \'" class="responseoptions"><input type="text" name="o\' + qtagcounter + \'_\' + rocounter + \'" placeholder="Option \' + rocounter + \' text" required></div></div>\');console.log(question);$(idname).append(question);});});</script>';
            var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li><li><a href="/logout">Logout</a></li></ul></div><h2>Survey Configuration</h2>';
            var errormsg = '';
            var maincontent = errormsg + '<form action="/surveyupdate" method="post"><div><div class="nobox"><label for="alias">Survey Name:</label><input type="text" name="alias" required></div><div class="nobox"><label for="makelive">Check to turn survey live (Click save to enable)</label><input type="checkbox" name="live" id="makelive" value="live" disabled></div></div><div id="container"></div><div id="surveycreationnav" class="formsubmit nobox"><button name="addelement" type="button">Add Question</button></div><div class="formsubmit nobox"><div><button type="submit">Save</button></div></div></form>';
            if (returnedArray != null){
                filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                readandadd(filenames,req,res,function(result){
                    res.write(result);
                    res.end();
                }); 
            }   
        }

        if (q.pathname == "/surveyupdate"){
            console.log(req.body);
            console.log('---------length---------');
            console.log(Object.keys(req.body).length);
            var headercontent = '<h1>Survey Builder</h1><div class="nav"><ul><li><a href="/">Home</a></li><li><a href="/logout">Logout</a></li></ul></div><h2>Survey Configuration</h2>';
            var headercontentsurvey = '<h1>Survey</h1>';
            var titletagsurvey = '<title>Survey</title>';
            var titletag = '<title>Survey Builder - Survey Configuration</title>';
            var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
            var keys = Object.keys(req.body);
            var keyname = "";
            keyname = keys[0];
            var firstchar = "";
            console.log('---------keyname---------');
            console.log(keyname);
            console.log('---------length---------');
            console.log(keyname.length);
            var questionarray = [];
            var arraycounter = 0;
            var optioncounter = 0;
            var questionscontent = "";
            var questionname = "";
            surveyscontent = "";
            for(i = 0; i < keys.length; i++){
                keyname=keys[i];
                console.log(keyname);
                firstchar = keyname.charAt(0);
                if(firstchar==='q'){
                    questionarray[arraycounter] = keyname;
                    if(arraycounter != 0){
                        questionscontent = questionscontent + '</div>\n';
                        surveyscontent = surveyscontent + '</fieldset>\n</div>\n';
                    }
                    questionscontent = questionscontent + '<div id="' + (arraycounter + 1) + '" class="qlabel">\n';
                    questionscontent = questionscontent + '<h3>Question ' + (arraycounter + 1) + '</h3>\n';
                    questionscontent = questionscontent + '<input type="text" name="q' + (arraycounter + 1) + '" value="' + req.body[keyname] + '" required>\n';
                    surveyscontent = surveyscontent + '<div class="questionbox">\n<fieldset>\n<legend>' + req.body[keyname] + '</legend>';
                    
                    questionname = keyname;
                    arraycounter++;
                    optioncounter = 0;
                }
                if(firstchar==='o'){
                    optioncounter++
                    questionscontent = questionscontent + '<div id="responseoption' + (arraycounter + 1) + '_' + optioncounter + '" class="responseoptions">\n';
                    questionscontent = questionscontent + '<input type="text" name="' + keyname + '" value="' + req.body[keyname] + '" required">\n';
                    questionscontent = questionscontent + '</div>\n';
                    surveyscontent = surveyscontent + '<label for="' + keyname + '">' + req.body[keyname] + '\n';
                    surveyscontent = surveyscontent + '<input type="radio" name="' + questionname + '" id="' + keyname + '" value="' + optioncounter + '"></label>\n';

                }
            }
            questionscontent = questionscontent + '</div>\n';
            surveyscontent = surveyscontent + '</fieldset>\n</div>\n';
            /**var addoptionbutton = '';
            addoptionbutton = addoptionbutton + '<div id="questionbutton' + arraycounter + '_' + optioncounter + '" class="questionbutton">\n';
            addoptionbutton = addoptionbutton + '<button value="" name="addro" type="button">Add Option</button>\n';
            addoptionbutton = addoptionbutton + '</div>\n';**/


            console.log('---------questioncontent---------');
            console.log(questionscontent);
            console.log('---------questionarray---------');
            console.log(questionarray);
            console.log('---------surveyscontent---------');
            console.log(surveyscontent);
            var titletag = '<title>Survey Builder - Survey Configuration</title>';
            var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
            var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>' + '<script>var qtagcounter = ' + arraycounter + ';var rocounter = ' + optioncounter + ';var idname = "";$(document).ready(function() {$("button[name=\'addelement\']").on("click", function(event){rocounter = 0;qtagcounter++;rocounter++;idname = "#container";var question = $(\'<div id="question\' + qtagcounter + \'" class="qlabel"><h3>Question \' + qtagcounter + \'</h3><input type="text" name="q\' + qtagcounter + \'" placeholder="Question \' + qtagcounter + \' text" required><div id="responseoption\' + qtagcounter + \'_\' + rocounter + \'" class="responseoptions"><input type="text" name="o\' + qtagcounter + \'_\' + rocounter + \'" placeholder="Option \' + rocounter + \' text" required></div></div>\');console.log(question);$("#container").append(question);rocounter++;idname = "#question" + qtagcounter;question = $(\'<div id="responseoption\' + qtagcounter + \'_\' + rocounter + \'" class="responseoptions"><input type="text" name="o\' + qtagcounter + \'_\' + rocounter + \'" placeholder="Option \' + rocounter + \' text" required></div></div>\');console.log(question);$(idname).append(question);idname = "#container";question = $(\'<div id="questionbutton\' + qtagcounter + \'_\' + rocounter + \'" class="questionbutton"><button value="generate new element" name="addro" type="button">Add Option</button></div>\');console.log(question);$(idname).append(question);});$("#container").on("click",\'button\', function(event){rocounter++;idname = "#question" + qtagcounter;question = $(\'<div id="responseoption\' + qtagcounter + \'_\' + rocounter + \'" class="responseoptions"><input type="text" name="o\' + qtagcounter + \'_\' + rocounter + \'" placeholder="Option \' + rocounter + \' text" required></div></div>\');console.log(question);$(idname).append(question);});});</script>';
            console.log('---------------------------------------');
            console.log('---------------SCRIPTING---------------');
            console.log('---------------------------------------');
            console.log(scripting);
            if (surveyidselection == null) {
                createsurvey(err,connection,res,req,function(result){
                    returned=result;
                    if (returned != null){
                        surveyidselection = returned[0].insertId;
                        var filename = 'surveybuilder' + surveyidselection + '.html';
                        var exportfile = './surveytemplates/' + filename;
                        var tablename = "responses" + surveyidselection;
                        var errormsg = '';
                        var parameters = []
                        var sql = 'CREATE TABLE ' + tablename + '(responseid INT AUTO_INCREMENT PRIMARY KEY, starttime DATETIME DEFAULT CURRENT_TIMESTAMP, finishtime DATETIME, lastmod DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, surveyid INT NOT NULL DEFAULT ' + userid;
                        for(i = 0; i < arraycounter; i++){
                            sql = sql + ', ' + questionarray[i] + ' INT';
                        }
                        sql = sql + ')';
                        connection.query(sql,function(err,rows){
                            if(!err) {
                                errormsg = '';
                            } else {
                                console.log(err);
                                errormsg = '<div class="errormsg"><p>Failed to create response table</p></div>';
                            }
                        });
                        getsurvey(err,connection,res,req,function(result){
                            returnedArray=result;
                            var titletag = '<title>Survey Builder - Survey Configuration</title>';
                            var cssfiles = '<link rel="stylesheet" href="' + file_server_address + 'css/surveybuilder.css">';
                            var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>' + '<script>var qtagcounter = ' + arraycounter + ';var rocounter = ' + optioncounter + ';var idname = "";$(document).ready(function() {$("button[name=\'addelement\']").on("click", function(event){rocounter = 0;qtagcounter++;rocounter++;idname = "#container";var question = $(\'<div id="question\' + qtagcounter + \'" class="qlabel"><h3>Question \' + qtagcounter + \'</h3><input type="text" name="q\' + qtagcounter + \'" placeholder="Question \' + qtagcounter + \' text" required><div id="responseoption\' + qtagcounter + \'_\' + rocounter + \'" class="responseoptions"><input type="text" name="o\' + qtagcounter + \'_\' + rocounter + \'" placeholder="Option \' + rocounter + \' text" required></div></div>\');console.log(question);$("#container").append(question);rocounter++;idname = "#question" + qtagcounter;question = $(\'<div id="responseoption\' + qtagcounter + \'_\' + rocounter + \'" class="responseoptions"><input type="text" name="o\' + qtagcounter + \'_\' + rocounter + \'" placeholder="Option \' + rocounter + \' text" required></div></div>\');console.log(question);$(idname).append(question);idname = "#container";question = $(\'<div id="questionbutton\' + qtagcounter + \'_\' + rocounter + \'" class="questionbutton"><button value="generate new element" name="addro" type="button">Add Option</button></div>\');console.log(question);$(idname).append(question);});$("#container").on("click",\'button\', function(event){rocounter++;idname = "#question" + qtagcounter;question = $(\'<div id="responseoption\' + qtagcounter + \'_\' + rocounter + \'" class="responseoptions"><input type="text" name="o\' + qtagcounter + \'_\' + rocounter + \'" placeholder="Option \' + rocounter + \' text" required></div></div>\');console.log(question);$(idname).append(question);});});</script>';
                            var filenamesurvey = returnedArray[0].surveyalias + '.html';
                            var exportfilesurvey = './surveytemplates/' + filenamesurvey;
                            var maincontentsurvey = '<form id="surveysubmit" action="/surveysubmit?surveyid=' + surveyidselection + '" method="post"><div id="surveycontainer">' + surveyscontent + '</div><div class="formsubmit nobox"><div><button type="submit">Submit Survey</button></div></div></form>';
                            errormsg = errormsg + '<div class="errormsg"><p>Survey created!</p></div>';
                            var maincontent = errormsg + '<form action="/surveyupdate" method="post"><div><div class="nobox"><label for="alias">Survey Name:</label><input type="text" name="alias" value="' + returnedArray[0].surveyalias + '" required></div><div class="nobox"><label for="makelive">Check to turn survey live</label><input type="checkbox" name="live" id="makelive" value="1"></div></div><div id="container">' + questionscontent + '</div><div id="surveycreationnav" class="formsubmit nobox"><button name="addelement" type="button">Add Question</button></div><div class="formsubmit nobox"><div><button type="submit">Save</button></div></div></form>';
                            fs.writeFile(exportfilesurvey, maincontentsurvey, function (err) {
                                if (err) throw err;
                                console.log('Survey file written!');
                            });

                            if (returnedArray != null){
                                filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                                readandadd(filenames,req,res,function(result){
                                    fs.writeFile(exportfile, result, function (err) {
                                        if (err) throw err;
                                        console.log('File written!');
                                    });
                                    console.log('---------------------------------------');
                                    console.log('------------SCRIPTING WRITE------------');
                                    console.log('---------------------------------------');
                                    console.log(scripting);
                                    res.write(result);
                                    res.end();
                                }); 
                            }        
                        }); 
                    } else {
                        var scripting = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>' + '<script>var qtagcounter = 0;var rocounter = 0;var idname = "";$(document).ready(function() {$("button[name=\'addelement\']").on("click", function(event){rocounter = 0;qtagcounter++;rocounter++;idname = "#container";var question = $(\'<div id="question\' + qtagcounter + \'" class="qlabel"><h3>Question \' + qtagcounter + \'</h3><input type="text" name="q\' + qtagcounter + \'" placeholder="Question \' + qtagcounter + \' text" required><div id="responseoption\' + qtagcounter + \'_\' + rocounter + \'" class="responseoptions"><input type="text" name="o\' + qtagcounter + \'_\' + rocounter + \'" placeholder="Option \' + rocounter + \' text" required></div></div>\');console.log(question);$("#container").append(question);rocounter++;idname = "#question" + qtagcounter;question = $(\'<div id="responseoption\' + qtagcounter + \'_\' + rocounter + \'" class="responseoptions"><input type="text" name="o\' + qtagcounter + \'_\' + rocounter + \'" placeholder="Option \' + rocounter + \' text" required></div></div>\');console.log(question);$(idname).append(question);idname = "#container";question = $(\'<div id="questionbutton\' + qtagcounter + \'_\' + rocounter + \'" class="questionbutton"><button value="generate new element" name="addro" type="button">Add Option</button></div>\');console.log(question);$(idname).append(question);});$("#container").on("click",\'button\', function(event){rocounter++;idname = "#question" + qtagcounter;question = $(\'<div id="responseoption\' + qtagcounter + \'_\' + rocounter + \'" class="responseoptions"><input type="text" name="o\' + qtagcounter + \'_\' + rocounter + \'" placeholder="Option \' + rocounter + \' text" required></div></div>\');console.log(question);$(idname).append(question);});});</script>';
                        var errormsg = '<div class="errormsg"><p>Survey creation failed, try a different Name.</p></div>';
                        var maincontent = errormsg + '<form action="/surveyupdate" method="post"><div><div class="nobox"><label for="alias">Survey Name:</label><input type="text" name="alias" required></div><div class="nobox"><label for="makelive">Check to turn survey live</label></div><input type="checkbox" name="live" id="makelive" value="1"></div><div id="container"></div><div id="surveycreationnav" class="formsubmit nobox"><button name="addelement" type="button">Add Question</button></div><div class="formsubmit nobox"><div><button type="submit">Save</button></div></div></form>';
                        if (returnedArray != null){
                            filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                            readandadd(filenames,req,res,function(result){
                                res.write(result);
                                res.end();
                            }); 
                        }  
                    }
                });
            } else {
                updatesurvey(err,connection,res,req,function(result){
                    returned=result;
                    var filename = 'surveybuilder' + surveyidselection + '.html';
                    var exportfile = './surveytemplates/' + filename;
                    if (returned == 1){
                        var sql = 'SHOW FIELDS FROM surveybuilder.responses' + surveyidselection;
                        connection.query(sql,function(err,rows){
                            if(!err) {
                                errormsg = '';
                                console.log('-------------------------------------');
                                console.log('---------------FIELDS----------------');
                                console.log('-------------------------------------');
                                console.log(rows);
                                console.log(rows.length);
                                console.log(rows[0].Field);
                                var tableflag = 0;
                                for(i = 0; i < arraycounter; i++){
                                    for(x = 0; x < rows.length; x++){
                                        if(rows[x].Field == questionarray[i]){
                                            tableflag = 1;
                                        }
                                    }
                                    if(tableflag == 0){
                                        console.log(questionarray);
                                        console.log(questionarray[i]);
                                        var sql = 'ALTER TABLE responses' + surveyidselection + ' ADD ' + questionarray[i] + ' INT';
                                        console.log('-------------------------------------');
                                        console.log('---------------SQL-------------------');
                                        console.log('-------------------------------------');
                                        console.log(sql);
                                        connection.query(sql,function(err,rows){
                                            if(!err) {
                                                errormsg = '';
                                            } else {
                                                console.log(err);
                                                errormsg = '<div class="errormsg"><p>Failed to create response table</p></div>';
                                            }
                                        });
                                    }
                                    tableflag = 0;
                                }
                            } else {
                                console.log(err);
                                errormsg = '<div class="errormsg"><p>Failed to get FIELDS</p></div>';
                            }
                        });
                        
                        getsurvey(err,connection,res,req,function(result){
                            returnedArray=result;
                            var filenamesurvey = returnedArray[0].surveyalias + '.html';
                            var exportfilesurvey = './surveytemplates/' + filenamesurvey;
                            var maincontentsurvey = '<form id="surveysubmit" action="/surveysubmit?surveyid=' + surveyidselection + '" method="post"><div id="surveycontainer">' + surveyscontent + '</div><div class="formsubmit nobox"><div><button type="submit">Submit Survey</button></div></div></form>';
                            var errormsg = '<div class="errormsg"><p>Survey updated!</p></div>';
                            if(returnedArray[0].live == 1) {
                                var maincontent = errormsg + '<form action="/surveyupdate" method="post"><div><div class="nobox"><label for="alias">Survey Name:</label><input type="text" name="alias" value="' + returnedArray[0].surveyalias + '" required></div><div class="nobox"><label for="makelive">Check to turn survey live</label><input type="checkbox" name="live" id="makelive" value="1" checked></div></div><div id="container">' + questionscontent + '</div><div id="surveycreationnav" class="formsubmit nobox"><button name="addelement" type="button">Add Question</button></div><div class="formsubmit nobox"><div><button type="submit">Save</button></div></div></form>';
                            } else {
                                var maincontent = errormsg + '<form action="/surveyupdate" method="post"><div><div class="nobox"><label for="alias">Survey Name:</label><input type="text" name="alias" value="' + returnedArray[0].surveyalias + '" required></div><label for="makelive">Check to turn survey live</label><div class="nobox"><input type="checkbox" name="live" id="makelive" value="1"></div></div><div id="container">' + questionscontent + '</div><div id="surveycreationnav" class="formsubmit nobox"><button name="addelement" type="button">Add Question</button></div><div class="formsubmit nobox"><div><button type="submit">Save</button></div></div></form>';
                            }
                            fs.writeFile(exportfilesurvey, maincontentsurvey, function (err) {
                                if (err) throw err;
                                console.log('Survey file written!');
                            });

                            if (returnedArray != null){
                                filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                                readandadd(filenames,req,res,function(result){
                                    fs.writeFile(exportfile, result, function (err) {
                                        if (err) throw err;
                                        console.log('File written!');
                                    });
                                    res.write(result);
                                    res.end();
                                }); 
                            }          
                        });  
                    } else {
                        getsurvey(err,connection,res,req,function(result){
                            returnedArray=result;
                            var errormsg = '<div class="errormsg"><p>Survey update failed, try a different Name.</p></div>';
                            var maincontent = errormsg + '<form action="/surveyupdate" method="post"><div><div class="nobox"><label for="alias">Survey Name:</label><input type="text" name="alias" value="' + returnedArray[0].surveyalias + '" required></div><div class="nobox"><label for="makelive">Check to turn survey live</label><input type="checkbox" name="live" id="makelive" value="1"></div><div id="container">' + questionscontent + '</div></div><div id="surveycreationnav" class="formsubmit nobox"><button name="addelement" type="button">Add Question</button></div><div class="formsubmit nobox"><div><button type="submit">Save</button></div></div></form>';

                            if (returnedArray != null){
                                filenames = [1,"./pages/headtop.html",0,titletag,0,cssfiles,0,scripting,1,"./pages/headbottom.html",1,"./pages/headertop.html",0,headercontent,1,"./pages/headerbottom.html",1,"./pages/maintop.html",0,maincontent,1,"./pages/mainbottom.html",1,"./pages/filebottom.html"];     
                                readandadd(filenames,req,res,function(result){
                                    fs.writeFile(exportfile, result, function (err) {
                                        if (err) throw err;
                                        console.log('File written!');
                                    });
                                    res.write(result);
                                    res.end();
                                }); 
                            }          
                        });
                    }
                });
            }
        }

        connection.on('error', function(err) {      
              res.json({"code" : 100, "status" : "Error in connection database"});
              return;     
        });
  });
}

function show_user(err,connection,res) {
    console.log("show_user");
    connection.query("select * from survey",function(err,rows){
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
    var email = adminemail;
    if(req.body.email != null) {
        email = req.body.email;
    }
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

function getsurveys(err,connection,res,req,callback) {
    console.log("get surveys");
    var returnArray = [];
    connection.query("select * from survey WHERE userid=?",[userid],function(err,rows){
        connection.release();
        if(!err) {             
            returnArray = rows; 
        }    
        else {
            returnArray = [null];
        }   
        return callback(returnArray);
    });
}

function getsurveysidbyalias(err,connection,res,req,callback) {
    console.log("getsurveysidbyalias");
    console.log("Altered Path");
    console.log(alteredpath);
    var returnArray = [];
    connection.query("select * from survey WHERE surveyalias=?",[alteredpath],function(err,rows){
        if(!err & rows[0] != null) {      
            console.log("rows");
            console.log(rows);
            console.log(rows[0]);  
            console.log(rows[0].surveyid);      
            returnArray = rows; 
        }    
        else {    
            returnArray = [null];
        }   
        return callback(returnArray);
    });
}

function getallusers(err,connection,res,req,callback) {
    console.log("get usernames");
    var returnArray = [];
    connection.query("select * from user",function(err,rows){
        connection.release();
        if(!err) {             
            console.log("rows = "); 
            console.log(rows);
            returnArray = rows; 
        }    
        else {
            returnArray = [null];
        }   
        return callback(returnArray);
    });
}

function deleteresponses(err,connection,res,req,callback) {
    console.log("delete responses");
    var returnArray = [];
    var responsetableadmin = "responses" + surveyidselection;
    console.log("surveyidselection = ");
    console.log(surveyidselection);
    console.log(responsetableadmin);
    console.log(req.body.responseids);
    var sqlstr = 'DELETE FROM ' + responsetableadmin + ' WHERE responseid in (' + req.body.responseids + ')';
    connection.query(sqlstr,function(err,rows){
        connection.release();
        if(!err) {             
            returnArray = rows; 
        }    
        else {
            console.log(err);
            returnArray = [null];
        }   
        return callback(returnArray);
    });
}

function getuser(err,connection,res,req,callback) {
    console.log("get user info");
    var returnArray = [];
    connection.query("select * from user WHERE userid=?",[req.body.user],function(err,rows){
        connection.release();
        if(!err) {             
            console.log("rows = "); 
            console.log(rows);
            returnArray = rows; 
        }    
        else {
            returnArray = [null];
        }   
        return callback(returnArray);
    });
}

function getsurvey(err,connection,res,req,callback) {
    console.log("get survey info");
    var returnArray = [];
    connection.query("select * from survey WHERE surveyid=?",[surveyidselection],function(err,rows){
        connection.release();
        if(!err) {             
            console.log("rows = "); 
            console.log(rows);
            returnArray = rows; 
        }    
        else {
            returnArray = [null];
        }   
        return callback(returnArray);
    });
}

function getsurveyresults(err,connection,res,req,callback) {
    console.log("get survey info");
    var returnArray = [];
    var sqlquery = 'select * from responses' + surveyidselection;
    connection.query(sqlquery,function(err,rows){
        if(!err) {            
            returnArray = rows; 
        }    
        else {
            returnArray = [null];
        }   
        return callback(returnArray);
    });
}

function update_password(err,connection,res,req,callback) {
    console.log("update password");
    var password = req.body.password;
    var returnVar = [];
    var par = [password, email];
    console.log("par = ");
    console.log(par);
    connection.query("UPDATE user SET password = ? WHERE email = ?",par,function(err,rows){
        connection.release();
        if(!err & rows.affectedRows > 0) {
            console.log("rows = ");
            console.log(rows);
            console.log(rows.affectedRows);
            returnVar = 1;
        } else {
            console.log("rows error = ");
            console.log(rows);
            console.log(rows.affectedRows);
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

function updateuser(err,connection,res,req,callback) {
    console.log("check user");
    var un = req.body.username;
    var e = req.body.email;
    if(req.body.admin == "on") {
        var a = 1;
    } else {
        var a = 0;
    }
    var returnVar = [];
    var par = [un, e, a, adminuserid];
    connection.query("UPDATE user SET username=?, email=?, admin=? WHERE userid = ?",par,function(err,rows){
        connection.release();
        if(!err) {
            console.log("rows=");
            console.log(rows);
            returnVar = 1;
        } else {
            console.log("failure rows=");
            console.log(rows);
            console.log("failure err=");
            console.log(err);
            returnVar = 0;
        }
        return callback(returnVar);
    });
}

function createsurvey(err,connection,res,req,callback) {
    console.log("check user");
    var a = req.body.alias.replace(/\s/g,'');
    var l = req.body.live;
    var ll = host_address + a;
    var tl = host_address + a + "?testing=1";
    var returnArray = [];
    var par = [a, l, ll, tl, userid];
    console.log('-------------------------------------');
    console.log('---------------LIVE------------------');
    console.log('-------------------------------------');
    console.log(l);
    connection.query("INSERT INTO survey (surveyalias, live, livelink, testlink, userid) VALUES (?,?,?,?,?)",par,function(err,rows){
        if(!err) {
            returnArray = [rows];
        } else {
            console.log(err);
            returnArray = null;
        }
        return callback(returnArray);
    });
}

function updatesurvey(err,connection,res,req,callback) {
    console.log("check user");
    var a = req.body.alias.replace(/\s/g,'');
    var l = req.body.live;
    var sn = req.body.surveyname;
    var ll = host_address + a;
    var tl = host_address + a + "?testing=1";
    var returnVar = [];
    var par = [a, l, ll, tl, surveyidselection];
    connection.query("UPDATE survey SET surveyalias = ?, live = ?, livelink = ?, testlink = ? WHERE surveyid = ?",par,function(err,rows){
        if(!err) {
            returnVar = 1;
        } else {
            console.log("err = ");
            console.log(err);
            returnVar = 0;
        }
        return callback(returnVar);
    });
}

function deletesurvey(err,connection,res,req,callback) {
    console.log("delete survey");
    var returnArray = [];
    var responsetableadmin = "responses" + surveyidselection;
    console.log(responsetableadmin);
    var sqlstr = 'DELETE FROM survey WHERE surveyid = ' + surveyidselection;
    console.log(sqlstr);
    connection.query(sqlstr,function(err,rows){
        if(!err) {        
            console.log(rows);     
            returnArray = rows; 
        }    
        else {
            console.log(err);
            returnArray = [null];
        }   
        return callback(returnArray);
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

function readandadd(fn,req,res,callback){
    console.log("readandadd started")
    var text = "";
    l = fn.length;
    for (i = 0; i < l; i++) {
        if (fn[i] == 1){
            i++;
            text = text + fs.readFileSync(fn[i],'utf-8');
        }
        else if(fn[i] == 0){
            i++;
            text = text + fn[i];
        }
    }
    console.log("text = ")
    console.log(text);
    return callback(text);
}

app.all("*",function(req,res){
    handle_database(req,res);
});



app.listen(3000);
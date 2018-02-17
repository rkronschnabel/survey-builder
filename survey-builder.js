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
                getsurveys(err,connection,res,req,function(result){
                    returnedArray=result;
                    var row = "";
                    var table = "";
                    for(i = 0; i < returnedArray.length; i++){
                        row = "";
                        row = '<tr><td>' + returnedArray[i].surveyalias + '</td>';
                        if (returnedArray[i].live == 0){
                            row = row + '<td>no</td>';
                            row = row + '<td>' + returnedArray[i].livelink + '</td>';
                        } else {
                            row = row + '<td>yes</td>';
                            row = row + '<td><a href="' + returnedArray[i].livelink + '">' + returnedArray[i].livelink + '</a></td>';
                        }
                        row = row + '<td><a href="' + returnedArray[i].testlink + '">' + returnedArray[i].testlink + '</a></td>';
                        row = row + '<td><a href="' + host_address + 'survey' + returnedArray[i].surveyid + '">Edit</a></td>';
                        row = row + '<td><a href="' + host_address + 'exportsurvey' + returnedArray[i].surveyid + '">Export</a></td><tr>'; 
                        table = table + row;                            
                    }
                    console.log(table);
                    if (returnedArray != null){
                        filenames = [1,"./pages/dashboardtop.html",0,table,1,"./pages/dashboardbottom.html"];     
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
                        var row = "";
                        var table = "";
                        for(i = 0; i < returnedArray.length; i++){
                            row = "";
                            row = '<tr><td>' + returnedArray[i].surveyalias + '</td>';
                            if (returnedArray[i].live == 0){
                                row = row + '<td>no</td>';
                                row = row + '<td>' + returnedArray[i].livelink + '</td>';
                            } else {
                                row = row + '<td>yes</td>';
                                row = row + '<td><a href="' + returnedArray[i].livelink + '">' + returnedArray[i].livelink + '</a></td>';
                            }
                            row = row + '<td><a href="' + returnedArray[i].testlink + '">' + returnedArray[i].testlink + '</a></td>';
                            row = row + '<td><a href="' + host_address + 'survey' + returnedArray[i].surveyid + '">Edit</a></td>';
                            row = row + '<td><a href="' + host_address + 'exportsurvey' + returnedArray[i].surveyid + '">Export</a></td><tr>'; 
                            table = table + row;                            
                        }
                        console.log(table);
                        if (returnedArray != null){
                            filenames = [1,"./pages/dashboardtop.html",0,table,1,"./pages/dashboardbottom.html"];     
                            readandadd(filenames,req,res,function(result){
                                res.write(result);
                                res.end();
                            }); 
                        }             
                    }); 
                } else {
                    filename = "./pages/login.html";   
                    show_page(filename,req,res);          
                }
            });
        }

        if (q.pathname == "/admin"){
            filename = "./pages/admin.html";
            show_page(filename,req,res);
        }

        /** NOT FINAL **/

        if (q.pathname == "/adduser"){
            if (administrator == 1){
                adminuserid = null;
                filename = "./pages/user.html";
                
            } else {
                filename = "./pages/admin.html";
            }
            show_page(filename,req,res);
        }

        if (q.pathname == "/userupdate"){
            console.log("Admin User Id = " + adminuserid)
            if (adminuserid == null) {
                createuser(err,connection,res,req,function(result){
                    returned=result;
                    if (returned == 1){
                        console.log("Returned = " + returned);
                        filename = "./pages/success.html";
                    } else {
                        console.log("Returned (failed) = " + returned);
                        filename = "./pages/underconstruction.html"; 
                    }
                    show_page(filename,req,res);   
                });
            } else {
                updateuser(err,connection,res,req,aid,function(result){
                    returnedArray=result;
                    if (returned == 1){
                        filename = "./pages/success.html";
                    } else {
                        filename = "./pages/underconstruction.html"; 
                    }
                    show_page(filename,req,res);
                });
            }
        }

        if (q.pathname == "/edituser"){            
            if (administrator == 1){
                filename = "./pages/edituser.html";
            } else {
                filename = "./pages/admin.html";
            }
            show_page(filename,req,res);
        }

        if (q.pathname == "/chooseuser"){
            filename = "./pages/underconstruction.html";
            show_page(filename,req,res);
        }

        if (q.pathname == "/deleteresponse"){
            filename = "./pages/choosesurvey.html";
            show_page(filename,req,res);
        }

        if (q.pathname == "/choosesurvey"){
            filename = "./pages/deleteresponse.html";
            show_page(filename,req,res);
        }

        if (q.pathname == "/deleteresponseids"){
            filename = "./pages/underconstruction.html";
            show_page(filename,req,res);
        }

        if (q.pathname == "/deletesurvey"){
            filename = "./pages/deletesurvey.html";
            show_page(filename,req,res);
        }

        if (q.pathname == "/sendsurveydeletion"){
            filename = "./pages/underconstruction.html";
            show_page(filename,req,res);
        }

        if (q.pathname == "/newsurvey"){
            surveyidselection = null;            
            filename = "./pages/survey.html";
            show_page(filename,req,res);
        }

        if (q.pathname == "/surveyupdate"){
            console.log("Admin User Id = " + adminuserid)
            if (surveyidselection == null) {
                createsurvey(err,connection,res,req,function(result){
                    returned=result;
                    if (returned == 1){
                        console.log("Returned = " + returned);
                        filename = "./pages/success.html";
                    } else {
                        console.log("Returned (failed) = " + returned);
                        filename = "./pages/underconstruction.html"; 
                    }
                    show_page(filename,req,res);   
                });
            } else {
                updatesurvey(err,connection,res,req,aid,function(result){
                    returned=result;
                    if (returned == 1){
                        filename = "./pages/success.html";
                    } else {
                        filename = "./pages/underconstruction.html"; 
                    }
                    show_page(filename,req,res);
                });
            }
        }

        
        if (q.pathname == "/test.html"){       
            filenames = [1,"./pages/dashboardtop.html",0,username,1,"./pages/dashboardbottom.html"];     
            readandadd(filenames,req,res,function(result){
                res.write(result);
                res.end();
            });
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
        
        /** NOT FINAL **/

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
    console.log(text);
    return callback(text);
}

app.all("*",function(req,res){
    handle_database(req,res);
});



app.listen(3000);
var mysql = require('mysql');
console.log("mysql set");
var json = require('config.json')('config.json');
console.log("json set");
var fs= require('fs');
console.log("fs set");
var config = JSON.parse(fs.readFileSync('config.json','utf8'));
console.log("config set");

var con = mysql.createConnection({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: "surveybuilder"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!"); 
    con.query("DROP TABLE IF EXISTS user", function (err, result) {
      if (err) throw err;
      console.log("user Table deleted");
    });
    con.query("DROP TABLE IF EXISTS survey", function (err, result) {
      if (err) throw err;
      console.log("survey Table deleted");
    });
    var sql = "CREATE TABLE user (userid INT AUTO_INCREMENT PRIMARY KEY, password VARCHAR(25) NOT NULL, username VARCHAR(50) NOT NULL UNIQUE, email VARCHAR(255) NOT NULL UNIQUE, admin BOOL)";
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("user Table created");
      });
    var sql2 = "CREATE TABLE survey(surveyid INT AUTO_INCREMENT PRIMARY KEY, surveyalias VARCHAR(100), live BOOL, livelink VARCHAR(255), testlink VARCHAR(255), userid INT NOT NULL, FOREIGN KEY (userid) REFERENCES user(userid))";
      con.query(sql2, function (err, result) {
          if (err) throw err;
          console.log("survey Table created");
        });
    });
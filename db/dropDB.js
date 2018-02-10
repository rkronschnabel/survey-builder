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
  password: config.mysql.password
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    con.query("DROP DATABASE IF EXISTS surveyBuilder", function (err, result) {
      if (err) throw err;
      console.log("surveyBuilder Database deleted");
    });
  });
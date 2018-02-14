var mysql = require('mysql');
console.log("mysql set");
var json = require('config.json')('config.json');
console.log("json set");
var fs= require('fs');
console.log("fs set");
var config = JSON.parse(fs.readFileSync('config.json','utf8'));
console.log("config set");



function create(){
var con = mysql.createConnection({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password
});

console.log("begin connection");

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected! con");    
    con.query("DROP DATABASE IF EXISTS surveyBuilder", function (err, result) {
      if (err) throw err;
      console.log("surveyBuilder Database deleted");
    });
    con.query("CREATE DATABASE surveyBuilder", function (err, result) {
      if (err) throw err;
      console.log("surveyBuilder Database created");
    });
    con.end();
    console.log("connection ended");
  });

console.log("end connection");

var con2 = mysql.createConnection({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: "surveyBuilder"
});

console.log("begin connection");

con2.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");  
    con2.query("DROP TABLE IF EXISTS user", function (err, result) {
      if (err) throw err;
      console.log("user Table deleted");
    });    
    con2.query("DROP TABLE IF EXISTS survey", function (err, result) {
        if (err) throw err;
        console.log("survey Table deleted");
    });
    con2.query("DROP TABLE IF EXISTS responses1", function (err, result) {
      if (err) throw err;
      console.log("responses1 Table deleted");
    });
    var sql = "CREATE TABLE user (userid INT AUTO_INCREMENT PRIMARY KEY, password VARCHAR(25) NOT NULL, username VARCHAR(50) NOT NULL UNIQUE, email VARCHAR(255) NOT NULL UNIQUE, admin BOOL)";
    con2.query(sql, function (err, result) {
        if (err) throw err;
        console.log("user Table created");
    });
    var sql = "CREATE TABLE survey(surveyid INT AUTO_INCREMENT PRIMARY KEY, surveyalias VARCHAR(100), live BOOL, livelink VARCHAR(255), testlink VARCHAR(255), userid INT NOT NULL, FOREIGN KEY (userid) REFERENCES user(userid))";
      con2.query(sql, function (err, result) {
          if (err) throw err;
          console.log("survey Table created");
    });
    var sql = "CREATE TABLE responses1 (responseid INT AUTO_INCREMENT PRIMARY KEY, starttime DATETIME DEFAULT CURRENT_TIMESTAMP, finishtime DATETIME, lastmod DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, q1 INT,q2 INT,q3 LONGTEXT,q4 INT,surveyid INT NOT NULL DEFAULT 1)";
        con2.query(sql, function (err, result) {
            if (err) throw err;
            console.log("responses1 Table created");
    });
    var sql = "ALTER TABLE responses1 ADD CONSTRAINT FOREIGN KEY (surveyid) REFERENCES survey(surveyid)";
        con2.query(sql, function (err, result) {
            if (err) throw err;
            console.log("responses Table altered");
    });
    var sql = "INSERT INTO user (username, password, email, admin) VALUES('testuser1','ABC123','testemail1@test.com',0),('testuser2','ABC123','testemail2@test.com',0),('testuser3','ABC123','testemail3@test.com',0),('testuser4','ABC123','testemail4@test.com',0),('testuser5','ABC123','testemail5@test.com',0),('testuser6','ABC123','testemail6@test.com',0),('testuser7','ABC123','testemail7@test.com',0),('testuser8','ABC123','testemail8@test.com',0),('testuser9','ABC123','testemail9@test.com',0),('testuser10','ABC123','testemail10@test.com',0),('testuser11','ABC123','testemail11@test.com',0),('testuser12','ABC123','testemail12@test.com',0),('testuser13','ABC123','testemail13@test.com',0),('testuser14','ABC123','testemail14@test.com',0),('testuser15','ABC123','testemail15@test.com',0),('testuser16','ABC123','testemail16@test.com',0),('testuser17','ABC123','testemail17@test.com',0),('testuser18','ABC123','testemail18@test.com',0),('testuser19','ABC123','testemail19@test.com',0),('testuser20','ABC123','testemail20@test.com',0),('testuser21','ABC123','testemail21@test.com',0),('testuser22','ABC123','testemail22@test.com',0)";
        con2.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Data inserted into user table");
    });
    var sql = "INSERT INTO survey (surveyalias, live, livelink, testlink, userid) VALUES('testsurvey1',0,'http://www.google.com','http://www.bing.com',1),('testsurvey2',0,'http://www.google.com','http://www.bing.com',2),('testsurvey3',0,'http://www.google.com','http://www.bing.com',3),('testsurvey4',0,'http://www.google.com','http://www.bing.com',4),('testsurvey5',0,'http://www.google.com','http://www.bing.com',5),('testsurvey6',0,'http://www.google.com','http://www.bing.com',6),('testsurvey7',0,'http://www.google.com','http://www.bing.com',7),('testsurvey8',0,'http://www.google.com','http://www.bing.com',8),('testsurvey9',0,'http://www.google.com','http://www.bing.com',9),('testsurvey10',0,'http://www.google.com','http://www.bing.com',1),('testsurvey11',0,'http://www.google.com','http://www.bing.com',2),('testsurvey12',0,'http://www.google.com','http://www.bing.com',3),('testsurvey13',0,'http://www.google.com','http://www.bing.com',10),('testsurvey14',0,'http://www.google.com','http://www.bing.com',11),('testsurvey15',0,'http://www.google.com','http://www.bing.com',12),('testsurvey16',0,'http://www.google.com','http://www.bing.com',13),('testsurvey17',0,'http://www.google.com','http://www.bing.com',14),('testsurvey18',0,'http://www.google.com','http://www.bing.com',15),('testsurvey19',0,'http://www.google.com','http://www.bing.com',16),('testsurvey20',0,'http://www.google.com','http://www.bing.com',17),('testsurvey21',0,'http://www.google.com','http://www.bing.com',18),('testsurvey22',0,'http://www.google.com','http://www.bing.com',19),('testsurvey23',0,'http://www.google.com','http://www.bing.com',20),('testsurvey24',0,'http://www.google.com','http://www.bing.com',21),('testsurvey25',0,'http://www.google.com','http://www.bing.com',22),('testsurvey26',0,'http://www.google.com','http://www.bing.com',22),('testsurvey27',0,'http://www.google.com','http://www.bing.com',11)";
        con2.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Data inserted into survey table");
    });
    var sql = "INSERT INTO responses1 (q1, q2, q3, q4) VALUES(122,3,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',99),(18,7,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',1),(1,8,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',3),(2,7,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',88),(3,6,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',77),(4,5,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',6),(5,4,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',5),(6,3,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',1),(7,2,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',2),(8,1,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',3)";
        con2.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Data inserted into responses1 table");
    });
    var sql = "UPDATE responses1 SET q1 = 522 where responseid =1";
        con2.query(sql, function (err, result) {
            if (err) throw err;
            console.log("responses1 table updated");
    });
    con2.end();
    console.log("connection ended");
});
};

create();
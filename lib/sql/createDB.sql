/********************************************************
**************** CREATE DATABASE QUERIES ****************
*********************************************************/

-- Create the Database

DROP DATABASE IF EXISTS surveyBuilder;
CREATE DATABASE surveyBuilder;
USE surveyBuilder;

-- Create the tables for the Database

DROP TABLE IF EXISTS user;

CREATE TABLE user ( 
	userid INT AUTO_INCREMENT PRIMARY KEY, 
    password VARCHAR(25) NOT NULL, 
    username VARCHAR(50) NOT NULL UNIQUE, 
    email VARCHAR(255) NOT NULL UNIQUE, 
    admin BOOL
    );

DROP TABLE IF EXISTS survey;

CREATE TABLE survey (
	surveyid INT AUTO_INCREMENT PRIMARY KEY, 
    surveyalias VARCHAR(100), 
    live BOOL, 
    livelink VARCHAR(255), 
    testlink VARCHAR(255), 
    userid INT NOT NULL, 
    FOREIGN KEY (userid) REFERENCES user(userid)
    );

INSERT INTO user (username, password, email, admin) VALUES
('admin','PLEASECHANGESOON','enteryouremailhere',1)
;


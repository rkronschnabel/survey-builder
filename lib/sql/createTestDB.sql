/********************************************************
********************* CREATE TEST DB ********************
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
    admin BOOL NOT NULL
    );

DROP TABLE IF EXISTS survey;

CREATE TABLE survey (
	surveyid INT AUTO_INCREMENT PRIMARY KEY, 
    surveyalias VARCHAR(100) NOT NULL UNIQUE, 
    live BOOL, 
    livelink VARCHAR(255) NOT NULL UNIQUE, 
    testlink VARCHAR(255) NOT NULL UNIQUE, 
    userid INT NOT NULL, 
    FOREIGN KEY (userid) REFERENCES user(userid)
    );

INSERT INTO user (username, password, email, admin) VALUES
('testuser1','ABC123','eponymousryan@gmail.com',1),
('testuser2','ABC123','testemail2@test.com',0),
('testuser3','ABC123','testemail3@test.com',1),
('testuser4','ABC123','testemail4@test.com',0),
('testuser5','ABC123','testemail5@test.com',1),
('testuser6','ABC123','testemail6@test.com',0),
('testuser7','ABC123','testemail7@test.com',1),
('testuser8','ABC123','testemail8@test.com',0),
('testuser9','ABC123','testemail9@test.com',1),
('testuser10','ABC123','testemail10@test.com',1),
('testuser11','ABC123','testemail11@test.com',1),
('testuser12','ABC123','testemail12@test.com',1),
('testuser13','ABC123','testemail13@test.com',0),
('testuser14','ABC123','testemail14@test.com',1),
('testuser15','ABC123','testemail15@test.com',1),
('testuser16','ABC123','testemail16@test.com',0),
('testuser17','ABC123','testemail17@test.com',0),
('testuser18','ABC123','testemail18@test.com',0),
('testuser19','ABC123','testemail19@test.com',0),
('testuser20','ABC123','testemail20@test.com',0),
('testuser21','ABC123','testemail21@test.com',0),
('testuser22','ABC123','testemail22@test.com',0)
;


INSERT INTO survey (surveyalias, live, livelink, testlink, userid) VALUES
('testsurvey1',0,'http://localhost:3000/testsurvey1','http://localhost:3000/testsurvey1?testing=1',1),
('testsurvey2',0,'http://localhost:3000/testsurvey2','http://localhost:3000/testsurvey2?testing=1',2),
('testsurvey3',0,'http://localhost:3000/testsurvey3','http://localhost:3000/testsurvey3?testing=1',3),
('testsurvey4',0,'http://localhost:3000/testsurvey4','http://localhost:3000/testsurvey4?testing=1',4),
('testsurvey5',0,'http://localhost:3000/testsurvey5','http://localhost:3000/testsurvey5?testing=1',5),
('testsurvey6',0,'http://localhost:3000/testsurvey6','http://localhost:3000/testsurvey6?testing=1',6),
('testsurvey7',0,'http://localhost:3000/testsurvey7','http://localhost:3000/testsurvey7?testing=1',7),
('testsurvey8',0,'http://localhost:3000/testsurvey8','http://localhost:3000/testsurvey8?testing=1',8),
('testsurvey9',0,'http://localhost:3000/testsurvey9','http://localhost:3000/testsurvey9?testing=1',9),
('testsurvey10',0,'http://localhost:3000/testsurvey10','http://localhost:3000/testsurvey10?testing=1',10),
('testsurvey11',0,'http://localhost:3000/testsurvey11','http://localhost:3000/testsurvey11?testing=1',1),
('testsurvey12',0,'http://localhost:3000/testsurvey12','http://localhost:3000/testsurvey12?testing=1',2),
('testsurvey13',0,'http://localhost:3000/testsurvey13','http://localhost:3000/testsurvey13?testing=1',3),
('testsurvey14',0,'http://localhost:3000/testsurvey14','http://localhost:3000/testsurvey14?testing=1',10),
('testsurvey15',0,'http://localhost:3000/testsurvey15','http://localhost:3000/testsurvey15?testing=1',11),
('testsurvey16',0,'http://localhost:3000/testsurvey16','http://localhost:3000/testsurvey16?testing=1',12),
('testsurvey17',0,'http://localhost:3000/testsurvey17','http://localhost:3000/testsurvey17?testing=1',13),
('testsurvey18',0,'http://localhost:3000/testsurvey18','http://localhost:3000/testsurvey18?testing=1',14),
('testsurvey19',0,'http://localhost:3000/testsurvey19','http://localhost:3000/testsurvey19?testing=1',15),
('testsurvey20',0,'http://localhost:3000/testsurvey20','http://localhost:3000/testsurvey20?testing=1',16),
('testsurvey21',0,'http://localhost:3000/testsurvey21','http://localhost:3000/testsurvey21?testing=1',17),
('testsurvey22',0,'http://localhost:3000/testsurvey22','http://localhost:3000/testsurvey22?testing=1',18),
('testsurvey23',0,'http://localhost:3000/testsurvey23','http://localhost:3000/testsurvey23?testing=1',19),
('testsurvey24',0,'http://localhost:3000/testsurvey24','http://localhost:3000/testsurvey24?testing=1',20),
('testsurvey25',0,'http://localhost:3000/testsurvey25','http://localhost:3000/testsurvey25?testing=1',21),
('testsurvey26',0,'http://localhost:3000/testsurvey26','http://localhost:3000/testsurvey26?testing=1',22),
('testsurvey27',0,'http://localhost:3000/testsurvey27','http://localhost:3000/testsurvey27?testing=1',22),
('testsurvey28',0,'http://localhost:3000/testsurvey28','http://localhost:3000/testsurvey28?testing=1',11)
;

DROP TABLE IF EXISTS responses1;

CREATE TABLE responses1 (
	responseid INT AUTO_INCREMENT PRIMARY KEY, 
    starttime DATETIME DEFAULT CURRENT_TIMESTAMP, 
    finishtime DATETIME, 
    lastmod DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    q1 INT,
    q2 INT,
    q3 LONGTEXT,
    q4 INT,
    surveyid INT NOT NULL DEFAULT 1
    );
    
ALTER TABLE responses1
ADD CONSTRAINT FOREIGN KEY (surveyid) REFERENCES survey(surveyid);
    
INSERT INTO responses1 (q1, q2, q3, q4) VALUES
(122,3,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',99),
(18,7,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',1),
(1,8,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',3),
(2,7,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',88),
(3,6,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',77),
(4,5,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',6),
(5,4,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',5),
(6,3,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',1),
(7,2,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',2),
(8,1,'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',3)
;

UPDATE responses1 SET q1 = 522 where responseid =1;
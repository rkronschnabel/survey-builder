/********************************************************
****************** CREATE RESPONSEVIEW ******************
*********************************************************/

USE surveyBuilder;

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
/********************************************************
**************** UPDATE SURVEY LIVELINK *****************
*********************************************************/

USE surveyBuilder;

UPDATE survey
SET livelink = "http://www.yahoo.com"
WHERE surveyid = 1;
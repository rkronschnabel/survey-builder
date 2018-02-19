/********************************************************
**************** UPDATE SURVEY TESTLINK *****************
*********************************************************/

USE surveyBuilder;

UPDATE survey
SET testlink = "http://www.duckduckgo.com"
WHERE surveyid = 1;
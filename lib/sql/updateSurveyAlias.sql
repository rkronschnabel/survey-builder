/********************************************************
****************** UPDATE SURVEY ALIAS ******************
*********************************************************/

USE surveyBuilder;

UPDATE survey
SET surveyalias = "updateTestSurvey1"
WHERE surveyid = 1;
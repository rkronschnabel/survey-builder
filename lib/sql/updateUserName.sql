/********************************************************
******************** UPDATE USERNAME ********************
*********************************************************/

USE surveyBuilder;

UPDATE user
SET userName = "updateTestUser"
WHERE userid = 1;
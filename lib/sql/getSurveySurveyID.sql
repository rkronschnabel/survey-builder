/********************************************************
********************* GET SURVEYID **********************
*********************************************************/

USE surveyBuilder;

SELECT surveyid
FROM survey
WHERE userid = 1;

SELECT surveyid
FROM survey
WHERE surveyalias = "testsurvey2";
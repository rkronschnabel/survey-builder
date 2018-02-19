/********************************************************
******************** UPDATE FINISHTIME ********************
*********************************************************/

USE surveyBuilder;

UPDATE responses1
SET finishtime = NOW()
WHERE responseid=1;
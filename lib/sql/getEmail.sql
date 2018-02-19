/********************************************************
********************** GET EMAIL ************************
*********************************************************/

USE surveyBuilder;

SELECT email
FROM user
WHERE userid = 1;

SELECT email
FROM user
WHERE username = "updateTestUser";
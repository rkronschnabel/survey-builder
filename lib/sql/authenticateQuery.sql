/********************************************************
********************* AUTHENTICATE **********************
*********************************************************/

USE surveyBuilder;

SELECT password
FROM user
WHERE username = "updateTestUser";
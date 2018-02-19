/********************************************************
********************** GET USERID ***********************
*********************************************************/

USE surveyBuilder;

SELECT userid
FROM user
WHERE username = "updateTestUser";

SELECT userid
FROM user
WHERE email = "updateemailtest@test.com";
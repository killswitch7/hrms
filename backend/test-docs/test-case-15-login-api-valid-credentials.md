# Test Case 15: Login API with Valid Credentials

## Objective
To verify that the login API works correctly with valid credentials through automated testing.

## Action
- Automated test script sent valid login request to the authentication API.

## Expected Result
- API should return success response, token, and user role.

## Actual Result
- API returned successful response with authentication token and role.

## Conclusion
The test was successful.

## Jest File
`/Volumes/Lexar/FYP HRMS/hrms/backend/src/routes/auth.login.api.test.js`

## Run Command
```bash
cd "/Volumes/Lexar/FYP HRMS/hrms/backend"
npx jest src/routes/auth.login.api.test.js
```


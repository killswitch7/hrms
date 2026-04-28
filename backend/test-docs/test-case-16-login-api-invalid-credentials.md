# Test Case 16: Login API with Invalid Credentials

## Objective
To verify that the login API rejects invalid credentials through automated testing.

## Action
- Automated test script sent login request with invalid password.

## Expected Result
- API should return unauthorized or error response.

## Actual Result
- API rejected invalid credentials correctly.

## Conclusion
The test was successful.

## Jest File
`/Volumes/Lexar/FYP HRMS/hrms/backend/src/routes/auth.login.api.test.js`

## Covered Assertion
- Invalid login test checks:
  - status code `400`
  - response message `Invalid credentials`
  - no token in response

## Run Command
```bash
cd "/Volumes/Lexar/FYP HRMS/hrms/backend"
npx jest src/routes/auth.login.api.test.js
```


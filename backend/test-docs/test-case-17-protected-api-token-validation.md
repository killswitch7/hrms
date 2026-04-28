# Test Case 17: Protected API Access with Token

## Objective
To verify that protected APIs are accessible only with a valid token.

## Action
- Automated script accessed protected route using valid and invalid tokens.

## Expected Result
- Valid token should allow access.
- Invalid token should be rejected.

## Actual Result
- Protected route allowed valid token access and rejected invalid token access.

## Conclusion
The test was successful.

## Jest File
`/Volumes/Lexar/FYP HRMS/hrms/backend/src/routes/protected.api.test.js`

## Run Command
```bash
cd "/Volumes/Lexar/FYP HRMS/hrms/backend"
npx jest src/routes/protected.api.test.js
```


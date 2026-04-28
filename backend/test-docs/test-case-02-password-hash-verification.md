# Test Case 2: Password Hash Verification

## Objective
To check if the system correctly compares hashed passwords.

## Action
- A plain password was compared with stored hashed password.

## Expected Result
- Matching password should return `true`.
- Incorrect password should return `false`.

## Actual Result
- Correct password matched successfully.
- Incorrect password was rejected.

## Conclusion
The test was successful.

## Jest File
`/Volumes/Lexar/FYP HRMS/hrms/backend/src/models/User.test.js`

## Run Command
```bash
cd "/Volumes/Lexar/FYP HRMS/hrms/backend"
npx jest src/models/User.test.js
```


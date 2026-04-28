# Test Case 4: Duplicate Attendance Check-In Prevention

## Objective
To ensure duplicate attendance is not allowed.

## Action
- Multiple check-in requests were sent for the same user on the same day.

## Expected Result
- Second request should be rejected with error.

## Actual Result
- Duplicate check-in was prevented.

## Conclusion
The test was successful.

## Jest File
`/Volumes/Lexar/FYP HRMS/hrms/backend/src/controllers/attendanceController.test.js`

## Run Command
```bash
cd "/Volumes/Lexar/FYP HRMS/hrms/backend"
npx jest src/controllers/attendanceController.test.js
```


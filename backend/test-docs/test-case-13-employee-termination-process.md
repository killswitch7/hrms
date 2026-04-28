# Test Case 13: Employee Termination Process

## Objective
To verify employee termination process.

## Action
- Termination request was sent for an employee.

## Expected Result
- Employee status should be set to terminated.

## Actual Result
- Status updated successfully.

## Conclusion
The test was successful.

## Note
In this HRMS, termination flow uses `layoff` status (instead of literal `terminated`).

## Jest File
`/Volumes/Lexar/FYP HRMS/hrms/backend/src/controllers/adminController.test.js`

## Run Command
```bash
cd "/Volumes/Lexar/FYP HRMS/hrms/backend"
npx jest src/controllers/adminController.test.js
```


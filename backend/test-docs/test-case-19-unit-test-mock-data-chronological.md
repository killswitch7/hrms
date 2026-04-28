# HRMS Unit Test Mock Data (Chronological)

This file contains mock values used in unit/API test cases in chronological order of system flow (Auth -> Employee/Department -> Attendance -> Leave -> Payroll).

---

## Test Case 1: JWT Token Validation (Middleware)

| Mock Field | Mock Value |
|---|---|
| Authorization Header (valid) | `Bearer valid-token` |
| Authorization Header (invalid) | `Bearer invalid-token` |
| Decoded Token Payload | `{ id: "user-1" }` |
| Mock User | `{ _id: "user-1", name: "Test User", role: "employee" }` |
| Expected Status (valid) | `next()` called |
| Expected Status (invalid) | `401` |

---

## Test Case 2: Password Hash Verification

| Mock Field | Mock Value |
|---|---|
| Plain Password | `admin123` |
| Wrong Password | `wrong-password` |
| Mock Email | `admin@test.com` |
| Role | `admin` |
| Hash Method | `bcrypt.hash(password, 10)` |

---

## Test Case 3: JWT Token Generation on Login (Controller)

| Mock Field | Mock Value |
|---|---|
| Email | `admin@gmail.com` |
| Password | `admin123` |
| User ID | `user-1` |
| User Role | `admin` |
| Stored Password | `hashed-password` |
| Generated Token | `mock-jwt-token` |

---

## Test Case 4: Employee Creation Logic

| Mock Field | Mock Value |
|---|---|
| Name | `Test Employee` |
| Email | `test.employee@gmail.com` |
| Password | `test1234` |
| Phone | `9800000000` |
| Department | `IT` |
| Position | `Intern` |
| Role | `employee` |
| Annual Salary | `600000` |
| Filing Status | `unmarried` |
| Employee ID | `EMP-123456` |

---

## Test Case 5: Employee Update Functionality

| Mock Field | Mock Value |
|---|---|
| Employee Record ID | `507f1f77bcf86cd799439011` |
| Updated Name | `Updated Name` |
| Updated Department | `IT` |
| Updated Designation | `Senior Engineer` |
| Updated Phone | `9811111111` |
| Updated Annual Salary | `900000` |
| Updated Filing Status | `married` |
| Updated Status | `active` |

---

## Test Case 6: Employee Termination (Layoff)

| Mock Field | Mock Value |
|---|---|
| Employee Record ID | `507f1f77bcf86cd799439012` |
| Action | `layoff` |
| Employee ID | `EMP-300` |
| Email | `terminate@test.com` |
| Previous Status | `active` |
| New Status | `layoff` |

---

## Test Case 7: Department Creation

| Mock Field | Mock Value |
|---|---|
| Department Name | `Finance` |
| Department ID | `dept-1` |
| Expected Message | `Department created` |

---

## Test Case 8: Duplicate Attendance Check-In

| Mock Field | Mock Value |
|---|---|
| User ID | `user-1` |
| Employee ID | `emp-1` |
| Date | `2026-04-17` |
| First Check-In Time | `2026-04-17T09:00:00.000Z` |
| Duplicate Response Message | `Already checked in for today` |
| Expected Duplicate Status | `400` |

---

## Test Case 9: Attendance Check-Out

| Mock Field | Mock Value |
|---|---|
| User ID | `user-2` |
| Employee ID | `emp-2` |
| Date | `2026-04-17` |
| Check-In Time | `2026-04-17T09:05:00.000Z` |
| Check-Out Time | Set at runtime in controller |
| Success Message | `Checked out successfully` |

---

## Test Case : Leave Request Submission (Controller)

| Mock Field | Mock Value |
|---|---|
| User ID | `user-1` |
| Employee ID | `emp-1` |
| Leave Type | `Annual` |
| From Date | `2026-04-20` |
| To Date | `2026-04-22` |
| Reason | `Family function` |
| Initial Status | `Pending` |

---

## Test Case : Leave Approval Process

| Mock Field | Mock Value |
|---|---|
| Leave ID | `leave-123` |
| Approver ID | `admin-1` |
| Approver Role | `admin` |
| Employee Email | `manager@test.com` |
| Previous Status | `Pending` |
| Updated Status | `Approved` |

---

## Test Case 12: Login API (Valid Credentials)

| Mock Field | Mock Value |
|---|---|
| API Route | `POST /api/auth/login` |
| Email | `test@mail.com` |
| Password | `123456` |
| Mock Role | `admin` |
| Expected Status | `200` |
| Expected Body | `token`, `user.role`, `message` |

---

## Test Case 13: Login API (Invalid Credentials)

| Mock Field | Mock Value |
|---|---|
| API Route | `POST /api/auth/login` |
| Email | `test@mail.com` |
| Password | `wrong-password` |
| Expected Status | `400` |
| Expected Message | `Invalid credentials` |
| Token in Response | Not present |

---

## Test Case 14: Protected API Token Access

| Mock Field | Mock Value |
|---|---|
| API Route | `GET /api/admin/departments` |
| Valid Token Payload | `{ id: "admin-user-1", email: "admin@mail.com", role: "admin" }` |
| Invalid Token | `invalid-token` |
| Expected Status (valid) | `200` |
| Expected Status (invalid) | `401` |
| Expected Invalid Message | `Token is not valid` |

---

## Test Case 15: Leave API Submission (Route Test)

| Mock Field | Mock Value |
|---|---|
| API Route | `POST /api/employee/leave` |
| Token Payload | `{ id: "emp-user-1", email: "test@mail.com", role: "employee" }` |
| Employee Profile ID | `emp-profile-1` |
| Leave Type | `Annual` |
| From Date | `2026-04-20` |
| To Date | `2026-04-21` |
| Reason | `Medical visit` |
| Expected Status | `201` |

---

## Test Case : Payroll Calculation Logic

| Mock Field | Mock Value |
|---|---|
| Annual Salary (Set 1) | `1200000` |
| Filing Status (Set 1) | `unmarried` |
| Other Deductions (Set 1) | `2000` |
| Annual Salary (Set 2) | `600000` |
| Filing Status (Set 2) | `unmarried` |
| Other Deductions (Set 2) | `1500` |

---

## Test Case : Deduction Calculation

| Mock Field | Mock Value |
|---|---|
| Tax Deduction | Value calculated by service |
| Other Deductions | `1500` or `2000` |
| Total Deductions Formula | `taxDeduction + otherDeductions` |
| Net Salary Formula | `grossPay - deductions` |

---

## Test Case 18: Payslip Generation

| Mock Field | Mock Value |
|---|---|
| Employee ID | `EMP-1001` |
| Employee Name | `Shuvam Sharma` |
| Department | `IT` |
| Designation | `Software Engineer` |
| Email | `xshuvam7@gmail.com` |
| Month | `2026-04` |
| Gross Pay | `100000` |
| Net Pay | `88667` |
| Tax Deduction | `8333` |
| Other Deductions | `2000` |
| Attendance Deduction | `1000` |

---

### Notes

- These values are mock/sample data for testing only.
- You can directly use these tables in your report screenshots.
- Source test files are under: `/Volumes/Lexar/FYP HRMS/hrms/backend/src/**/*.test.js`

// Test Case: Employee creation logic

const { createEmployee, updateEmployee, deleteEmployee } = require('./adminController');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { notifyTerminationAction } = require('../services/mailService');

jest.mock('../models/User');
jest.mock('../models/Employee');
jest.mock('../services/mailService');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('Employee Creation Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create employee in database for valid request', async () => {
    const req = {
      body: {
        name: 'Test Employee',
        email: 'test.employee@gmail.com',
        password: 'Test1234',
        phone: '9800000000',
        department: 'IT',
        position: 'Intern',
        role: 'employee',
        annualSalary: 600000,
        filingStatus: 'unmarried',
      },
    };
    const res = createMockRes();

    const createdUser = {
      _id: 'user-100',
      name: 'Test Employee',
      email: 'test.employee@gmail.com',
      role: 'employee',
    };

    const createdEmployee = {
      _id: 'emp-100',
      user: 'user-100',
      employeeId: 'EMP-123456',
      firstName: 'Test',
      lastName: 'Employee',
      email: 'test.employee@gmail.com',
      department: 'IT',
      designation: 'Intern',
      status: 'active',
      annualSalary: 600000,
    };

    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(createdUser);
    Employee.create.mockResolvedValue(createdEmployee);

    await createEmployee(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'test.employee@gmail.com' });
    expect(User.create).toHaveBeenCalled();
    expect(Employee.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Employee registered successfully',
      user: {
        _id: 'user-100',
        name: 'Test Employee',
        email: 'test.employee@gmail.com',
        role: 'employee',
      },
      employee: createdEmployee,
    });
  });
});

describe('Employee Update Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should save updated employee data successfully', async () => {
    const req = {
      params: { id: '507f1f77bcf86cd799439011' }, // valid mongo id format
      body: {
        name: 'Updated Name',
        designation: 'Senior Engineer',
        department: 'IT',
        phone: '9811111111',
        annualSalary: 900000,
        filingStatus: 'married',
        status: 'active',
      },
    };
    const res = createMockRes();

    const employeeDoc = {
      _id: 'emp-200',
      firstName: 'Old',
      lastName: 'Name',
      email: 'old@gmail.com',
      department: 'Old',
      designation: 'Intern',
      phone: '',
      annualSalary: 500000,
      baseSalary: 41666,
      filingStatus: 'unmarried',
      status: 'inactive',
      save: jest.fn().mockResolvedValue(true),
      user: {
        _id: 'user-200',
        role: 'employee',
        name: 'Old Name',
        email: 'old@gmail.com',
        save: jest.fn().mockResolvedValue(true),
      },
    };

    const updatedEmployee = {
      _id: 'emp-200',
      firstName: 'Updated',
      lastName: 'Name',
      designation: 'Senior Engineer',
      department: 'IT',
      status: 'active',
      user: { name: 'Updated Name', email: 'old@gmail.com', role: 'employee' },
    };

    Employee.findById
      .mockReturnValueOnce({
        populate: jest.fn().mockResolvedValue(employeeDoc),
      })
      .mockReturnValueOnce({
        populate: jest.fn().mockResolvedValue(updatedEmployee),
      });

    await updateEmployee(req, res);

    expect(employeeDoc.save).toHaveBeenCalledTimes(1);
    expect(employeeDoc.user.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Employee updated successfully',
      data: updatedEmployee,
    });
  });
});

describe('Employee Termination Process', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should set employee status to layoff (terminated) successfully', async () => {
    const req = {
      params: { id: '507f1f77bcf86cd799439012' },
      body: { action: 'layoff' },
    };
    const res = createMockRes();

    const employeeDoc = {
      _id: 'emp-300',
      firstName: 'Terminate',
      lastName: 'User',
      email: 'terminate@test.com',
      employeeId: 'EMP-300',
      status: 'active',
      user: { _id: 'user-300', email: 'terminate@test.com', role: 'employee' },
      save: jest.fn().mockResolvedValue(true),
    };

    Employee.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(employeeDoc),
    });
    notifyTerminationAction.mockResolvedValue(true);

    await deleteEmployee(req, res);

    expect(employeeDoc.status).toBe('layoff');
    expect(employeeDoc.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Employee marked as laid off.',
    });
  });
});

// Test Case: Department creation

const { createDepartment } = require('./departmentController');
const Department = require('../models/Department');

jest.mock('../models/Department');

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('Department Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should save new department successfully', async () => {
    const req = {
      body: {
        name: 'Finance',
      },
    };
    const res = createMockRes();

    const createdDepartment = {
      _id: 'dept-1',
      name: 'Finance',
    };

    Department.create.mockResolvedValue(createdDepartment);

    await createDepartment(req, res);

    expect(Department.create).toHaveBeenCalledWith({ name: 'Finance' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Department created',
      data: createdDepartment,
    });
  });
});


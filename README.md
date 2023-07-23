# CSCK542-EMA-GroupA

### Step 1: config
copy the `sample.env` file to `.env` and enter MySQL credentials

### Step 2: Seed Db
Seed the database with default users using the attached database dump

### Step 3: Run the application
```shell
npm start
```

The base url for all the routes is `http://localhost:3000`

## Overview of the postman collection and API Routes

### Sessions

- `POST /sessions` - Login user - Create session. Example body:
  ```json
  {
      "email": "morgan@example.com",
      "password": "123pass456"
  }
  ```
- `DELETE /sessions` - Logout user - Delete session
- `GET /sessions` - Get User Session Data

### Courses

#### Teacher only

- `PUT /courses/{{courseID}}/students/{{studentUserID}}/marks` - Set marks 0-100 for a course of student. Example body:
  ```json
  {
      "marks": 96.69
  }
  ```

#### Admin only

- `PUT /courses/{{courseID}}/assign` - Assign teacher to a course. Example body:
  ```json
  {
      "user_id": 8
  }
  ```
- `PUT /courses/{{courseID}}/unassign` - Unassign teacher from a course. Example body:
  ```json
  {
      "user_id": 5
  }
  ```
- `PUT /courses/{{courseID}}/enable` - Enable course
- `PUT /courses/{{courseID}}/disable` - Disable course
- `POST /courses` - Creates new course which is disabled by default. Example body:
  ```json
  {
      "name": "Math course",
  }
  ```

#### Student Only

- `PUT /courses/{{courseID}}/enroll` - Enroll in course for logged in student
- `PUT /courses/{{courseID}}/withdraw` - Withdraw from course for logged in student

### All roles

- `GET /courses?with_enrollments=true` - List all courses.
  For Admins shows the enrolled teachers/students and for teachers shows the enrolled students and for students this parameter has no effect.
  
  query parameter `with_enrollments` is optional and default is `false`

## Variables

The following variables are used in the collection:

- `BASE_HOST` - The base URL for the application is `http://127.0.0.1:3000`.
- `studentUserID` - The User ID of the student user. Example User ID is `27`.
- `courseID` - The ID of the course. 
- `teacherUserID` - The User ID of the teacher user. Example User ID is `8`.


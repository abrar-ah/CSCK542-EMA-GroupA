var express = require('express');
var router = express.Router();

// this middleware will be executed for all requests which require authentication
var authCheckMiddleware = require('../middlewares/auth_check_middleware');
var checkRoles = require('../middlewares/check_roles_middleware')

router.use(authCheckMiddleware);

const sessionsHandlers = require('../handlers/sessions_handlers')
const coursesHandlers = require('../handlers/courses_handlers')

// GET /sessions
// Used to get the session object and user object 
router.get('/sessions', sessionsHandlers.getSessionHandler);

// Available to all roles and displayed according to their role permissions
// Get all courses
router.get('/courses', checkRoles(['admin', 'teacher', 'student']), coursesHandlers.listCoursesHandler);


// Admins can view the enrollments of all teachers and students
// Teachers can only view the enrollments of students in their courses
// Students can only view their own enrollments
// Get all enrollments
router.all('/courses/enrollments', checkRoles(['admin', 'teacher', 'student']), coursesHandlers.listEnrollmentsHandler);

// Admins can view course info of all courses
// Teachers can view course info of only their courses which are enabled
// Students can view course info of courses which are enabled
// Get course details
router.get('/courses/:courseID', checkRoles(['admin']), coursesHandlers.getCourseHandler);


// Admins only - START
// Create a new course
router.post('/courses', checkRoles(['admin']), coursesHandlers.createCourseHandler);

// Update a course
router.put('/courses/:courseID', checkRoles(['admin']), coursesHandlers.updateCourseHandler);


// Disable a sepcific course
router.put('/courses/:courseID/disable', checkRoles(['admin']), coursesHandlers.disableCourseHandler);

// Enable a specific course
router.put('/courses/:courseID/enable', checkRoles(['admin']), coursesHandlers.enableCourseHandler);

// Assign course to a teacher
// Teacher's user id is provided in the payload body
router.put('/courses/:courseID/assign', checkRoles(['admin']), coursesHandlers.assignCourseHandler);

// Unassign course from a teacher
// Teacher's user id is provided in the payload body
router.put('/courses/:courseID/unassign', checkRoles(['admin']), coursesHandlers.unassignCourseHandler);
// Admins only - END


// Teachers only
// Set marks for a student
router.put('/courses/:courseID/students/:studentUserID/marks', checkRoles(['teacher']), coursesHandlers.setMarksHandler);


// Students Only
// Enroll in a course
router.put('/courses/:courseID/enroll', checkRoles(['student']), coursesHandlers.enrollCourseHandler);

// Withdraw from a course - Withdraw is only possible if marks are not assigned
router.put('/courses/:courseID/withdraw', checkRoles(['student']), coursesHandlers.withdrawCourseHandler);





module.exports = router;
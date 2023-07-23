
const commonHelper = require('../helpers/common_helper')
const validatorHelper = require('../helpers/validator_helper')
const coursesHelper = require('../helpers/courses_helper')
const usersHelper = require('../helpers/users_helper')


const db = require('../db')
const dbPool = db.GetDbPool()


createCourseHandler = async (req, res) => {
  try {
    await validatorHelper.validateCreateCourse(req.body)
  } catch (err) {
    return res.status(400).json({ error: err.errors[0] })
  }

  let courseData = {
    id: undefined,
    name: req.body.name,
    created_by_user_id: req.userSession.user.id,
    created_at: Date.now()
  }
  try {
    let [result] = await dbPool.execute(
      'INSERT INTO `courses` (`name`, `enabled`, `created_by_user_id`, `created_at`) VALUES (?, ?, ?, ?)',
      [courseData.name, false, courseData.created_by_user_id, courseData.created_at]
    );

    // console.log(result)

    courseData.id = result.insertId
    courseData.created_at = await commonHelper.msTimeToString(courseData.created_at)
    return res.json({ data: courseData })

  } catch (err) {
    console.log(err)
    return res.status(400).json({ error: { message: 'Server error: Error creating course' } })
  }

}

// NOT REQUIRED but complete it if we have time
getCourseHandler = async (req, res) => {
  res.json('yolo')
}

// NOT REQUIRED but complete it if we have time
updateCourseHandler = async (req, res) => {
}


listCoursesHandler = async (req, res) => {
  let userSession = req.userSession

  let coursesList = []
  const withEnrollments = req.query.with_enrollments == 'true'

  try {

    // console.log('userSession.user.role_id', userSession.user.role_id)
    if (userSession.user.role_id == 'admin') {
      // Get all course list with course.id, name, enabled, created_at, created_by_user.id, created_by_user.name

      const listCoursesQuery =
        ' SELECT `courses`.`course_id`, ' +
        '   `courses`.`name`, ' +
        '   `courses`.`enabled`, ' +
        '   `courses`.`created_at`, ' +
        '   `users`.`user_id` AS `created_by_user_id`, ' +
        '   `users`.`name` AS `created_by_user_name` ' +
        ' FROM `courses` ' +
        '   INNER JOIN `users` ON `courses`.`created_by_user_id` = `users`.`user_id` '
      let [courses] = await dbPool.execute(
        listCoursesQuery, []
      );

      if (courses.length > 0) {
        let allEnrollments
        if (withEnrollments) {
          // Get all course ids 
          let courseIDsList = []
          for (let i = 0; i < courses.length; i++) {
            courseIDsList.push(courses[i].course_id)
          }

          // Fetch all enrolled users in just a single query
          allEnrollments = await coursesHelper.getCourseEnrollments(courseIDsList)
        }


        for (let i = 0; i < courses.length; i++) {
          let course = courses[i];
          courseData = {
            id: course.course_id,
            name: course.name,
            enabled: !!course.enabled,
            created_by_user_id: course.created_by_user_id,
            created_by_user_name: course.created_by_user_name,
            created_at: course.created_at,
            teachers: [],
            students: []
          }

          if (withEnrollments) {
            // Get all teachers and students enrolled in the course
            if (typeof allEnrollments[courseData.id] != 'undefined') {
              if (typeof allEnrollments[courseData.id].teachers != 'undefined') {
                courseData.teachers = allEnrollments[courseData.id].teachers
              }
              if (typeof allEnrollments[courseData.id].students != 'undefined') {
                courseData.students = allEnrollments[courseData.id].students
              }
            }
          }

          courseData.created_at = await commonHelper.msTimeToString(courseData.created_at)
          coursesList.push(courseData)
        }
      }



    } else if (userSession.user.role_id == 'teacher') {
      // List all courses assigned to the teacher which are not disabled
      const listCoursesQuery =
        // SELECT from user_courses table and join on courses table
        ' SELECT `user_courses`.`course_id`, ' +
        '   `courses`.`name`, ' +
        // '   `courses`.`enabled`, ' +
        '   `courses`.`created_at` ' +
        ' FROM `user_courses` ' +
        '   INNER JOIN `courses` ON `user_courses`.`course_id` = `courses`.`course_id` ' +
        '  WHERE `user_courses`.`user_id` = ? AND `courses`.`enabled` = 1 '

      let [courses] = await dbPool.execute(
        listCoursesQuery,
        [userSession.user.id]
      )


      if (courses.length > 0) {
        let allEnrollments;

        if (withEnrollments) {

          // Get all course ids
          let courseIDsList = [];
          for (let i = 0; i < courses.length; i++) {
            courseIDsList.push(courses[i].course_id)
          }

          // Fetch all enrolled users in just a single query
          allEnrollments = await coursesHelper.getCourseEnrollments(courseIDsList)
          // console.log('allEnrollments123', allEnrollments)
        }

        for (let i = 0; i < courses.length; i++) {
          let course = courses[i];
          courseData = {
            id: course.course_id,
            name: course.name,
            created_at: course.created_at,
            students: []
          }

          if (withEnrollments) {
            // Get all students enrolled in the course
            if (typeof allEnrollments[courseData.id] != 'undefined') {
              // if (typeof allEnrollments[courseData.id].teachers != 'undefined') {
              //   courseData.teachers = allEnrollments[courseData.id].teachers
              // }
              if (typeof allEnrollments[courseData.id].students != 'undefined') {
                courseData.students = allEnrollments[courseData.id].students
              }
            }
          }


          courseData.created_at = await commonHelper.msTimeToString(courseData.created_at)
          coursesList.push(courseData)
        }
      }
    } else if (userSession.user.role_id == 'student') {

      // Selects enabled courses and checks if the user is enrolled in the course
      // all in a single query using LEFT JOIN
      const listCoursesQuery =
        ' SELECT courses.course_id, ' +
        '   courses.name, ' +
        '   IF(user_courses.user_id IS NULL, false, true) AS enrolled, ' +
        '    `courses`.`created_at` ' +
        ' FROM courses ' +
        '   LEFT JOIN user_courses ON courses.course_id = user_courses.course_id ' +
        '   AND user_courses.user_id = ? ' +
        ' WHERE courses.enabled = 1 ' +
        ' ORDER BY `courses`.`created_at` DESC; '



      let [courses] = await dbPool.execute(
        listCoursesQuery,
        [userSession.user.id]
      )

      if (courses.length > 0) {
        for (let i = 0; i < courses.length; i++) {
          let course = courses[i];
          courseData = {
            id: course.course_id,
            name: course.name,
            enrolled: !!course.enrolled,
            created_at: course.created_at,
          }

          courseData.created_at = await commonHelper.msTimeToString(courseData.created_at)
          coursesList.push(courseData)
        }
      }

    }

    return res.json({ data: coursesList })

  } catch (err) {
    console.log(err)
    return res.status(400).json({ error: { message: 'Server error: Error getting courses' } })
  }
  // res.json('yolo')
}
listEnrollmentsHandler = async (req, res) => {

}


disableCourseHandler = async (req, res) => {

  // Get course id from url parameters
  var [isInt, courseID] = commonHelper.isPositiveInteger(req.params.courseID)
  if (!isInt) {
    return res.status(400).json({ error: { message: 'Invalid course id provided' } })
  }

  let courseInfo = await coursesHelper.getCourseInfo(courseID)
  if (typeof courseInfo.error != 'undefined') {
    return res.status(400).json(courseInfo)
  }

  if (!courseInfo.enabled) {
    return res.status(400).json({ error: { message: 'Course is already disabled' } })
  }
  try {

    // Disable course
    let [result] = await dbPool.execute(
      'UPDATE `courses` SET `enabled` = 0 WHERE `course_id` = ?',
      [courseID]
    )
    if (result.affectedRows < 1) {
      return res.status(400).json({ error: { message: 'Error disabling course' } })
    }
  } catch (err) {
    return res.status(400).json({ error: { message: 'Error disabling course' } })
  }

  return res.json({
    data: {
      id: courseInfo.course_id,
      name: courseInfo.name,
      enabled: false,
      created_by_user_id: courseInfo.created_by_user_id,
      created_by_user_name: courseInfo.created_by_user_name,
      created_at: await commonHelper.msTimeToString(courseInfo.created_at)
    }
  })
}

enableCourseHandler = async (req, res) => {

  // Get course id from url parameters
  var [isInt, courseID] = commonHelper.isPositiveInteger(req.params.courseID)
  if (!isInt) {
    return res.status(400).json({ error: { message: 'Invalid course id provided' } })
  }

  let courseInfo = await coursesHelper.getCourseInfo(courseID)
  if (typeof courseInfo.error != 'undefined') {
    return res.status(400).json(courseInfo)
  }


  if (!!courseInfo.enabled) {
    return res.status(400).json({ error: { message: 'Course is already enabled' } })
  }

  try {

    // Check if any teacher role is assigned to the course id
    let listTeacherEnrollments = await coursesHelper.getCourseEnrollments([courseID], null, ['teacher'])

    // Only allow enabling course if at least one teacher is assigned to the course
    if (Object.keys(listTeacherEnrollments).length < 1) {
      return res.status(400).json({ error: { message: 'Cannot enable course as no teacher is assigned to the course' } })
    }

    // Enable the course
    let [result] = await dbPool.execute(
      'UPDATE `courses` SET `enabled` = 1 WHERE `course_id` = ?',
      [courseID]
    )
    if (result.affectedRows < 1) {
      return res.status(400).json({ error: { message: 'Error enabling course' } })
    }
  } catch (err) {
    return res.status(400).json({ error: { message: 'Error enabling course' } })
  }

  return res.json({
    data: {
      id: courseInfo.course_id,
      name: courseInfo.name,
      enabled: true,
      created_by_user_id: courseInfo.created_by_user_id,
      created_by_user_name: courseInfo.created_by_user_name,
      created_at: await commonHelper.msTimeToString(courseInfo.created_at)
    }
  })
}


assignCourseHandler = async (req, res) => {
  try {
    await validatorHelper.validateCourseAssignAndUnassign(req.body)
  } catch (err) {
    console.log(err)
    return res.status(400).json({ error: err.errors[0] })
  }

  let teacherUserID = req.body.user_id
  var [isInt, courseID] = commonHelper.isPositiveInteger(req.params.courseID)
  if (!isInt) {
    return res.status(400).json({ error: { message: 'Invalid course id provided' } })
  }

  // Check if course exists
  let courseInfo = await coursesHelper.getCourseInfo(courseID)
  if (typeof courseInfo.error != 'undefined') {
    return res.status(400).json(courseInfo)
  }

  // Check if teacher user exists
  let userInfo = await usersHelper.getUserInfo('user_id', teacherUserID)
  if (typeof userInfo.error != 'undefined') {
    return res.status(400).json(userInfo)
  }

  // Check if teacher role is teacher
  if (userInfo.role_id != 'teacher') {
    return res.status(400).json({ error: { message: 'Incorrect role of the provided user_id, must be student' } })
  }

  try {
    // Check if course is already assigned to the teacher
    let [rows] = await dbPool.execute(
      'SELECT `course_id` FROM `user_courses` WHERE `course_id` = ? AND `user_id` = ?',
      [courseID, teacherUserID]
    )
    if (rows.length > 0) {
      return res.status(400).json({ error: { message: 'Teacher is already assigned to the course' } })
    }
  } catch (err) {
    return res.status(400).json({ error: { message: 'Error checking if teacher is already assigned to the course' } })
  }

  // The data to be inserted into the user_courses table
  let userCoursesInsertData = {
    user_id_course_id_mix: teacherUserID + '_' + courseID,
    user_id: teacherUserID,
    course_id: courseID,
    created_at: Date.now()
  }

  try {
    // Assign course to the teacher
    let [result] = await dbPool.execute(
      'INSERT INTO `user_courses` (`user_id_course_id_mix`, `user_id`,`course_id`,  `created_at`) VALUES (?, ?, ?, ?)',
      [userCoursesInsertData.user_id_course_id_mix, userCoursesInsertData.user_id, userCoursesInsertData.course_id, userCoursesInsertData.created_at]
    )

    // Check if the row was inserted successfully
    if (result.affectedRows < 1) {
      return res.status(400).json({ error: { message: 'Error assigning teacher to the course' } })
    }
  } catch (err) {
    return res.status(400).json({ error: { message: 'Error assigning teacher to the course' } })
  }


  return res.json({
    message: 'success',
    data: {
      user_id: userCoursesInsertData.user_id,
      course_id: userCoursesInsertData.course_id,
    }
  })
}


unassignCourseHandler = async (req, res) => {

  try {
    await validatorHelper.validateCourseAssignAndUnassign(req.body)
  } catch (err) {
    console.error(err)
    return res.status(400).json({ error: err.errors[0] })
  }

  let teacherUserID = req.body.user_id
  var [isInt, courseID] = commonHelper.isPositiveInteger(req.params.courseID)
  if (!isInt) {
    return res.status(400).json({ error: { message: 'Invalid course id provided' } })
  }

  // Check if course exists
  let courseInfo = await coursesHelper.getCourseInfo(courseID)
  if (typeof courseInfo.error != 'undefined') {
    return res.status(400).json(courseInfo)
  }

  // Check if teacher user exists
  let userInfo = await usersHelper.getUserInfo('user_id', teacherUserID)
  if (typeof userInfo.error != 'undefined') {
    return res.status(400).json(userInfo)
  }

  // Check if teacher role is teacher
  if (userInfo.role_id != 'teacher') {
    return res.status(400).json({ error: { message: 'Incorrect role of the provided user_id, must be student' } })
  }


  // TODO - Check if this teacher id is the only teacher assigned to the course
  // then give error to disable the first before removing the last teacher
  // or add another teacher first before removing the last teacher


  try {
    // Check if teacher is assigned to the course
    let [rows] = await dbPool.execute(
      'SELECT `course_id` FROM `user_courses` WHERE `course_id` = ? AND `user_id` = ?',
      [courseID, teacherUserID]
    )
    if (rows.length < 1) {
      return res.status(400).json({ error: { message: 'cannot unassign teacher from the course as teacher is not assigned to the course' } })
    }
  } catch (err) {
    return res.status(400).json({ error: { message: 'Error checking if teacher is already assigned to the course' } })
  }

  // Delete the teacher from the course assignments
  try {
    // Assign course to the teacher
    let [result] = await dbPool.execute(
      'DELETE FROM `user_courses` WHERE `course_id` = ? AND `user_id` = ?',
      [courseID, teacherUserID]
    )

    // Check if the row was deleted successfully
    if (result.affectedRows < 1) {
      return res.status(400).json({ error: { message: 'Error unassigning teacher from the course' } })
    }


  } catch (err) {
    return res.status(400).json({ error: { message: 'Error unassigning teacher from the course' } })
  }


  return res.json({
    message: 'success',
    data: {
      user_id: teacherUserID,
      course_id: courseID,
    }
  })
}

setMarksHandler = async (req, res) => {
  // Validate request body
  try {
    await validatorHelper.validateSetMarks(req.body)
  } catch (err) {
    console.error(err)
    return res.status(400).json({ error: err.errors[0] })
  }

  // Round off marks to 2 decimal places
  req.body.marks = Math.round((req.body.marks + Number.EPSILON) * 100) / 100

  // Check if course id is valid
  var [isInt, courseID] = commonHelper.isPositiveInteger(req.params.courseID)
  if (!isInt) {
    return res.status(400).json({ error: { message: 'Invalid course id provided' } })
  }

  // Check if student user id is valid
  var [isInt, studentUserID] = commonHelper.isPositiveInteger(req.params.studentUserID)
  if (!isInt) {
    return res.status(400).json({ error: { message: 'Invalid student user id provided' } })
  }

  // Check if teacher is assigned to the course
  try {
    let [rows] = await dbPool.execute(
      'SELECT `course_id` FROM `user_courses` WHERE `course_id` = ? AND `user_id` = ?',
      [courseID, req.userSession.user.id]
    )
    if (rows.length < 1) {
      return res.status(403).json({ error: { message: 'Teacher does not have access to the course' } })
    }
  } catch (err) {
    return res.status(400).json({ error: { message: 'Error checking if teacher is assigned to the course' } })
  }



  // Check if student is enrolled
  try {
    let [rows] = await dbPool.execute(
      'SELECT `course_id` FROM `user_courses` WHERE `course_id` = ? AND `user_id` = ?',
      [courseID, studentUserID]
    )
    if (rows.length < 1) {
      return res.status(403).json({ error: { message: 'Student is not enrolled in the course' } })
    }
  } catch (err) {
    return res.status(400).json({ error: { message: 'Error checking if student is enrolled in the course' } })
  }



  // Get course details
  let courseInfo = await coursesHelper.getCourseInfo(courseID)
  if (typeof courseInfo.error != 'undefined') {
    return res.status(400).json({ error: courseInfo.error })
  }

  // console.log(courseInfo)

  // Set marks for the student in the course
  try {
    // console.log(req.body.marks)
    let [result] = await dbPool.execute(
      'UPDATE `user_courses` SET `marks` = ?, `marked_by_user_id` = ? WHERE `course_id` = ? AND `user_id` = ?',
      [req.body.marks, req.userSession.user.id, courseID, studentUserID]
    )

    if (result.affectedRows < 1) {
      return res.status(400).json({ error: { message: 'Error setting marks for the student' } })
    }
  } catch (err) {
    console.error(err)
    return res.status(400).json({ error: { message: 'Error setting marks for the student' } })
  }

  return res.json({
    message: 'success',
    data: {
      course_id: courseID,
      user_id: studentUserID,
      marks: req.body.marks
    }
  })


}

enrollCourseHandler = async (req, res) => {
  // Get course id from url parameters
  var [isInt, courseID] = commonHelper.isPositiveInteger(req.params.courseID)
  if (!isInt) {
    return res.status(400).json({ error: { message: 'Invalid course id provided' } })
  }

  // Get course details
  let courseInfo = await coursesHelper.getCourseInfo(courseID)
  if (typeof courseInfo.error != 'undefined') {
    return res.status(400).json(courseInfo)
  }

  // Check if course is enabled
  if (!courseInfo.enabled) {
    return res.status(400).json({ error: { message: 'Action not allowed as course is disabled' } })
  }

  // Check if user is already enrolled in the course
  try {
    let [rows] = await dbPool.execute(
      'SELECT `course_id` FROM `user_courses` WHERE `course_id` = ? AND `user_id` = ?',
      [courseID, req.userSession.user.id]
    )
    if (rows.length > 0) {
      return res.status(400).json({ error: { message: 'User is already enrolled in the course' } })
    }
  } catch (err) {
    return res.status(400).json({ error: { message: 'Error checking if user is already enrolled in the course' } })
  }

  // The data to be inserted into the user_courses table
  let userCoursesInsertData = {
    user_id_course_id_mix: req.userSession.user.id + '_' + courseID,
    user_id: req.userSession.user.id,
    course_id: courseID,
    created_at: Date.now()
  }

  try {
    // Enroll student user in the course
    let [result] = await dbPool.execute(
      'INSERT INTO `user_courses` (`user_id_course_id_mix`, `user_id`,`course_id`,  `created_at`) VALUES (?, ?, ?, ?)',
      [userCoursesInsertData.user_id_course_id_mix, userCoursesInsertData.user_id, userCoursesInsertData.course_id, userCoursesInsertData.created_at]
    )
    if (result.affectedRows < 1) {
      return res.status(400).json({ error: { message: 'Error enrolling user in the course' } })
    }

  } catch (err) {
    return res.status(400).json({ error: { message: 'Error enrolling user in the course' } })
  }

  return res.json({
    message: 'success',
    data: {
      course_id: courseID,
      // course: {
      //   id: userCoursesInsertData.course_id,
      //   name: courseInfo.name
      // }
    }
  })
}


withdrawCourseHandler = async (req, res) => {
  // Get course id from url parameters
  var [isInt, courseID] = commonHelper.isPositiveInteger(req.params.courseID)
  if (!isInt) {
    return res.status(400).json({ error: { message: 'Invalid course id provided' } })
  }

  // Get course details
  let courseInfo = await coursesHelper.getCourseInfo(courseID)
  if (typeof courseInfo.error != 'undefined') {
    return res.status(400).json(courseInfo)
  }

  // Check if course is enabled
  if (!courseInfo.enabled) {
    return res.status(400).json({ error: { message: 'Action not allowed as course is disabled' } })
  }


  let userCourseData

  // Check if user is enrolled in the course
  try {
    let [rows] = await dbPool.execute(
      'SELECT `course_id`, `marks` FROM `user_courses` WHERE `course_id` = ? AND `user_id` = ?',
      [courseID, req.userSession.user.id]
    )
    if (rows.length < 1) {
      return res.status(400).json({ error: { message: 'Unable to withdraw, User is not enrolled in the course' } })
    }
    userCourseData = rows[0]
    // console.log('userCourseData', userCourseData)
    // Check if marks are assigned to the user
    if (userCourseData.marks != null) {
      return res.status(400).json({ error: { message: 'Unable to withdraw, The course already has been graded by teacher' } })
    }

  } catch (err) {
    return res.status(400).json({ error: { message: 'Error checking if user is already enrolled in the course' } })
  }


  try {
    // Delete the user from the course enrollment
    let [result] = await dbPool.execute(
      'DELETE FROM `user_courses` WHERE `course_id` = ? AND `user_id` = ?',
      [courseID, req.userSession.user.id]
    )

    if (result.affectedRows < 1) {
      return res.status(400).json({ error: { message: 'Error withdrawing user from the course' } })
    }


  } catch (err) {
    return res.status(400).json({ error: { message: 'Error withdrawing user from the course' } })
  }

  return res.json({
    message: 'success',
    data: {
      course_id: courseID,
    }
  })
}


module.exports = {
  createCourseHandler,
  getCourseHandler,
  updateCourseHandler,
  listCoursesHandler,
  listEnrollmentsHandler,
  disableCourseHandler,
  enableCourseHandler,
  assignCourseHandler,
  unassignCourseHandler,
  setMarksHandler,
  enrollCourseHandler,
  withdrawCourseHandler
}
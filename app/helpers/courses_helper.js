
const db = require('../db')
const dbPool = db.GetDbPool()

getCourseInfo = async (courseID) => {
  if (typeof courseID != 'number' || !Number.isInteger(courseID) || courseID.length < 1) {
    return { error: { message: 'Invalid course id provided' } }
  }
  try {

    const getCourseInfoQuery =
      ' SELECT `courses`.`course_id`, ' +
      '   `courses`.`name`, ' +
      '   `courses`.`enabled`, ' +
      '   `courses`.`created_at`, ' +
      '   `users`.`user_id` AS `created_by_user_id`, ' +
      '   `users`.`name` AS `created_by_user_name` ' +
      ' FROM `courses` ' +
      '   INNER JOIN `users` ON `courses`.`created_by_user_id` = `users`.`user_id` ' +
      ' WHERE `courses`.`course_id` = ? '

    // Get course info
    let [rows] = await dbPool.execute(
      getCourseInfoQuery,
      [courseID]
    )
    if (rows.length < 1) {
      return { error: { message: 'Invalid course id provided, not found' } }
    }

    rows[0].enabled = !!rows[0].enabled
    return rows[0]

  } catch (err) {
    console.log(err)
    return { error: { message: 'Server error: Error getting course details' } }
  }
}


// Get enrollments with the course id and role id of the user
// If courseIDs is an empty array then it will query all courses
// This function is optmisied to fetch all enrollments for list of courses in a single query
getCourseEnrollments = async (courseIDs, userIDs, roleIDs) => {

  let courseIDsList = [];
  let userIDsList = [];
  let roleIDsList = [];

  // Check if courseIDs is an array
  if (Array.isArray(courseIDs)) {
    // Check if courseIDs has any values other than integer numbers
    if (courseIDs.length > 0) {
      for (let i = 0; i < courseIDs.length; i++) {
        if (typeof courseIDs[i] != 'number' || !Number.isInteger(courseIDs[i])) {
          return { error: { message: 'Invalid course ids provided, array contains non integer values' } }
        }
      }
      courseIDsList = courseIDs
    }
  }

  //  Check if userIDs is an array
  if (Array.isArray(userIDs)) {
    // Check if userIDs has any values other than integer numbers
    if (userIDs.length > 0) {
      for (let i = 0; i < userIDs.length; i++) {
        if (typeof userIDs[i] != 'number' || !Number.isInteger(userIDs[i])) {
          return { error: { message: 'Invalid user ids provided, array contains non integer values' } }
        }
      }
      userIDsList = userIDs
    }
  }

  // Check if roleIDs is an array
  if (Array.isArray(roleIDs)) {
    // Check if roleIDs has any values other than string
    if (roleIDs.length > 0) {
      for (let i = 0; i < roleIDs.length; i++) {
        if (typeof roleIDs[i] != 'string') {
          return { error: { message: 'Invalid role ids provided, array contains non string values' } }
        }
      }
    }
  }


  // Select course and user id from user_courses table and the role id from users table
  let selectQuery =
    'SELECT `user_courses`.`user_id`, `user_courses`.`course_id`, `users`.`role_id`, `users`.`name` AS `user_name` ' +
    'FROM `user_courses` ' +
    'INNER JOIN `users` ON `user_courses`.`user_id` = `users`.`user_id` '


  let selectQueryValues = []

  // If courseIDs is an empty array then it will query all courses
  if (courseIDsList.length > 0) {
    selectQuery += 'WHERE `user_courses`.`course_id` IN (?) '
    selectQueryValues.push(courseIDsList)
  }

  // If userIDs is an empty array then it will query all users
  if (userIDsList.length > 0) {
    selectQuery += 'AND `user_courses`.`user_id` IN (?) '
    selectQueryValues.push(userIDsList)
  }

  // If roleIDs is an empty array then it will query all roles
  if (roleIDsList.length > 0) {
    selectQuery += 'AND `users`.`role_id` IN (?) '
    selectQueryValues.push(roleIDsList)
  }


  selectQuery += 'ORDER BY `user_courses`.`created_at` DESC '

  // console.log('selectQuery123', selectQuery)

  // .query() function is used here instead of .execute() because execute does not support IN clause
  // https://github.com/sidorares/node-mysql2/issues/476

  let [rows] = await dbPool.query({
    sql: selectQuery,
    values: [courseIDs],
  })


  // this is used as a hashmap to store the course id as key and the values
  let userCoursesObj = {};

  if (rows.length > 0) {
    for (let i = 0; i < rows.length; i++) {
      if (typeof userCoursesObj[rows[i].course_id] == 'undefined') {
        userCoursesObj[rows[i].course_id] = {
          course_id: rows[i].course_id,
          teachers: [],
          students: []
        }
      }

      // If role is teacher then push to teachers array 
      if (rows[i].role_id == 'teacher') {
        userCoursesObj[rows[i].course_id].teachers.push({
          user_id: rows[i].user_id,
          name: rows[i].user_name
        })
      }

      // If role is student then push to students array
      if (rows[i].role_id == 'student') {
        userCoursesObj[rows[i].course_id].students.push({
          user_id: rows[i].user_id,
          name: rows[i].user_name
        })
      }


    }
  }

  return userCoursesObj
}




module.exports = {
  getCourseInfo,
  getCourseEnrollments
}
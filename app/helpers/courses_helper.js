
const db = require('../db')
const dbPool = db.GetDbPool()

getCourseInfo = async (courseID) => {
  if (typeof courseID != 'number' || !Number.isInteger(courseID) || courseID.length < 1) {
    return { error: { message: 'Invalid course id provided2' } }
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

    return rows[0]

  } catch (err) {
    console.log(err)
    return { error: { message: 'Server error: Error getting course details' } }
  }
}

module.exports = {
  getCourseInfo,
}
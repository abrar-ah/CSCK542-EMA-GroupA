
const argon2 = require('argon2');
const { v4: uuidv4 } = require('uuid');

const usersHelper = require('../helpers/users_helper')

const db = require('../db');
dbPool = db.GetDbPool();

const createUserSession = async (email, password) => {

  try {

    let userInfo = await usersHelper.getUserInfo('email', email, true)
    // console.log(userInfo)
    if (typeof userInfo.error != 'undefined') {
      return {error : userInfo.error}
    }

    // This checks if the user is active or not
    if (userInfo.status != 'active') {
      return { error: { message: 'Invalid email or password' } }
    }


    // This checks if the password is correct
    let passwordMatch = await argon2.verify(userInfo.password, password)
    if (!passwordMatch) {
      return { error: { message: 'Invalid email or password' } }
    }

    // This is where we create the session
    let sessionToken = uuidv4();
    let [insertResults, insertFields] = await dbPool.execute(
      'INSERT INTO `user_sessions` (`user_id`, `session_id`, `status`, `created_at`) VALUES (?, ?, ?, ?)',
      [userInfo.user_id, sessionToken, 'active', Date.now()]
    );

    return { data: { session_token: sessionToken } }

  } catch (err) {
    console.log(err)
    return { error: { message: 'Server error' } }
  }

}

const deleteUserSession = async (session_token) => {

  try {
    // Updates the session row status field to deleted if the status is active
    let [rows, fields] = await dbPool.execute(
      'UPDATE `user_sessions` SET `status` = ? WHERE `session_id` = ? AND `status` = ?',
      ['deleted', session_token, 'active']
    );

    // Check if the session row was updated or not
    if (rows.affectedRows == 0) {
      return { error: { message: 'Invalid session' } }
    }
    return { data: { message: 'success' } }
  } catch (err) {
    return { error: { message: 'Server error' } }
  }

}

// This function is used to get the user and session data objects from the session_token
const getUserSession = async (session_token) => {

  try {

    // This is the query which uses JOIN to get both the user and session data in a single query
    // to avoid making two separate queries
    const sessionQuery =
      'SELECT users.user_id AS user_id, ' +
      '  users.status AS user_status, ' +
      '  users.email AS user_email, ' +
      '  user_sessions.status AS session_status, ' +
      '  users.role_id AS role_id, ' +
      '  session_id, ' +
      '  user_sessions.created_at AS session_created_at, ' +
      '  users.created_at AS user_created_at ' +
      'FROM `user_sessions` ' +
      '  JOIN `users` ON `user_sessions`.`user_id` = `users`.`user_id` ' +
      'WHERE `session_id` = ? AND `user_sessions`.`status` = ?';

    let [rows, fields] = await dbPool.execute(
      sessionQuery,
      [session_token, 'active']
    );

    // console.log(rows); // rows contains rows returned by server
    // console.log(fields); // fields contains extra meta data about results, if available

    // If an active session is not found, return an error
    if (rows.length == 0) {
      return { error: { message: 'Invalid session' } }
    }

    let userAndSessionData = rows[0];
    console.log('returning userAndSessionData')
    return {
      data: {
        user: {
          id: userAndSessionData.user_id,
          status: userAndSessionData.user_status,
          email: userAndSessionData.user_email,
          role_id: userAndSessionData.role_id,
          created_at: userAndSessionData.user_created_at,
        },
        session: {
          id: userAndSessionData.session_id,
          status: userAndSessionData.session_status,
          created_at: userAndSessionData.session_created_at,
        }
      }
    }

  } catch (err) {
    console.log(err)
    return { error: { message: 'Server error' } }
  }

}


module.exports = { createUserSession, deleteUserSession, getUserSession };
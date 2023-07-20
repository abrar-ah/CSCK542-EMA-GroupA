const commonHelper = require('../helpers/common_helper')
const validatorHelper = require('../helpers/validator_helper')
const userSessionsHelper = require('../helpers/user_sessions_helper')

const createSessionHandler = async (req, res) => {
  try {
    await validatorHelper.validateLogin(req.body)
  } catch (error) {
    return res.status(400).json({ error: error.errors[0] })
  }

  let userSessionData = await userSessionsHelper.createUserSession(req.body.email, req.body.password)
  // console.log('userSessionData', userSessionData)

  if (typeof userSessionData.error != 'undefined') {
    return res.status(400).json(userSessionData)
  }

  let sessionToken = userSessionData.data.session_token
  res.cookie('session_token', sessionToken, { httpOnly: true, secure: true })
  res.json(userSessionData)
}

const getSessionHandler = async (req, res) => {

  // Updates the timestamp to a string
  req.userSession.user.created_at = await commonHelper.msTimeToString(req.userSession.user.created_at)
  req.userSession.session.created_at = await commonHelper.msTimeToString(req.userSession.session.created_at)

  return res.json({
    data: req.userSession
  })
}

const deleteSessionHandler = async (req, res) => {
  let deleteSession = await userSessionsHelper.deleteUserSession(req.cookies.session_token)

  
  if (typeof deleteSession.error != 'undefined') {
    return res.status(400).json(deleteSession)
  }

  // Deletes the cookie named 'session_token'
  res.clearCookie('session_token')
  return res.json({ message: 'success' });
}

module.exports = { createSessionHandler, getSessionHandler, deleteSessionHandler }
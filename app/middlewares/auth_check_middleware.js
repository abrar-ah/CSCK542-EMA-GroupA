
const userSessionsHelper = require('../helpers/user_sessions_helper')


// Checks if the user is logged in using the cookie named 'login_token'
const authCheckMiddleware = async (req, res, next) => {

  // check if the client sent a cookie named 'session_token'
  if ('session_token' in req.cookies) {

    // retrieve the value of the cookie
    var sessionToken = req.cookies.session_token;
    if (sessionToken.length < 10) {
      return res.status(403).json({ error: { message: 'Invalid session' } })
    }

    // check if the session token is valid
    let userSession = await userSessionsHelper.getUserSession(sessionToken)
    if (typeof userSession.error != 'undefined') {
      return res.status(400).json({ userSession })
    }

    req.userSession = userSession.data
    return next()

  } else {
    // no login cookie
    res.status(403).json({ error: { message: 'No session token cookie' } })
  }
};


module.exports = authCheckMiddleware


// Only allows requests from users with the specified allowed roles
checkRolesMiddleware = (role_ids) => {
  return async (req, res, next) => {

    for (let role_id of role_ids) {
      if (req.userSession.user.role_id == role_id) {
        return next()
      }
    }
    return res.status(403).json({ error: { message: 'You are not authorized to perform this action' } })
  }
}

module.exports = checkRolesMiddleware
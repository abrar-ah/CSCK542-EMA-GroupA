
// This function can get user info from user_id or email depending on the value of idType
// idType: 'user_id' or 'email'
// idValue: the value of the idType
// withPassword is optional boolean
const getUserInfo = async (idType, idValue, withPassword) => {

  if (idType === 'user_id') {
    if (typeof idValue != 'number' || !Number.isInteger(idValue) || idValue.length < 1) {
      return { error: { message: 'Invalid user id provided' } }
    }
  } else if (idType === 'email') {
    if (typeof idValue != 'string' || idValue.length < 1) {
      return { error: { message: 'Invalid email provided' } }
    }
  } else {
    return { error: { message: 'Invalid input parameter idType' } }
  }

  console.log(idType, idValue, withPassword)
  try {

    let selectFields = ['status', 'user_id', 'name', 'email', 'role_id', 'created_at']
    if (withPassword) {
      selectFields.push('password')
    }

    let sqlQuery = 'SELECT `' + selectFields.join('`, `') + '` FROM `users` WHERE `' + idType + '` = ?'
    let [rows] = await dbPool.execute(
      sqlQuery,
      [idValue]
    )

    console.log(sqlQuery)
    console.log(rows)
    console.log(idValue)

    if (rows.length < 1) {
      return { error: { message: 'Invalid ' + idType + ' provided, not found' } }
    }

    return rows[0]

  } catch (err) {
    console.error(err)
    return { error: { message: 'Server error: Error getting user details' } }
  }
}


module.exports = {
  getUserInfo
}
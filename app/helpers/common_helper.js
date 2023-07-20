

// Converts milliseconds timestamp to ISO 8601 string
const msTimeToString = async (msTimestamp) => {
  return new Date(msTimestamp).toISOString().slice(0, -4) + String(msTimestamp).slice(-3).padStart(3, '0') + 'Z'
}

const isPositiveInteger = (str) => {
  var n = Number(str);
  return [Number.isInteger(n) && n > 0, n];
}

module.exports = {
  msTimeToString,
  isPositiveInteger
}
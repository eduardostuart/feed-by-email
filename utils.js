exports.isYesterday = function (date) {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  return isSameDate(yesterday, date)
}

function isSameDate (dateA, dateB) {
  return dateA.getDate() === dateB.getDate() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getFullYear() === dateB.getFullYear()
}

var express = require('express');
var router = express.Router();

const sessionsHandlers = require('../handlers/sessions_handlers')

// POST /sessions
// Used to login or create a user session
router.post('/sessions', sessionsHandlers.createSessionHandler);


// DELETE /sessions
// Used to logout or delete the user session
router.delete('/sessions', sessionsHandlers.deleteSessionHandler);

module.exports = router;

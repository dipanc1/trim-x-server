const router = require('express').Router();

router.get('/health', (req, res) => {
    res.send('OK');
});

module.exports = router;
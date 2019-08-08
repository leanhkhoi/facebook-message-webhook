var express = require('express');
var router = express.Router();
var eventSources = require('./event-data');

router.get('/', function(req, res, next) {
    res.writeHead(200, {
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
    });

    res.write('/n');
    let messageId = 0;

    const intervalId = setInterval(() => {
        res.write(`id: ${messageId}\n`);
        messageId += 1;
        if (eventSources.length !== 0) {
            res.write(`data: ${JSON.stringify(eventSources)}\n\n`);
            // never set eventSources = [], because eventSources is cursor (reference) , not real object
            eventSources.length = 0;
        }
    }, 1000);

    req.on('close', () => {
        console.log('close');
        clearInterval(intervalId);
    });
});

module.exports = router;

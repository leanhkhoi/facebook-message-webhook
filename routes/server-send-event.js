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
        res.write(`data: Test Message -- ${Date.now()}\n\n`);
        console.log("send source: " + eventSources);
        if (eventSources.length !== 0) {
            res.write(eventSources.toString());
            eventSources = [];
            eventSources.length = 0;
        }
        console.log("after send source:" + eventSources);
        messageId += 1;
    }, 1000);

    req.on('close', () => {
        console.log('close');
        clearInterval(intervalId);
    });
});

module.exports = router;

// in use case server send event to client, particularly in this case, we should not use 'Connection': 'keep-alive', because:
// 1. We can not send event to all client (ex. user open multi tabs, or multi browser ). We just send a event at time to only a entry point
// 2. We need use global array or queue, risk of memory management
// So, consider using socketIO
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
        // must have unique id
        res.write(`id: ${messageId}\n`);
        messageId += 1;

        // must have data
        if (eventSources.length !== 0) {
            res.write(`data: ${JSON.stringify(eventSources)}\n\n`);
            // never set eventSources = [], because eventSources is cursor (reference) , not real object
            eventSources.length = 0;
        } else {
            res.write(`data: Empty Data\n\n`);
        }
    }, 1000);

    req.on('close', () => {
        console.log('close');
        clearInterval(intervalId);
    });
});

module.exports = router;

var express = require('express');
var router = express.Router();
var request = require('request');
var socketIO = require('../api/socket-io-api');

var user_access_token = process.env.USER_ACCESS_TOKEN;
const NOTIFY_FACEBOOK_MESSAGE_KEY = 'facebook_page_message';

/* GET users listing. */
router.get('/', function(req, res) {
    /** UPDATE YOUR VERIFY TOKEN **/
    const VERIFY_TOKEN = "idsolutions";
    console.log(VERIFY_TOKEN);

    // Parse params from the webhook verification request
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Check if a token and mode were sent
    if (mode && token) {

        // Check the mode and token sent are correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Respond with 200 OK and challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});

/* POST users listing. */
router.post('/', function(req, res) {
    // Parse the request body from the POST
    let body = req.body;

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {
        socketIO.sendNotification(NOTIFY_FACEBOOK_MESSAGE_KEY, body);

        // Iterate over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {

            // Get the webhook event. entry.messaging is an array, but
            // will only ever contain one event, so we get index 0
            let webhook_event = entry.messaging[0];
            //console.log(webhook_event);

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            //console.log('Sender PSID: ' + sender_psid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message, entry.id);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }

        });

        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
});

// Handles messages events
function handleMessage(sender_psid, received_message, pageId) {
    request({
        "uri": "https://graph.facebook.com/v4.0/" + pageId + "?fields=access_token",
        "qs": { "access_token": user_access_token },
        "method": "GET"
    }, (err, res, body) => {
        if (!err) {
            let data = JSON.parse(body);
            let response;

            // Check if the message contains text
            if (received_message.text) {

                // Create the payload for a basic text message
                response = {
                    "text": `You sent the message: "${received_message.text}". Now send me an image!`
                }
            }

            // Sends the response message
            callSendAPI(sender_psid, response, data.access_token);
        } else {
            console.error("Unable to send message:" + err);
        }
    });


}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response, access_token) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v4.0/me/messages",
        "qs": { "access_token": access_token },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

module.exports = router;

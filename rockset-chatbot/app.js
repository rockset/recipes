const express = require('express');
const body_parser = require('body-parser');
const handleMessage = require("./handleMessage");

const app_port = process.env.PORT;
const verify_token = process.env.VERIFY_TOKEN;

const app = express().use(body_parser.json());

app.listen(process.env.PORT, () => console.log("webhook is listening"));

// Accepts GET requests at the / endpoint
app.get('/webhook', (req, res) => {

  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verify_token) {
      console.log('verified');
      // Respond with 200 OK
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden'
      res.sendStatus(403);
    }
  }
});

// Accepts POST requests at the / endpoint
app.post('/webhook', (req, res) => {

  let body = req.body;
  if (body.object === 'page') {

    body.entry.forEach(function(entry) {
        let event = entry.messaging[0];
        if (event.message && event.message.text) {
            // handle the message
            handleMessage(event);
        }
    });
    // Return a '200 OK' response
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found'
    res.sendStatus(404);
  }
});

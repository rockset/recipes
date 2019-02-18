const request = require('request');

// dialogflow client
const dgClient = require('apiai')(process.env.DG_TOKEN);

// rockset node client
const rs = require('rockset')(process.env.ROCKSET_APIKEY)

const page_access_token = process.env.PAGE_ACCESS_TOKEN;

// query for listings
const q_listing = 'select id, name, price, property_type'
                  + ' from airbnb_listings
                  + ' where lower(city) like :city and accommodates::int >= :number'
                  + ' order by number_of_reviews desc'
                  + ' limit 1';

// query for listings with dates
const q_listing_dates = 'with listings as ('
                        + ' select id, name, price, property_type'
                        + ' from airbnb_listings'
                        + ' where lower(airbnb_listings.city) like :city and airbnb_listings.accommodates::int >= :number'
                        + ' order by airbnb_listings.number_of_reviews desc'
                        + ')'
                        + ' select listings.id, listings.name, listings.property_type, listings.price'
                        + ' from listings, airbnb_calendar'
                        + ' where airbnb_calendar.date = :date and airbnb_calendar.available = :avail'
                        + ' and airbnb_calendar.listing_id = listings.id'
                        + ' limit 1'

// query for more information regarding listings
const q_moreinfo = 'select summary from airbnb_listings where id = :listing_id'

// query for listing user reviews
const q_reviews = 'select comments, date'
                  + ' from airbnb_reviews'
                  + ' where listing_id = :listing_id'
                  + ' order by date desc'
                  + ' limit 3'

var listing_id = '';

function queryDataListings(sender_id, city, date, number, oft) {
    let q = q_listing;

    // if date is specified use the date query
    if (date) {
        q = q_listing_dates;
    }

    q += `offset ${oft}`

    rs.queries.query({
        'sql': {
            'query': q,
            'parameters': [
                {'name': 'city', 'type': 'string', 'value': city},
                {'name': 'number', 'type': 'int', 'value': number},
                {'name': 'date', 'type': 'string', 'value': date},
                {'name': 'avail', 'type': 'string', 'value': 't'},
                {'name': 'offset', 'type': 'int', 'value': oft}
            ]
        }
    }, function(error, response, body) {
        if (error) {
            return console.error('error: ', error);
        }

        if (!response.results || !response.results.length) {
            callSendAPI(sender_id, 'No listings found :(');
        } else {
            var result = '\n\n' + response.results[0].name;
            result += '\nType: ' + response.results[0].property_type;
            result += '\nPrice: ' + response.results[0].price + ' per night';
            result += '\n\nReply \'next\' to get another listing';
            result += ' or \'details/reviews\' to get information for this listing.';

            listing_id = response.results[0].id;
            callSendAPI(sender_id, result);
        }
    });
}

function queryReviews(sender_id) {
    rs.queries.query({
        'sql': {
            'query': q_reviews,
            'parameters': [
                {'name': 'listing_id', 'type': 'string', 'value': listing_id}
            ]
        }
    }, function(error, response, body) {
        if (error) {
            return console.error('error: ', error);
        }

        if (!response.results || !response.results.length) {
            callSendAPI(sender_id, 'No reviews found :(');
        } else {
            var result = '';
            for (i = 0; i < response.results.length; ++i) {
                result += '\n\nDate: ' + response.results[i].date;
                result += '\n' + response.results[i].comments;
            }
            result += '\n\nReply \'next\' to get another listing';
            result += ' or \'details\' to get information for this listing.';
            callSendAPI(sender_id, result);
        }
    });
}

function queryMoreInfo(sender_id) {
    rs.queries.query({
        'sql': {
            'query': q_moreinfo,
            'parameters': [
                {'name': 'listing_id', 'type': 'string', 'value': listing_id}
            ]
        }
    }, function(error, response, body) {
        if (error) {
            return console.error('error: ', error);
        }

        if (!response.results || !response.results.length) {
            callSendAPI(sender_id, 'No reviews found :(');
        } else {
            var result = '\n\n' + response.results[0].summary;
            result += '\n\nReply \'next\' to get another listing';
            result += ' or \'reviews\' to get information for this listing.';
            callSendAPI(sender_id, result);
        }
    });
}

// send result back to messenger
function callSendAPI(sender_id, result) {
  // Construct the message body
  let request_body = {
    'recipient': {
      'id': sender_id
    },
    'message': {
        'text': result
    }
  }

  request({
    'uri': 'https://graph.facebook.com/v3.2/me/messages',
    'qs': { 'access_token': page_access_token },
    'method': 'POST',
    'json': request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error('Unable to send message:' + err);
    }
  });
}

// handle message
module.exports = (event) => {
    const sender_id = event.sender.id;
    const message = event.message.text;

    const dgSession = dgClient.textRequest(message, {sessionId: 'vacationrentals'});
    dgSession.on('response', (response) => {
        let intent = response.result.metadata.intentName;
        console.log('intent: ', intent);
        console.log('response: ', response);
        if (intent.startsWith('rentalcity')) {
            var city, date, number;
            var offset = 0;
            // check if it is a follow up intent
            if (intent.indexOf('more') > -1 || intent.indexOf('next') > -1) {
                city = response.result.contexts[0].parameters['city'].toLowerCase();
                date = response.result.contexts[0].parameters['date'];
                number = response.result.contexts[0].parameters['number'];
                offset = 5 - response.result.contexts[0].lifespan;
            } else {
                city = response.result.parameters['city'].toLowerCase();
                date = response.result.parameters['date'];
                number = response.result.parameters['number'];
            }

            city = '%' + city + '%'
            // if number not provided set to 0
            if (!number) {
                number = 0;
            }
            queryDataListings(sender_id, city, date, number, offset);
        } else if (intent == 'reviews') {
            queryReviews(sender_id);
        } else if (intent == 'moreinfo') {
            queryMoreInfo(sender_id);
        } else if (intent == 'Default Welcome Intent') {
            const result = response.result.fulfillment.speech;
            callSendAPI(sender_id, result);
        } else {
            callSendAPI(sender_id, 'Sorry, I don\'t understand')
        }
    });

    dgSession.on('error', error => console.log(error));
    dgSession.end();
};

## The Binary Survey

This is a demo of using Rockset to collect and display responses to a simple survey.

It consists of two parts:
- a static web page written in plain HTML/CSS/Javascript
- thin Python lambda functions acting as proxies for calling the Rockset API

### How it Works - Voting
When the web page loads, it generates a random UID in a JSON "vote" object, such as:
```
{
  "_id": "user739701703"
}
```
The vote is stored to the browser's local storage and also saved, via a lambda, in raw JSON form as a [document in Rockset](https://docs.rockset.com/concepts/#documents).

When the user clicks a choice for one of the questions, a boolean field is added to the vote indicating the choice (false for left, true for right):
```
{
  "_id": "user739701703",
  "tabs_spaces": false
}
```
The user can add more choices or even change previous choices:
```
{
  "_id": "user739701703",
  "tabs_spaces": true,
  "vim_emacs": true
}
```
Every time the vote changes, the raw JSON object is added to Rockset again and, because the [`_id` field](https://docs.rockset.com/special-fields/#id) matches, any previous votes are overwritten. Since the vote is also stored in the browser's local storage, a user can navigate away from the page and come back to find their previously selected choices persisted.

### How it Works - Results

To aggregate the results, the client makes a SQL query to Rockset through the lambda, using [aggregate functions](https://docs.rockset.com/aggregate-functions/):
```
SELECT 
    ARRAY_CREATE(COUNT_IF("tabs_spaces"), COUNT("tabs_spaces")) AS q0, 
    ARRAY_CREATE(COUNT_IF("vim_emacs"), COUNT("vim_emacs")) AS q1, 
    ARRAY_CREATE(COUNT_IF("frontend_backend"), COUNT("frontend_backend")) AS q2, 
    # ...
    count(*) AS total 
FROM demo.binary_survey
```
The result comes back as a JSON with response counts:
```
{
  "q0": [
    102,
    183
  ],
  "q1": [
    32,
    169
  ],
  "q2": [
    146,
    180
  ],
  ...
  "total": 212,
}
```
The client polls Rockset for fresh results (every 10 seconds) and rerenders the HTML elements in accordance with the response.

### Deploying

To deploy:
- serve the `client` folder at a static location
- get a Rockset API key from the [Rockset console](https://console.rockset.com)
- deploy the lambda to production by running:
```
cd lambda
echo 'rockset_api_key_here' > APIKEY
sls deploy -s prod
```

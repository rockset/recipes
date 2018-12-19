times = {};
window.onload = function () {
    var dps = [];
    var chart = new CanvasJS.Chart("chartContainer", {
        title:{
            text: "Incoming Tweets"
        },
        axisY: {
            includeZero: false
        },      
        data: [{
            type: "spline",
            dataPoints: dps
        }]
    });

    var collectionName = "twitter-kinesis-demo";

    var xVal = -1;
    var yVal = 100; 
    var updateInterval = 2000;
    var dataLength = 20;
    var lastSeen = 0;

    var updateChart = function () {
        var query = `
            select
                count(*),
                max(CAST(timestamp_ms AS INT))
            from
                "${collectionName}"
            where
                timestamp_ms > '${lastSeen}'
        `;
        makeQuery(query, function(msg) {
            var results = msg['results'];
            if (results.length < 1) {
                setTimeout(function(){updateChart()}, updateInterval);
                return;
            }

            lastSeen = Math.max(lastSeen, msg['results'][0]['?max']);
            xVal = new Date(lastSeen);
            yVal = msg['results'][0]['?count'];
            dps.push({
                x: xVal,
                y: yVal
            });
            if (dps.length > dataLength) {
                dps.shift();
            }
            chart.render();
            setTimeout(function(){updateChart()}, updateInterval);
        });
    };

    var updateRecentTweets = function () {
        var lastTenMinutes = lastSeen - 1000*10*60;
        var query = `
            select
                t.timestamp_ms,
                t.created_at as created_at,
                t.text as text,
                t.user.screen_name as screen_name
            from
                "${collectionName}" t
            where 
                timestamp_ms > '${lastTenMinutes}'
            order by
                t.timestamp_ms desc limit 7
        `;
        times['recents'] = new Date();
        makeQuery(query, function(msg) {
            var results = msg['results'];
            console.log(msg);
            $('#query_time_live').html("Latency: " + msg['stats'].elapsed_time_ms + " ms");
            $('#recents').empty();
            $('#recents').attr("title", query);
            for (i = 0; i < results.length; i++) { 
                var card = $('<div class="card-header"/>');
                $('#recents').append(
                    $('<div/>', {'class': 'card'}).append(
                    $('<div/>', {'class': 'card-header'}).append(
                        $('<h4/>', {text: `@${results[i].screen_name}`}).append(
                            $('<span/>', 
                            {class: 'job-title', text: new Date(results[i].created_at).toLocaleString()})
                        )
                    )
                ).append($('<div/>', {'class': 'card-content'})
                .append($('<p/>', {text: results[i].text})))
                .append($('<img/>', {id: 'my-img', class: 'imglogo', src: 'twitter.png'})));   
            }
            setTimeout(function(){updateRecentTweets()}, updateInterval);
        });      
    };

    var updateHashtags = function() {
        var lastHour = lastSeen - 1000*60*60;
        var query = `
        WITH filtered AS (
            select
              lower(ht.text) as text
            from
              "${collectionName}" t,
              unnest(t.extended_tweet.entities.hashtags) ht
            where
              t.timestamp_ms > '${lastHour}'
          )
          select
             count(text) as ct,
             text as hashtags 
          from
             filtered 
          group by
             text 
          order by
             ct DESC limit 8
        `;
        times['hashtags'] = new Date();
        makeQuery(query, function(msg) {
            var results = msg['results'];
            $('#query_time_hashtags').html("Latency: " + msg['stats'].elapsed_time_ms + " ms"); 
            $('#influencers').empty();
            for (i = 0; i < results.length; i++) { 
                var card = $('<div/>', {'class': 'card'})
                  .append(
                    $('<div/>', {'class': 'card-header'}).append(
                        $('<h4/>', {'style': 'font-weight: 900;', text: `#${results[i].hashtags}`})
                    )
                ).append($('<div/>', {'class': 'card-content'})
                .append($('<h3/>', {text: results[i].ct})));
                card.attr("hashtag", `${results[i].hashtags}`.toLowerCase());
                card.css("cursor", "pointer");
                card.click(function() {
                    window.location.href = `/hashtag.html?collection=${collectionName}&hashtag=${$(this).attr('hashtag')}`;
                });
                $('#influencers').append(card);
            }
            setTimeout(function(){updateHashtags()}, updateInterval);
        });
    }

    var getLatestTweet = function() {
        var query =`select max(CAST(timestamp_ms AS INT)) 
        from "${collectionName}" where CAST(timestamp_ms AS INT)`;
        makeQuery(query, function(msg) {
            var results = msg['results'];
            if (results.length > 0) {
                lastSeen = results[0]['?max']; 
            }            
        }, false);
    }
    
    getLatestTweet();
    updateRecentTweets();
    updateHashtags();
    updateChart();
}
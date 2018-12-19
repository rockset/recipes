times = {};
window.onload = function () {
    var collectionName = getParameterByName('collection');
    if (collectionName == null || collectionName.trim() === "") {
        $('body').html("<h2>No Collection Selected</h2>");
        return;
    }
    collectionName = collectionName.trim();

    var hashtag = getParameterByName('hashtag');
    if (hashtag == null || hashtag.trim() === "") {
        $('body').html("<h2>No Hashtag Selected</h2>");
        return;
    }
    hashtag = hashtag.trim();

    var xVal = -1;
    var yVal = 100; 
    var updateInterval = 2000;
    var dataLength = 20;
    var lastSeen = -1;

    var updateRecentTweets = function () {
        var query = `select
            t._id,
            t.user.screen_name,
            t.text,
            t.created_at
        from
            "${collectionName}" t
        where
            '${hashtag}' in (
            SELECT
                teh.text
            from
                unnest(t.entities.hashtags) teh
            )
        ORDER BY
            t._event_time desc LIMIT 7
        `
        times['recents'] = new Date();
        makeQuery(query, function(msg) {
            var results = msg['results'];
            $('#query_time_live').html("Latency: " + msg['stats'].elapsed_time_ms + " ms");
            $('#recents').empty();
            for (i = 0; i < results.length; i++) { 
                var card = $('<div/>', {'class': 'card'}).append(
                    $('<div/>', {'class': 'card-header'}).append(
                        $('<h4/>', {text: `@${results[i].screen_name}`}).append(
                            $('<span/>', 
                            {class: 'job-title', text: new Date(results[i].created_at).toLocaleString()})
                        )
                    )
                ).append($('<div/>', {'class': 'card-content'})
                .append($('<p/>', {text: results[i].text})))
                .append($('<img/>', {id: 'my-img', class: 'imglogo', src: 'twitter.png'}));
                $('#recents').append(card);
            }
            setTimeout(function(){updateRecentTweets()}, updateInterval);
        });
    };

    var updateCoOccurrences = function () {
        var query = `select
            te.text as ft,
            count(*) as ct
        from
            "${collectionName}" t,
            unnest(t.entities.hashtags) te
        where
            '${hashtag}' in (
            SELECT
                teh.text
            from
                unnest(t.entities.hashtags) teh
            )
            and te.text != '${hashtag}'
        GROUP BY
            te.text
        ORDER BY
            ct DESC LIMIT 8
        `;
        times['cooccurrences'] = new Date();
        makeQuery(query, function(msg) {
            var results = msg['results'];
            $('#query_time_cooccurrences').html("Latency: " + msg['stats'].elapsed_time_ms + " ms");
            $('#related').empty();
            for (i = 0; i < results.length; i++) { 
                var card = $('<div/>', {'class': 'card'}).append(
                    $('<div/>', {'class': 'card-header'}).append(
                        $('<h3/>', {text: `#${results[i].ft}`})
                    )
                ).append($('<div/>', {'class': 'card-content'})
                .append($('<p/>', {'style': 'text-align: center', text: nFormatter(results[i].ct)})));
                card.attr("hashtag", `${results[i].ft}`.toLowerCase());
                card.css("cursor", "pointer");
                card.click(function() {
                    window.location.href = `/hashtag.html?collection=${collectionName}&hashtag=${$(this).attr('hashtag')}`;
                });
                $('#related').append(card);    
            }
            setTimeout(function(){updateCoOccurrences()}, updateInterval);
        });
    };

    var updateInfluencers = function () {
        var query = `
            select
              t.user.screen_name,
              t.user.followers_count as fc
            from
              "${collectionName}" t
            where
              '${hashtag}' in (
                SELECT
                teh.text
                from
                unnest(t.entities.hashtags) teh
              )
            GROUP BY
              (t.user.screen_name, t.user.followers_count)
            ORDER BY
              t.user.followers_count desc LIMIT 5`;
        times['influencers'] = new Date();
        makeQuery(query, function(msg) {
            var results = msg['results'];
            $('#query_time_influencers').html("Latency: " + msg['stats'].elapsed_time_ms + " ms");
            $('#influencers').empty();
            for (i = 0; i < results.length; i++) {
                $('#influencers').append(
                  $('<div/>', {'class': 'row'}).append(
                    $('<div/>', {'class' : 'leader-entry'}).append(
                      $('<p/>', {'class': 'leader-name', text: `@${results[i].screen_name}`})
                    ).append(
                      $('<p/>', {'class': 'leader-followers', text: nFormatter(results[i].fc)}))
                  )
                );
            }
            // setTimeout(function(){updateInfluencers()}, updateInterval);
        });
    };

    var updateLinks = function () {
        var query = `
        select
            u.expanded_url as du,
            count(u.expanded_url) as ct
            from
            "${collectionName}" t,
            unnest(t.entities.urls) u
            where
            '${hashtag}' in (
                SELECT
                teh.text
                from
                unnest(t.entities.hashtags) teh
            )
            GROUP BY
            u.expanded_url
            ORDER BY
            ct DESC
            LIMIT
            10
        `;
        times['links'] = new Date();
        makeQuery(query, function(msg) {
            var results = msg['results'];
            $('#query_time_links').html("Latency: " + msg['stats'].elapsed_time_ms + " ms");
            $('#links').empty();
            for (i = 0; i < results.length; i++) { 
                var card = $('<div class="card-header"/>');
                $('#links').append(
                    $('<div/>', {'class': 'card'}).append(
                    $('<div/>', {'class': 'card-header'}).append(
                        $('<h1/>', {text: `${results[i].ct}`})
                    )
                ).append($('<div/>', {'class': 'card-content'})
                .append($('<p/>', {'style': 'overflow: visible; word-wrap: break-word; width: 200px'})
                    .append($('<a>')
                        .attr('href', `${results[i].du}`)
                        .attr('target', '_blank')
                        .text(`${results[i].du}`)))));    
            }
            setTimeout(function(){updateLinks()}, updateInterval);
        });
    };

    updateRecentTweets();
    updateCoOccurrences();
    updateInfluencers();
    updateLinks();
}
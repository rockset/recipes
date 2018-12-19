var QUERY_ENDPOINT = "https://api.rs2.usw2.rockset.com/v1/orgs/self/queries";
var AUTH_HEADER = "ApiKey {ROCKSET_API_KEY}";

function nFormatter(num) {
    if (num >= 1000000000) {
       return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'G';
    }
    if (num >= 1000000) {
       return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
       return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num;
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function makeQuery(query, successFn, async=true) {
    var req = {
        "sql": {
            "query": query, 
            "parameters": []
        }
    }

    $.ajax({
        type: "POST",
        beforeSend: function(request) {
            request.setRequestHeader("Authorization", AUTH_HEADER);
            request.setRequestHeader("Content-Type", "application/json");
        },
        url: QUERY_ENDPOINT,
        async: async,
        data: JSON.stringify(req),
        processData: false,
        success: successFn,
        error: function(msg) {
            console.log(msg);
        }
    });
}

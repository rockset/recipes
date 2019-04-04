var QUERY_ENDPOINT = "https://api.rs2.usw2.rockset.com/v1/orgs/self/queries";
var AUTH_HEADER = "ApiKey <API_KEY_HERE>";

apps = [];

var Loading = CarbonComponents.Loading;

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
        sql: {
            query: query,
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
        contentType: 'application/json',
        processData: false,
        success: successFn,
        error: function(msg) {
            console.log(msg);
        }
    });
}

function reload() {
  loadData();
}

function addDashMetric (key, value) {
  if (key === 'mau_percent_change') {
    value += '%';
  }

  // if (key === 'mau') {
  //   value = nFormatter(value);
  // }

  // if (key === 'raised_amount_usd') {
  //   key = nFormatter(parseInt(key, 10));
  // }

  if (key !== 'short_description') {
    $("#metrics").append(
      $('<div/>', {'class': 'content-body bx--tile', text: key}).append(
        $('<div/>', {'class': 'metric-number', text: nFormatter(value)})));
  }
}

function setCurrent(index) {
  app = apps[index];
  $("#app-title").text("App Details: " + app.App);
  $("#metrics").empty();
  for (key in app) {
    let val = app[key]
    addDashMetric(key, val);
  }
}

function addApp(appName, index) {
  $("#apps").append(
    $('<li/>', {'class': 'bx--list__item', 'onclick': `setCurrent(${index})`, text: appName }));
}

function createQuery(month) {
  return ` WITH \n\n-- # compute application statistics, MAU and percent change in MAU.\nappStats AS \n(\n   SELECT\n      rows.r[2][1].\"name\" AS app,\n      rows.r[2][1].\"company_name\" AS company,\n      rows.r[4][1] AS mau,\n      rows.r[4][4] AS mau_percent_change \n   FROM\n      app_annie_monthly a,\n      unnest(a.\"data\".\"table\".\"rows\" AS r) AS rows \n   WHERE\n      a._meta.s3.path LIKE 'app\\_annie/monthly/${month}/01/data/all\\_users\\_top\\_usage\\_US\\_iphone\\_100\\_%' \n),\n\n\n-- # Get list of crunchbase orgs to join with.\ncrunchbaseOrgs AS \n(\n   SELECT\n      founded_on AS founded_on,\n      uuid AS company_uuid,\n      short_description AS short_description,\n      company_name as company_name\n   FROM\n      \"crunchbase_organizations\" \n),\n\n\n-- # Get the JOINED relation from the above steps.\nappStatsWithCrunchbaseOrgs as \n(\n   SELECT\n      appStats.app as App,\n      appStats.mau as mau,\n      appStats.mau_percent_change as mau_percent_change,\n      crunchbaseOrgs.company_uuid as company_uuid,\n      crunchbaseOrgs.company_name as company_name,\n      crunchbaseOrgs.founded_on as founded_on,\n      crunchbaseOrgs.short_description as short_description\n   FROM\n      appStats \n      INNER JOIN\n         crunchbaseOrgs \n         ON appStats.company = crunchbaseOrgs.company_name \n),\n\n-- # Compute companyStatus = (IPO|ACQUIRED|CLOSED|OPERATING)\n-- # There may be more than one status associated with a company, so, we do the Group By and Min.\ncompanyStatus as \n(\n   SELECT\n      company_name,\n      min( \n      case\n         status \n         when\n            'ipo' \n         then\n            1 \n         when\n            'acquired' \n         then\n            2 \n         when\n            'closed' \n         then\n            3 \n         when\n            'operating' \n         then\n            4 \n      end\n) as status \n   FROM\n      \"crunchbase_organizations\" \n   GROUP BY\n      company_name \n),\n\n\n-- #  JOIN with companyStatus == (OPERATING), call it ventureFunded\nventureFunded as (SELECT\n   appStatsWithCrunchbaseOrgs.App,\n   appStatsWithCrunchbaseOrgs.company_name,\n   appStatsWithCrunchbaseOrgs.mau_percent_change,\n   appStatsWithCrunchbaseOrgs.mau,\n   appStatsWithCrunchbaseOrgs.company_uuid,\n   appStatsWithCrunchbaseOrgs.founded_on,\n   appStatsWithCrunchbaseOrgs.short_description\nFROM\n   appStatsWithCrunchbaseOrgs \n   INNER JOIN\n      companyStatus \n      ON appStatsWithCrunchbaseOrgs.company_name = companyStatus.company_name \n      AND companyStatus.status = 4),\n\n-- # Find the latest round that each company raised, grouped by company UUID\nlatestRound AS \n(\n   SELECT\n      company_uuid as cuid,\n      max(announced_on) as announced_on,\n      max(raised_amount_usd) as raised_amount_usd \n   FROM\n      \"crunchbase_funding_rounds\" \n   GROUP BY\n      company_uuid \n),\n\n\n-- # Join it back with crunchbase_funding_rounds to get other details about that company\nfundingRounds AS \n(\n   SELECT\n      cfr.company_uuid as company_uuid,\n      cfr.announced_on as announced_on,\n      cfr.funding_round_uuid as funding_round_uuid,\n      cfr.company_name as company_name,\n      cfr.investment_type as investment_type,\n      cfr.raised_amount_usd as raised_amount_usd,\n      cfr.country_code as country_code,\n      cfr.state_code as state_code,\n      cfr.investor_names as investor_names \n   FROM\n      \"crunchbase_funding_rounds\" cfr \n      JOIN\n         latestRound \n         ON latestRound.company_uuid = cfr.company_uuid \n         AND latestRound.announced_on = cfr.announced_on\n),\n\n-- # Finally, select the dataset with all the fields that are interesting to us. ventureFundedAllRegions\nventureFundedAllRegions AS (\n    SELECT\n       ventureFunded.App as App,\n       ventureFunded.company_name as company_name,\n       ventureFunded.mau as mau,\n       ventureFunded.mau_percent_change as mau_percent_change,\n       ventureFunded.short_description as short_description,\n       fundingRounds.announced_on as last_funding,\n       fundingRounds.raised_amount_usd as raised_amount_usd,\n       fundingRounds.country_code as country_code,\n       fundingRounds.state_code as state_code,\n       fundingRounds.investor_names as investor_names,\n       fundingRounds.investment_type as investment_type \n    FROM\n       ventureFunded \n       JOIN\n          fundingRounds \n          ON fundingRounds.company_uuid = ventureFunded.company_uuid)\n\nSELECT\n   * \nFROM\n   ventureFundedAllRegions \nWHERE\n   country_code = 'USA' \n   and state_code in \n   (\n      'CA',\n      'WA'\n   )\nORDER BY\n   mau_percent_change DESC LIMIT 100` 
}

function loadData(month) {
  loadingInstance = Loading.create(document.getElementById("my-loading"));
  loadingInstance.set(true);
  makeQuery(createQuery(month), function(res) {
    apps = res.results;
    $("#apps").empty();
    for (let i=0; i < apps.length; i++) {
      addApp(apps[i].App, i);
    }
    setCurrent(0);
    loadingInstance.set(false);
  });
}

function updateMonth(month) {
  var select = document.getElementById("select-id");
  var selectedValue = select.options[select.selectedIndex].value;
  loadData(selectedValue);
}

window.onload = function () {
  loadData('2018-06');
}
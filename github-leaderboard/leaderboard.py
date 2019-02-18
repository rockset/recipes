import json

from rockset import Client, Q

import os
from os import path
from dotenv import load_dotenv

CURRENT_DIR = path.dirname(os.path.abspath(__file__))

load_dotenv(dotenv_path=os.path.join(CURRENT_DIR, 'config.env'), override=True)

client = Client(api_server=os.environ.get('ROCKSET_APISERVER'),
                api_key=os.environ.get('ROCKSET_APIKEY'))

TOP_CONTRIBUTORS_QUERY = '''
WITH multi_contributor_repos as (
    SELECT gh.repo.name AS repo_name
    FROM "github" gh
    WHERE type = 'CommitCommentEvent'
    GROUP BY gh.repo.name
    HAVING COUNT(DISTINCT gh.actor.display_login) > 10
)
SELECT gh.actor.display_login Contributor, COUNT(gh.actor.display_login) AS Commits
FROM "github" gh
WHERE type = 'CommitCommentEvent' AND gh.repo.name IN (SELECT * FROM multi_contributor_repos)
GROUP BY gh.actor.display_login
ORDER BY Commits DESC
LIMIT 10;
'''

INDIVIDUAL_CONTRIBUTOR_RANK = '''
WITH
multi_contributor_repos as (
    SELECT gh.repo.name AS repo_name
    FROM "github" gh
    WHERE type = 'CommitCommentEvent'
    GROUP BY gh.repo.name
    HAVING COUNT(DISTINCT gh.actor.display_login) > 10
),
rank as (
    SELECT gh.actor.display_login Contributor, COUNT(gh.actor.display_login) AS Commits
    FROM "github" gh
    WHERE type = 'CommitCommentEvent' AND gh.repo.name IN (SELECT * FROM multi_contributor_repos)
    GROUP BY gh.actor.display_login
)
SELECT COUNT(*) as Rank
FROM rank
WHERE Commits >= (
    SELECT Commits FROM rank
    WHERE Contributor = '{}')
'''

HEADERS = {"Access-Control-Allow-Origin": "*"}


def contributors(event, context):
    try:
        results = client.sql(Q(TOP_CONTRIBUTORS_QUERY)).results()
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps(results)}
    except Exception as e:
        print('Error finding top contributors {}'.format(e))
        return {"statusCode": 500, "headers": HEADERS,
                "body": json.dumps({'msg': 'Internal Error'})}


def rank(event, context):
    try:
        username = event.get('pathParameters', {}).get('username', None)
        if not username:
            return {"statusCode": 400, "headers": HEADERS,
                    "body": json.dumps({'msg': 'Please provide "username"'})}
        else:
            results = client.sql(Q(INDIVIDUAL_CONTRIBUTOR_RANK.format(username))).results()
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps(results)}
    except Exception as e:
        print('Error finding rank {}'.format(e))
        return {"statusCode": 500, "headers": HEADERS,
                "body": json.dumps({'msg': 'Internal Error'})}


if __name__ == '__main__':
    top_contributors = contributors(None, None)
    print('Top Contributors {}'.format(json.dumps(top_contributors, indent=3)))

    username = 'discoursebot'
    event = {
        'pathParameters': {
            'username': username
        }
    }

    print('Rank of {} is {}'.format(username, rank(event, None)))

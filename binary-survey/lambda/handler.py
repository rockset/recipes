import json
import os
import requests

APIKEY = os.environ.get('APIKEY') if 'APIKEY' in os.environ else open('APIKEY', 'r').read().strip()
WORKSPACE = 'demo'
COLLECTION = 'binary_survey'
QUESTIONS = [
    ['tabs', 'spaces', 'tabs_spaces'],
    ['vim', 'emacs', 'vim_emacs'],
    ['frontend', 'backend', 'frontend_backend'],
    ['objects', 'functions', 'object_functional'],
    ['GraphQL', 'REST', 'graphql_rest'],
    ['Angular', 'React', 'angular_react'],
    ['LaCroix', 'Hint', 'lacroix_hint'],
    ['0-indexing', '1-indexing', '0index_1index'],
    ['SQL', 'NoSQL', 'sql_nosql'],
]

def questions(event, context):
    return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(QUESTIONS)}

def vote(event, context):
    vote = json.loads(event['body'])
    print({'data': [vote]})
    print(json.dumps({'data': [vote]}))
    r = requests.post(
        'https://api.rs2.usw2.rockset.com/v1/orgs/self/ws/%s/collections/%s/docs' % (WORKSPACE, COLLECTION),
        headers={'Authorization': 'ApiKey %s' % APIKEY, 'Content-Type': 'application/json'},
        data=json.dumps({'data': [vote]})
    )
    print(r.text)
    return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

def results(event, context):
    query = 'SELECT '
    columns = [q[2] for q in QUESTIONS]
    for i in range(len(columns)):
        query += 'ARRAY_CREATE(COUNT_IF("%s"), COUNT("%s")) AS q%d, \n' % (columns[i], columns[i], i)
    query += 'count(*) AS total FROM %s.%s' % (WORKSPACE, COLLECTION)
    r = requests.post(
        'https://api.rs2.usw2.rockset.com/v1/orgs/self/queries',
        headers={'Authorization': 'ApiKey %s' % APIKEY, 'Content-Type': 'application/json'},
        data=json.dumps({'sql': {'query': query}})
    )
    results = json.loads(r.text)['results']
    return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(results)}


"""Create a dashboard on Rockset Data using Dash (https://plot.ly/products/dash/)"""

import dash
import dash_core_components as dcc
import dash_html_components as html
import plotly.graph_objs as go
from rockset import Client, Q

from config import ROCKSET_API_SERVER, ROCKSET_API_KEY
from constants import *

rs = Client(api_key=ROCKSET_API_KEY,
            api_server=ROCKSET_API_SERVER)


def get_data(query, x_label, y_label):
    """
    Execute query on Rockset
    Args:
        query (str): Rockset compatible SQL Query
        x_label (str): Values of this column will be mapped on x-axis of the graph
        y_label (str): Values of this column will be mapped on x-axis of the graph

    Returns:
        dict
    """
    result = rs.sql(Q(query))

    result[0]
    return {
        'x': [record[x_label] for record in result],
        'y': [record[y_label] for record in result]
    }


def generate_graph_figure(data, graph_type):
    """
    Generate a ``dict`` or a ``plotly.graph_objs._figure.Figure`` from data
    Args:
        data (dict):
        graph_type (contants.GraphType): ``GraphType`` to create from ``data

    Returns:
        ``dict`` or a ``plotly.graph_objs._figure.Figure``
    """
    figure = None
    if graph_type == GraphType.BAR:
        figure = go.Figure(
            data=[go.Bar(x=data['x'], y=data['y'], marker=go.bar.Marker(color='rgb(55, 83, 109)'))],
            layout={'title': data['title']}
        )
    elif graph_type == GraphType.PIE:
        figure = {
            'data': [{'values': data['y'], 'labels': data['x'], 'type': 'pie'}],
            'layout': {
                'title': data['title']
            }
        }
    elif graph_type == GraphType.LINE:
        figure = {
            'data': [{'y': data['y'], 'x': data['x']}],
            'layout': {
                'title': data['title']
            }
        }

    return figure


def generate_widgets(graphs):
    """
    Generate HTML Components from ``graphs``

    Args:
        graphs (list of dict):
            e.g. {
                    'title': 'Highest Selling Products',
                    'query': HIGHEST_SELLING_PRODUCTS,
                    'x_label': 'Description',
                    'y_label': 'QuantitiesSold',
                    'graph_type': GraphType.BAR
                }
    Returns:
        list of ``dash_html_components.Div``

    """
    widgets = []
    for graph in graphs:
        data = get_data(graph['query'], graph['x_label'], graph['y_label'])
        data.update(graph)
        graph_figure = generate_graph_figure(data, graph['graph_type'])

        widgets.append(html.Div(dcc.Graph(figure=graph_figure), style={'padding': 50}))

    return widgets


def main():
    app = dash.Dash()
    app.layout = html.Div(children=generate_widgets(GRAPHS))
    app.css.append_css({
        'external_url': 'https://codepen.io/chriddyp/pen/bWLwgP.css'
    })
    app.run_server(debug=True)


if __name__ == '__main__':
    main()

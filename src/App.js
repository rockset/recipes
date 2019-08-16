import axios from 'axios';
import React from 'react';
import './App.css';
import { Select, MenuItem, Typography } from '@material-ui/core';
import EventsTable from './Table';
import Graph from './Graph';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      events: [],
      resource: 'Pod'
    }
    this.changeResource = this.changeResource.bind(this);
  }


  getEvents() {
    const config = {
      headers: { 'Authorization': "ApiKey " + process.env.REACT_APP_ROCKSET_API_KEY }
    };
    const body = {
      "sql": {
        "query": `SELECT * FROM commons.eventrouter_events e
                  WHERE e.event.involvedObject.kind = '${this.state.resource}'
                  LIMIT 10
        `
      }
    }
    axios.post('https://api.rs2.usw2.rockset.com/v1/orgs/self/queries',
      body,
      config
    )
      .then((response) => {
        let data = response.data
        console.log('data is', data, this.state.resource)
        this.setState({ events: data['results'] })
      })
      .catch((error) => {
        console.log(error);
      })

  }

  componentDidMount() {
    this.getEvents();
  }

  changeResource(e) {
    this.setState({ resource: e.target.value }, ()=>{this.getEvents()});
  }

  render() {
    const { events } = this.state
    window.events = events;
    return (
      <div>
        <header>
          <div style={{"textAlign": "center"}}>
            <Typography variant="h2" component="h2">
              Kubernetes Events Visualization
            </Typography>
          </div>
          <Typography variant="h4" component="h4">
            Type
          </Typography>
          <Select value={this.state.resource} onChange={this.changeResource}>
            <MenuItem value={"Pod"}>Pods</MenuItem>
            <MenuItem value={"Node"}>Nodes</MenuItem>
          </Select>
          <Typography variant="h4" component="h4">
            Filters
          </Typography>
          <Typography variant="h4" component="h4">
            Visualization
          </Typography>
        </header>
        <Graph />
        <Typography variant="h4" component="h4">
            Events
        </Typography>
        <EventsTable events={events}/>
      </div>
    );
  }
}

export default App;

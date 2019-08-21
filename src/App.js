import axios from 'axios';
import React from 'react';
import './App.css';
import { Select, MenuItem, Typography, TextField} from '@material-ui/core';
import Graph from './Graph';

const RESOURCE_TYPES = ["Pod", "Node"];
const TIME_MAPPING = {"Past 2 hours": 2, "Past 6 hours": 6, "Past day": 24, "Past week": 168};

function timeAtHoursBefore(hours) {
  const date = new Date();
  let milis = date.getTime();
  const dateBefore = new Date();
  dateBefore.setHours(dateBefore.getHours() - hours)
  const difference = date.getTime() - dateBefore.getTime()
  return milis - difference;
}
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      events: [],
      resource: RESOURCE_TYPES[0],
      timeRangeString: Object.keys(TIME_MAPPING)[0],
      timeStart: timeAtHoursBefore(2),
      timeEnd: (new Date()).getTime(),
      prefix: '',
    }
    this.changeResource = this.changeResource.bind(this);
    this.changeTimeRange = this.changeTimeRange.bind(this);
    this.changePrefix = this.changePrefix.bind(this);
  }


  getEvents() {
    const config = {
      headers: { 'Authorization': "ApiKey " + process.env.REACT_APP_ROCKSET_API_KEY }
    };
    const body = {
      "sql": {
        "query": `SELECT e.event.involvedObject.name, e.verb, e.event.reason, e.event.message, e.event.lastTimestamp FROM commons.eventrouter_events e
                  WHERE e.event.involvedObject.kind = '${this.state.resource}'
                  AND UNIX_MILLIS(e._event_time) > ${this.state.timeStart}
                  AND e.event.involvedObject.name LIKE '${this.state.prefix}%'
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

  changePrefix(e) {
    this.setState({ prefix: e.target.value}, ()=>{this.getEvents()});
  }

  changeTimeRange(e) {
    const timeStr = e.target.value;
    const hoursBefore = timeAtHoursBefore(TIME_MAPPING[timeStr]);
    this.setState({timeRangeString: timeStr, timeStart: hoursBefore, timeEnd: (new Date()).getTime()}, ()=>{this.getEvents()});
  }

  render() {
    const { events, timeRangeString, resource, timeStart, timeEnd } = this.state
    window.events = events;
    return (
      <div style={{"marginLeft": '3%'}}>
        <header>
          <div style={{"textAlign": "center"}}>
            <Typography variant="h2" component="h2">
              Kubernetes Events Visualization
            </Typography>
          </div>
          <Typography variant="h4" component="h4">
            Type
          </Typography>
          <Select value={resource} onChange={this.changeResource}>
            {RESOURCE_TYPES.map((val)=> (
              <MenuItem key={val} value={val}>{val}</MenuItem>
            ))}
          </Select>
          <Typography variant="h4" component="h4">
            Filter by prefix
          </Typography>
          <TextField
            placeholder="Example: leaf-8"
            multiline={true}
            variant="outlined"
            onChange={this.changePrefix}
            />
          <Typography variant="h4" component="h4">
            Time Range
          </Typography>
          <Select value={timeRangeString} onChange={this.changeTimeRange}>
            {Object.keys(TIME_MAPPING).map((val)=> (
              <MenuItem key={val} value={val}>{val}</MenuItem>
            ))}
          </Select>
          <Typography variant="h4" component="h4">
            Visualization
          </Typography>
        </header>
        <div style={{width: '100%', height: '100vh'}}>
        <Graph timeStart={timeStart} timeEnd={timeEnd} events={events}/>
        </div>
      </div>
    );
  }
}

export default App;

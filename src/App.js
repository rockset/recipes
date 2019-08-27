import axios from 'axios';
import React from 'react';
import './App.css';
import { Select, MenuItem, Typography, TextField, AppBar, Toolbar} from '@material-ui/core';
import Graph from './Graph';
import _ from 'lodash';

const RESOURCE_TYPES = ["Pod", "Node"];
const TIME_MAPPING = {"Past 1 hour": 1, "Past 6 hours": 6, "Past day": 24, "Past week": 168};

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
      timeStart: timeAtHoursBefore(1),
      timeEnd: (new Date()).getTime(),
      prefix: '',
    }
    this.changeResource = this.changeResource.bind(this);
    this.changeTimeRange = this.changeTimeRange.bind(this);
    this.changePrefix = this.changePrefix.bind(this);
    this.queryEvents = this.queryEvents.bind(this);
    this.debounce = _.debounce(function() {
      this.getEvents();
    }, 1000);
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
                  LIMIT 25
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

  queryEvents() {
    this.debounce.cancel();
    this.debounce();
  }

  componentDidMount() {
    this.getEvents();
  }

  changeResource(e) {
    this.setState({ resource: e.target.value }, ()=>{this.queryEvents()});
  }

  changePrefix(e) {
    this.setState({ prefix: e.target.value}, ()=>{this.queryEvents()});
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
          <AppBar position="static">
            <Toolbar>
              <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" className={classes.title}>
                News
              </Typography>
              <Button color="inherit">Login</Button>
            </Toolbar>
          </AppBar>
          </div>
          <div style={{"paddingBottom": '30px'}}>
          <Typography variant="h4" component="h4">
            Resource Type
          </Typography>
            <Select value={resource} onChange={this.changeResource}>
              {RESOURCE_TYPES.map((val)=> (
                <MenuItem key={val} value={val}>{val}</MenuItem>
              ))}
            </Select>
          </div>
          <Typography variant="h4" component="h4">
            Filter by prefix
          </Typography>
          <TextField
            placeholder="Example: leaf-8"
            multiline={true}
            variant="outlined"
            onChange={this.changePrefix}
            />
          <div style={{'position': 'absolute', 'right': '20%'}}>
            <Select value={timeRangeString} onChange={this.changeTimeRange}>
              {Object.keys(TIME_MAPPING).map((val)=> (
                <MenuItem key={val} value={val}>{val}</MenuItem>
              ))}
            </Select>
          </div>
        </header>
        <div style={{width: '100%', height: '100vh'}}>
        <Graph timeStart={timeStart} timeEnd={timeEnd} events={events}/>
        </div>
      </div>
    );
  }
}

export default App;

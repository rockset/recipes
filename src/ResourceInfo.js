import axios from 'axios';
import React from "react";
import {
    Typography,
    AppBar,
    Toolbar,
    TextField
  } from "@material-ui/core";
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import EventsTable from './EventsTable';
import TimeLine from './TimeLine';
import { withRouter } from 'react-router-dom';
import moment from 'moment';
import { SquareLoader } from "react-spinners";



function timeAtHoursBefore(hours) {
  const date = new Date();
  let milis = date.getTime();
  const dateBefore = new Date();
  dateBefore.setHours(dateBefore.getHours() - hours);
  const difference = date.getTime() - dateBefore.getTime();
  return milis - difference;
}

class ResourceInfo extends React.Component {
    constructor(props) {
        super(props);
        var urlParams = new URLSearchParams(window.location.search);
        this.state = {
            resourceName: urlParams.get('name'),
            events: [],
            timeStart: timeAtHoursBefore(1),
            timeEnd: new Date().getTime(),
            loading: true   
        }
        this.changeStartTime = this.changeStartTime.bind(this);
        this.changeEndTime = this.changeEndTime.bind(this);
    }

    componentDidMount() {
      this.getResourceEvents();
    }

    getResourceEvents() {
      const config = {
        headers: {
          Authorization:
          "ApiKey " + process.env.REACT_APP_ROCKSET_API_KEY
        }
      };
      const body = {
        sql: {
          query: `SELECT e.event.involvedObject.name, e.verb, e.event.reason, e.event.message, e.event.lastTimestamp FROM commons.eventrouter_events e
                    WHERE e.event.involvedObject.name = '${this.state.resourceName}'
                    AND UNIX_MILLIS(PARSE_TIMESTAMP_ISO8601(e.event.lastTimestamp)) > ${this.state.timeStart}
                    AND UNIX_MILLIS(PARSE_TIMESTAMP_ISO8601(e.event.lastTimestamp)) < ${this.state.timeEnd}
                    ORDER BY UNIX_MILLIS(e._event_time) DESC
          `
        }
      };
      axios
        .post(
          "https://api.rs2.usw2.rockset.com/v1/orgs/self/queries",
          body,
          config
        )
        .then(response => {
          this.setState({loading: false})
          let data = response.data;
          this.setState({ events: data["results"] });
        })
        .catch(error => {
          console.log(error);
        });
    }

  changeStartTime(e) {
    this.setState({timeStart: Date.parse(e.target.value), loading: true}, () => {
      this.getResourceEvents();
    });
  }
  changeEndTime(e) {
    this.setState({timeEnd: Date.parse(e.target.value), loading: true}, () => {
      this.getResourceEvents();
    });
  }

  dateToSelectorString(dateSeconds) {
    const start = new Date(dateSeconds)
    return moment(start).format("YYYY-MM-DDTHH:mm")
  }


  render() {
    const {resourceName, timeStart, timeEnd, events} = this.state;
    const startStr = this.dateToSelectorString(timeStart);
    const endStr = this.dateToSelectorString(timeEnd);
    return (
      <div>
        <AppBar position="static">
        <Toolbar>
          <ChevronLeft style={{"transform": "scale(1.8)", paddingRight: '20px'}} onClick={() => this.props.history.goBack()}/>
          <Typography variant="h3"> {resourceName} </Typography>
        </Toolbar>
      </AppBar>
        <div>
          <div style={{"padding":'10px'}}>
            <Typography variant="h6"> Filter events by time </Typography>
            <TextField
              id="datetime-local"
              label="Start time"
              type="datetime-local"
              defaultValue={startStr}
              InputLabelProps={{
                shrink: true,
              }}
              onChange={this.changeStartTime}
            />
            <TextField
              id="datetime-local"
              label="End time"
              type="datetime-local"
              defaultValue={endStr}
              InputLabelProps={{
                shrink: true,
              }}
              style={{"marginLeft": '50px'}}
            />
          </div>
          {this.state.loading ?
            <div style={{"paddingLeft" :"50%", paddingTop: "20%"}}>
              <SquareLoader size={150} color={"#3f51b5"}/>
            </div>
           : 
           <div>
             {events.length === 0 ? 
             <Typography variant="h6"> No events in this time range for the resource. Try selecting a different timeline. </Typography>
             :
             <div>
             <div style={{"overflow": "scroll", "maxHeight": "400px", "backgroundColor": "lightgray"}}>
              <Typography variant="h6"> Timeline </Typography>
              <TimeLine events={this.state.events}/>
             </div>
              <Typography variant="h6"> Table of Events </Typography>
              <EventsTable events={this.state.events}/>
              </div>
            }
             </div>
          }
        </div>
      </div>
    );
  }
}

export default withRouter(ResourceInfo);
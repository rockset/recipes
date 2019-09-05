import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from "@material-ui/core";
import { withRouter } from 'react-router-dom';
import {NEGATIVE_EVENTS} from './EventTypes.js';
import './ResourceList.css'

const RED_COLOR = 'rgb(233, 30, 99, 0.4)';
const GREEN_COLOR ='rgb(16, 204, 82, 0.4)';

class ResourceList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rangeStart: 0,
      rangeEnd: 10
    };
    this.toResource = this.toResource.bind(this);
  }

  getResources() {
    const { events } = this.props;
    const resources = {}
    for (const event of events) {
        if (!(event['name'] in resources)) {
            resources[event['name']] = event;
        } else {
            if (event['lastTimestamp'] > resources[event['name']]['lastTimestamp']) {
                const obj = resources[event['name']];
                obj['lastTimestamp'] = event['lastTimestamp'];
                obj['message'] = event['message'];
                obj['reason'] = event['reason'];
            }
        }
    }
    return resources;
  }

  toResource(resource) {
    this.props.history.push("/resource?name=" + resource);
  }

  render() {
    const resources = this.getResources();
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell align="left">Last Event Time</TableCell>
            <TableCell align="left">Last Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.keys(resources).map((resource, idx) => {
            let color;
            if (NEGATIVE_EVENTS.includes(resources[resource].reason)) {
                color = RED_COLOR;
            } else {
                color = GREEN_COLOR;
            }
            return (
            <TableRow style={{"background": color}} key={idx} onClick={() => this.toResource(resource)} className="ListItem">
              <TableCell align="left">{resources[resource].name}</TableCell>
              <TableCell align="left">{resources[resource].lastTimestamp}</TableCell>
              <TableCell align="left">{resources[resource].reason}</TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
    );
  }
}

export default withRouter(ResourceList)
import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from "@material-ui/core";
import { withRouter } from 'react-router-dom';
import './ResourceList.css'


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
            resources[event['name']]['numEvents'] = 1;
        } else {
            if (event['lastTimestamp'] > resources[event['name']]['lastTimestamp']) {
                const obj = resources[event['name']];
                obj['lastTimestamp'] = event['lastTimestamp'];
                obj['message'] = event['message'];
                obj['reason'] = event['reason'];
            }
            resources[event['name']]['numEvents']++;
        }
    }
    return resources;
  }

  toResource(resource) {
    this.props.history.push("/resource?name=" + resource);
    console.log(resource);
  }

  render() {
    const resources = this.getResources();
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell align="left">Last Event</TableCell>
            <TableCell align="left">Last Status</TableCell>
            <TableCell align="left">Number of Events</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.keys(resources).map((resource, idx) => (
            <TableRow key={idx} onClick={() => this.toResource(resource)} className="ListItem">
              <TableCell align="left">{resources[resource].name}</TableCell>
              <TableCell align="left">{resources[resource].lastTimestamp}</TableCell>
              <TableCell align="left">{resources[resource].reason}</TableCell>
              <TableCell align="left">{resources[resource].numEvents}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
}

export default withRouter(ResourceList)
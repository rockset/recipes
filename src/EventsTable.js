import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography
} from "@material-ui/core";
import {NEGATIVE_EVENTS} from './EventTypes';

const RED_COLOR = 'rgb(233, 30, 99, 0.4)';
const GREEN_COLOR ='rgb(16, 204, 82, 0.4)';

export default class EventsTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rangeStart: 0,
      rangeEnd: 10
    };
  }
  updateEventRange(e) {}
  render() {
    const { events, mostRecent } = this.props;
    return (
      <Table>
        <TableHead>
          {!mostRecent ? 
          <TableRow>
            <TableCell>Last Seen</TableCell>
            <TableCell align="left">Type</TableCell>
            <TableCell align="left">Reason</TableCell>
            <TableCell align="left">Message</TableCell>
          </TableRow>
          :
          <Typography variant="h6" style={{"padding":'10px'}}>Most Recent Event</Typography> 
        }
        </TableHead>
        <TableBody>
          {events.map((event, idx) => {
            let color;
            if (NEGATIVE_EVENTS.includes(event.reason)) {
                color = RED_COLOR;
            } else {
                color = GREEN_COLOR;
            }
            return (<TableRow key={idx} style={{background: color}}>
              <TableCell align="left">{event.lastTimestamp}</TableCell>
              <TableCell align="left">{event.verb}</TableCell>
              <TableCell align="left">{event.reason}</TableCell>
              <TableCell align="left">{event.message}</TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
    );
  }
}

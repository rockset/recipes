import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from "@material-ui/core";

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
    const { events } = this.props;
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Last Seen</TableCell>
            <TableCell align="left">Type</TableCell>
            <TableCell align="left">Reason</TableCell>
            <TableCell align="left">Message</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {events.map((event, idx) => (
            <TableRow key={idx}>
              <TableCell align="left">{event.lastTimestamp}</TableCell>
              <TableCell align="left">{event.verb}</TableCell>
              <TableCell align="left">{event.reason}</TableCell>
              <TableCell align="left">{event.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
}

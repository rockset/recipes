import React from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core';


export default class EventsTable extends React.Component {
    render() {
        const {events} = this.props;
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
              {events.map(event => (
                <TableRow key={event.lastTimestamp}>
                  <TableCell align="left">{event.event.lastTimestamp}</TableCell>
                  <TableCell align="left">{event.verb}</TableCell>
                  <TableCell align="left">{event.event.reason}</TableCell>
                  <TableCell align="left">{event.event.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
    }
}
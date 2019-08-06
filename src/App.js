import React from 'react';
import './App.css';
import { Select, MenuItem, Typography, Table, TableHead, TableRow, TableCell } from '@material-ui/core';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      events: [],
      resource: 'Pods'
    }
  }
  render() {
    return (
      <div>
        <header>
          <Typography variant="h2" component="h2">
            Visualizing k8s events
          </Typography>
          <Typography variant="body1" component="body1">
            Type
          </Typography>
          <Select value = {this.state.value}>
            <MenuItem value={"Pods"}>Pods</MenuItem>
          </Select>
          <Typography variant="h4" component="h4">
            Events
          </Typography>
          <Table>
          <TableHead>
            <TableRow>
              <TableCell>Last Seen</TableCell>
              <TableCell align="right">Type</TableCell>
              <TableCell align="right">Reason</TableCell>
              <TableCell align="right">Kind</TableCell>
              <TableCell align="right">Message</TableCell>
            </TableRow>
          </TableHead>
        </Table>
        </header>
      </div>
    );
    }
}

export default App;

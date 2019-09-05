import React from 'react';
import {
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  } from 'recharts';
import {NEGATIVE_EVENTS} from './EventTypes';

const RED_COLOR = 'rgb(233, 30, 99, 0.8)';
const GREEN_COLOR ='rgb(16, 204, 82, 0.8)';

// Number of seconds that we "bucket"
// events to in order to show them in the same
// bar. Currently set to 5 mins (300000 ms).
const BUCKET_GRANULARITY = 300000;

export default class EventsGraph extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            eventGroups: []
        }
        this.customToolTip = this.customToolTip.bind(this);
    }

    componentDidMount() {
        this.buildEventGroups();
    }

    sortDataPoints(a, b) {
        if (a['name'] < b['name']) {
            return -1
        }
        return 0
    }

    buildEventGroups() {
        let bucketedData = []
        let unbucketedData = []
        for (const event of this.props.events) {
            const {reason, lastTimestamp} = event;
            const dateSecs = Date.parse(lastTimestamp);
            const date = new Date(dateSecs);
            let mins = date.getMinutes().toString();
            if (mins.length < 2) {
                mins = "0" + mins
            }
            const name = date.getMonth() + "/" + date.getDay() + " " + date.getHours() + ":" + mins
            if (NEGATIVE_EVENTS.includes(reason)) {
                unbucketedData.push({
                    name,
                    error: 1
                })
            } else {
                unbucketedData.push({
                    name,
                    ok: 1
                })
            }
        }
        const mapping = {}
        for (const dataPoint of unbucketedData) {
            // First value for data point
            if (!mapping[dataPoint["name"]]) {
                mapping[dataPoint["name"]] = {error: 0, ok: 0}
            }
            if (dataPoint['error'] === 1) {
                mapping[dataPoint["name"]]["error"]++
            } else {
                mapping[dataPoint["name"]]["ok"]++
            }
        }
        for (const name of Object.keys(mapping)) {
            const values = mapping[name];
            const dataPoint = {name};
            for (const value of Object.keys(values)) {
                dataPoint[value] = values[value];
            }
            bucketedData.push(dataPoint)
        }
        bucketedData = bucketedData.sort(this.sortDataPoints);
        window.bucketedData = bucketedData;
        this.setState({eventGroups: bucketedData});
    }

    customToolTip(e) {
        const payload = e.payload;
        if (payload.length < 2) {
            return "";
        }
        const zeroIsError = payload[0].dataKey == 'error'
        const errorData = zeroIsError ?  payload[0] :  payload[1];
        const okData = zeroIsError ? payload[1] : payload[0]
        return (
            <div style={{"background": "white", padding: 20}}>
                <p style={{color: `${RED_COLOR}`}}> error: {errorData['value']} </p>
                <p style={{color: `${GREEN_COLOR}`}}> ok: {okData['value']} </p>
            </div>
        )
    }

    render() {
        return (
            <div>
            <BarChart
            width={1200}
            height={600}
            data={this.state.eventGroups}
            style={{"textAlign": "center", "margin": "auto"}}
            margin={{
              top: 20, right: 30, left: 20, bottom: 50,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip  content={this.customToolTip}/>
            <Legend/>
            <Bar dataKey="error" stackId="a" fill={`${RED_COLOR}`} />
            <Bar dataKey="ok" stackId="a" fill={`${GREEN_COLOR}`} />
          </BarChart>
          </div>
        )
    }
}
import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  } from 'recharts';
import {NEGATIVE_EVENTS} from './EventTypes';

const RED_COLOR = 'rgb(233, 30, 99, 0.8)';
const GREEN_COLOR ='rgb(16, 204, 82, 0.8)';

export default class EventsGraph extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            eventGroups: [],
            granularity: props.granularity
        }
        this.customToolTip = this.customToolTip.bind(this);
    }

    componentDidMount() {
        this.buildEventGroups();
    }

    componentWillReceiveProps(nextProps) {
        this.setState({granularity: nextProps.granularity}, () => {
            this.buildEventGroups();
        });
    }

    sortDataPoints(a, b) {
        if (a['name'] < b['name']) {
            return -1
        }
        return 0
    }

    constructLabel(date) {
        const {granularity} = this.state;
        let mins = date.getMinutes().toString();
        let name = "";
        if (granularity === "1 minute") {
            if (mins.length < 2) {
                mins = "0" + mins
            }
            name = (date.getMonth() + 1) + "/" + date.getDate() + " " + date.getHours() + ":" + mins;    
        }
        else if (granularity === "10 minutes") {
            mins = mins - mins % 10;
            name = (date.getMonth() + 1) + "/" + date.getDate() + " " + date.getHours() + ":" + mins;    
        }
        else if (granularity === "60 minutes") {
            name = (date.getMonth() + 1) + "/" + date.getDate() + " " + date.getHours() + ":00";
        }
        // 1 day granularity
        else {
            name = (date.getMonth() + 1) + "/" + date.getDate();
        }
        return name;
    }

    buildEventGroups() {
        let bucketedData = []
        let unbucketedData = []
        for (const event of this.props.events) {
            const {reason, lastTimestamp, message} = event;
            const dateSecs = Date.parse(lastTimestamp);
            const date = new Date(dateSecs);
            // bucket in specified granularity
            const name = this.constructLabel(date);
            if (NEGATIVE_EVENTS.includes(reason)) {
                unbucketedData.push({
                    name,
                    error: 1,
                    message
                })
            } else {
                unbucketedData.push({
                    name,
                    ok: 1,
                    message
                })
            }
        }
        const mapping = {}
        for (const dataPoint of unbucketedData) {
            // First value for data point
            if (!mapping[dataPoint["name"]]) {
                mapping[dataPoint["name"]] = {error: 0, ok: 0, errMessages: [], okMessages: []};
            }
            if (dataPoint['error'] === 1) {
                mapping[dataPoint["name"]]["error"]++;
                mapping[dataPoint["name"]]['errMessages'].push(dataPoint['message']);
            } else {
                mapping[dataPoint["name"]]["ok"]++;
                mapping[dataPoint["name"]]['okMessages'].push(dataPoint['message']);
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
        const zeroIsError = payload[0].dataKey === 'error'
        const errorData = zeroIsError ?  payload[0] :  payload[1];
        const okData = zeroIsError ? payload[1] : payload[0];
        const set = new Set(errorData['payload']['errMessages']);
        return (
            <div style={{"background": "white", padding: 20}}>
                <p> error: {errorData['payload']['name']} </p>
                <p style={{color: `${RED_COLOR}`}}> error: {errorData['value']} </p>
                {Array.from(set).map((elem) => (
                    <p style={{color: `${RED_COLOR}`}} key={elem}> {elem} </p>
                ))}
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
            <Tooltip content={this.customToolTip}/>
            <Legend/>
            <Bar dataKey="error" stackId="a" fill={`${RED_COLOR}`} />
            <Bar dataKey="ok" stackId="a" fill={`${GREEN_COLOR}`} />
          </BarChart>
          </div>
        )
    }
}
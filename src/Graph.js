import React from 'react';
import './Graph.css';
import { ResponsiveLine } from '@nivo/line'
import {Modal} from '@material-ui/core'

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

export default class Graph extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            modalText: ''
        }
        this.showEventDetails = this.showEventDetails.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    constructData() {
        const {events} = this.props;
        const data = [];
        for(const event of events) {
            const name = event['name'];
            let newObject = true;
            let i=0;
            while(i < data.length) {
                if (data[i]['id'] === name) {
                    newObject = false;
                    data[i]['data'].push({
                        "x": Date.parse(event['lastTimestamp']),
                        "y": name,
                        "message": event['message']
                    })
                }
                i++
            }
            if (newObject) {
                const newObj = {
                    "id": name,
                    "color": `hsl(${getRandomInt(302)}, 70%, 50%)`,
                    "data": [
                      {
                        "x": Date.parse(event['lastTimestamp']),
                        "y": name,
                        "message": event['message']
                      },
                    ]
                }
                data.push(newObj)
            }
        }
        console.log("data is", data)
        return data;
    }

    
    showEventDetails(e) {
        this.setState({open: true, modalText: e['data']['message']})
    }

    handleClose() {
        this.setState({open: false})
    }

    render() {
        const data = this.constructData()
        return (
            <div style={{"width": '66vw', "height": '66vh'}}>
                <Modal open={this.state.open} onClose={this.handleClose}>
                <div style={
                    {
                        top: '50%', 
                        left: "50%", 
                        transform: 'translate(-50%, -50%)', 
                        position: 'absolute',
                        width: '400',
                        backgroundColor: 'white',
                        }
                    }>
                    <p> {this.state.modalText} </p>
                </div>
                </Modal>
                <ResponsiveLine
                data={data}
                margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'point', stacked: false, min: 'auto', max: 'auto' }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    orient: 'bottom',
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Time',
                    legendOffset: 36,
                    legendPosition: 'middle'
                }}
                axisLeft={{
                    orient: 'left',
                    tickSize: 0,
                    tickPadding: 5,
                    tickRotation: 0,
                    format: () => null
                }}
                colors={{ scheme: 'nivo' }}
                pointSize={10}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabel="y"
                pointLabelYOffset={-12}
                useMesh={true}
                onClick={this.showEventDetails}
                legends={[
                    {
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 150,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemDirection: 'left-to-right',
                        itemWidth: 135,
                        itemHeight: 20,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: 'circle',
                        symbolBorderColor: 'rgba(0, 0, 0, .5)',
                        effects: [
                            {
                                on: 'hover',
                                style: {
                                    itemBackground: 'rgba(0, 0, 0, .03)',
                                    itemOpacity: 1
                                }
                            }
                        ]
                    }
                ]}
            />
        </div>
        )
    }
}
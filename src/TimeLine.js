import React from 'react';
import { VerticalTimeline, VerticalTimelineElement }  from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';

const BLUE_COLOR = 'rgb(33, 150, 243)';
const RED_COLOR = 'rgb(233, 30, 99)';
const GREEN_COLOR ='rgb(16, 204, 82)';

// const NEUTRAL_EVENTS = [
//     'Pulling',
//     'ScalingReplicaSet',
//     'Pulled',
//     'NodeHasSufficientMemory',
//     'SandboxChanged',
//     'UPDATE',
//     'CREATE',
//     'NodeHasNoDiskPressure',
//     'RecreatingFailedPod',
//     'NodeHasSufficientDisk',
//     'Starting',
//     'UpdatedLoadBalancer',
//     'NodeHasSufficientPID',
//     'NodeAllocatableEnforced',
//     'Rebooted',
//     'LeaderElection',
//     'Preempted',
//     'KeyPairVerified',
// ];

const POSITIVE_EVENTS = [
    'SuccessfulDelete',
    'Created',
    'Scheduled',
    'Started',
    'FailedGetScale',
    'SuccessfulCreate',
    'SawCompletedJob',
    'SuccessfulAttachVolume',
    'NodeReady',
]

const NEGATIVE_EVENTS = [
    'FailedScheduling',
    'UnregisterNetDevice',
    'Unhealthy',
    'Killing',
    'FailedGetScale',
    'FailedGetScale',
    'NodeHasInsufficientMemory',
    'BackOff',
    'FailedDaemonPod',
    'Failed',
    'EvictionThresholdMet',
    'BackoffLimitExceeded',
    'FailedGetResourceMetric',
    'ErrImageNeverPull',
    'ImageGCFailed',
    'TooManyActivePods',
    'FailedComputeMetricsReplicas',
    'ExceededGracePeriod',
    'NetworkNotReady',
    'FreeDiskSpaceFailed',
    'SystemOOM',
    'NodeNotReady',
    'FailedToUpdateEndpoint',
    'OOMKilling',
    'CIDRAssignmentFailed',
    'FailedCreate',
    'FailedRescale',
    'FailedMount',
    'FailedKillPod',
    'ERROR',
    'FailedCreatePodSandBox',
    'DeadlineExceeded',
    'KiamCredentialError',
    'FailedSync'
];

export default class TimeLine extends React.Component {
    render() {
        return (
<VerticalTimeline>
    {this.props.events.map((event, eventIdx) => {
        let color = BLUE_COLOR;
        if (POSITIVE_EVENTS.includes(event.reason)) {
            color = GREEN_COLOR;
        } else if (NEGATIVE_EVENTS.includes(event.reason)) {
            color = RED_COLOR;
        }
        return (
        <VerticalTimelineElement
            className="vertical-timeline-element--work"
            date={event.lastTimestamp}
            iconStyle={{ background: color, color: '#fff' }}
            icon={null}
        >
            <h3 className="vertical-timeline-element-title">Status: {event.reason}</h3>
            <h4 className="vertical-timeline-element-subtitle">Type: {event.verb}</h4>
            <p>
            {event.message}
            </p>
        </VerticalTimelineElement>
    )})}
</VerticalTimeline>
        );
    }
}

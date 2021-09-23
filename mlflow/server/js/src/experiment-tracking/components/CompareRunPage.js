import React, { Component } from 'react';
import PropTypes from 'prop-types';
import qs from 'qs';
import { connect } from 'react-redux';
import { getExperimentApi, getRunApi } from '../actions';
import RequestStateWrapper from '../../common/components/RequestStateWrapper';
import CompareRunView from './CompareRunView';
import { getUUID } from '../../common/utils/ActionUtils';

class CompareRunPage extends Component {
  static propTypes = {
    experimentId: PropTypes.string,
    experimentIds: PropTypes.string,
    runUuids: PropTypes.arrayOf(PropTypes.string).isRequired,
    dispatch: PropTypes.func.isRequired,
  };

  componentWillMount() {
    this.requestIds = [];
    if (this.props.experimentId) {
      const experimentRequestId = getUUID();
      this.props.dispatch(getExperimentApi(this.props.experimentId, experimentRequestId));
      this.requestIds.push(experimentRequestId);
    }
    this.props.runUuids.forEach((runUuid) => {
      const requestId = getUUID();
      this.requestIds.push(requestId);
      this.props.dispatch(getRunApi(runUuid, requestId));
    });
  }

  render() {
    return (
      <div className='App-content'>
        <RequestStateWrapper requestIds={this.requestIds}>
          <CompareRunView
            runUuids={this.props.runUuids}
            experimentId={this.props.experimentId}
            experimentIds={this.props.experimentIds}
          />
        </RequestStateWrapper>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const searchValues = qs.parse(location.search);
  const runUuids = JSON.parse(searchValues['?runs']);
  const experimentId = searchValues['experiment'] || null;
  const experimentIds = JSON.parse(searchValues['experiments']) || null;
  return { experimentId, experimentIds, runUuids };
};

export default connect(mapStateToProps)(CompareRunPage);

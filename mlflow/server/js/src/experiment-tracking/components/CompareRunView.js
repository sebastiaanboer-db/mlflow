import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getExperiment, getParams, getRunInfo, getRunTags } from '../reducers/Reducers';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import './CompareRunView.css';
import { Experiment, RunInfo } from '../sdk/MlflowMessages';
import { CompareRunScatter } from './CompareRunScatter';
import CompareRunContour from './CompareRunContour';
import Routes from '../routes';
import { Link } from 'react-router-dom';
import { getLatestMetrics } from '../reducers/MetricReducer';
import { BreadcrumbTitle } from './BreadcrumbTitle';
import CompareRunUtil from './CompareRunUtil';
import Utils from '../../common/utils/Utils';
import { Tabs } from 'antd';
import ParallelCoordinatesPlotPanel from './ParallelCoordinatesPlotPanel';

const { TabPane } = Tabs;

export class CompareRunView extends Component {
  static propTypes = {
    experiment: PropTypes.instanceOf(Experiment),
    experimentId: PropTypes.string,
    experimentIds: PropTypes.arrayOf(PropTypes.string),
    runInfos: PropTypes.arrayOf(PropTypes.instanceOf(RunInfo)).isRequired,
    runUuids: PropTypes.arrayOf(PropTypes.string).isRequired,
    metricLists: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
    paramLists: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
    // Array of user-specified run names. Elements may be falsy (e.g. empty string or undefined) if
    // a run was never given a name.
    runNames: PropTypes.arrayOf(PropTypes.string).isRequired,
    // Array of names to use when displaying runs. No element in this array should be falsy;
    // we expect this array to contain user-specified run names, or default display names
    // ("Run <uuid>") for runs without names.
    runDisplayNames: PropTypes.arrayOf(PropTypes.string).isRequired,
    intl: PropTypes.shape({ formatMessage: PropTypes.func.isRequired }).isRequired,
  };

  componentDidMount() {
    const pageTitle = this.props.intl.formatMessage(
      {
        description: 'Page title for the compare runs page',
        defaultMessage: 'Comparing {runs} MLflow Runs',
      },
      {
        runs: this.props.runInfos.length,
      },
    );
    Utils.updatePageTitle(pageTitle);
  }

  render() {
    const { experiment, experimentIds } = this.props;
    const experimentId = experiment ? experiment.getExperimentId() : null;
    const { runInfos, runNames } = this.props;
    return (
      <div className='CompareRunView'>
        {experimentId ? (
          <div className='header-container'>
            <BreadcrumbTitle
              experiment={experiment}
              title={
                <FormattedMessage
                  defaultMessage='Comparing {runs} Runs'
                  description='Breadcrumb title for compare runs page'
                  values={{
                    runs: this.props.runInfos.length,
                  }}
                />
              }
            />
          </div>
        ) : (
          <h1 className='breadcrumb-header'>
            <Link
              to={Routes.getExperimentsPageRoute(experimentIds)}
              className='truncate-text single-line breadcrumb-title'
            >
              {'< Go back to the list of experiments'}
            </Link>
          </h1>
        )}
        <div className='responsive-table-container'>
          <table className='compare-table table'>
            <thead>
              <tr>
                <th scope='row' className='row-header'>
                  <FormattedMessage
                    defaultMessage='Run ID:'
                    description='Row title for the run id on the experiment compare runs page'
                  />
                </th>
                {this.props.runInfos.map((r) => (
                  <th scope='column' className='data-value' key={r.run_uuid}>
                    <Link to={Routes.getRunPageRoute(r.getExperimentId(), r.getRunUuid())}>
                      {r.getRunUuid()}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope='row' className='data-value'>
                  <FormattedMessage
                    defaultMessage='Run Name:'
                    description='Row title for the run name on the experiment compare runs page'
                  />
                </th>
                {runNames.map((runName, i) => {
                  return (
                    <td className='meta-info' key={runInfos[i].run_uuid}>
                      <div
                        className='truncate-text single-line'
                        style={styles.compareRunTableCellContents}
                      >
                        {runName}
                      </div>
                    </td>
                  );
                })}
              </tr>
              <tr>
                <th scope='row' className='data-value'>
                  <FormattedMessage
                    defaultMessage='Start Time:'
                    // eslint-disable-next-line max-len
                    description='Row title for the start time of runs on the experiment compare runs page'
                  />
                </th>
                {this.props.runInfos.map((run) => {
                  const startTime = run.getStartTime()
                    ? Utils.formatTimestamp(run.getStartTime())
                    : '(unknown)';
                  return (
                    <td className='meta-info' key={run.run_uuid}>
                      {startTime}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <th scope='row' className='data-value'>
                  <FormattedMessage
                    defaultMessage='Experiment Id:'
                    // eslint-disable-next-line max-len
                    description='Row title for the experiment id of runs on the experiment compare runs page'
                  />
                </th>
                {this.props.runInfos.map((run) => {
                  const eachExperimentId = run.getExperimentId();
                  return (
                    <td className='meta-info' key={run.run_uuid}>
                      {eachExperimentId}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <th
                  scope='rowgroup'
                  className='inter-title'
                  colSpan={this.props.runInfos.length + 1}
                >
                  <h2>
                    <FormattedMessage
                      defaultMessage='Parameters'
                      // eslint-disable-next-line max-len
                      description='Row group title for parameters of runs on the experiment compare runs page'
                    />
                  </h2>
                </th>
              </tr>
              {this.renderDataRows(this.props.paramLists, true)}
              <tr>
                <th
                  scope='rowgroup'
                  className='inter-title'
                  colSpan={this.props.runInfos.length + 1}
                >
                  <h2>
                    <FormattedMessage
                      defaultMessage='Metrics'
                      // eslint-disable-next-line max-len
                      description='Row group title for metrics of runs on the experiment compare runs page'
                    />
                  </h2>
                </th>
              </tr>
              {this.renderDataRows(
                this.props.metricLists,
                false,
                (key, data) => {
                  return (
                    <Link
                      to={Routes.getMetricPageRoute(
                        this.props.runInfos
                          .map((info) => info.run_uuid)
                          .filter((uuid, idx) => data[idx] !== undefined),
                        key,
                        experimentId,
                      )}
                      title='Plot chart'
                    >
                      {key}
                      <i className='fas fa-chart-line' style={{ paddingLeft: '6px' }} />
                    </Link>
                  );
                },
                Utils.formatMetric,
              )}
            </tbody>
          </table>
        </div>
        <Tabs>
          <TabPane
            tab={
              <FormattedMessage
                defaultMessage='Scatter Plot'
                description='Tab pane title for scatterplots on the compare runs page'
              />
            }
            key='1'
          >
            <CompareRunScatter
              runUuids={this.props.runUuids}
              runDisplayNames={this.props.runDisplayNames}
            />
          </TabPane>
          <TabPane
            tab={
              <FormattedMessage
                defaultMessage='Contour Plot'
                description='Tab pane title for contour plots on the compare runs page'
              />
            }
            key='2'
          >
            <CompareRunContour
              runUuids={this.props.runUuids}
              runDisplayNames={this.props.runDisplayNames}
            />
          </TabPane>
          <TabPane
            tab={
              <FormattedMessage
                defaultMessage='Parallel Coordinates Plot'
                description='Tab pane title for parallel coordinate plots on the compare runs page'
              />
            }
            key='3'
          >
            <ParallelCoordinatesPlotPanel runUuids={this.props.runUuids} />
          </TabPane>
        </Tabs>
      </div>
    );
  }

  // eslint-disable-next-line no-unused-vars
  renderDataRows(
    list,
    highlightChanges = false,
    headerMap = (key, data) => key,
    formatter = (value) => value,
  ) {
    const keys = CompareRunUtil.getKeys(list);
    const data = {};
    keys.forEach((k) => (data[k] = []));
    list.forEach((records, i) => {
      keys.forEach((k) => data[k].push(undefined));
      records.forEach((r) => (data[r.key][i] = r.value));
    });

    return keys.map((k) => {
      let row_class = undefined;
      if (highlightChanges) {
        const all_equal = data[k].every((x) => x === data[k][0]);
        if (!all_equal) {
          row_class = 'row-changed';
        }
      }

      return (
        <tr key={k} className={row_class}>
          <th scope='row' className='rowHeader'>
            {headerMap(k, data[k])}
          </th>
          {data[k].map((value, i) => (
            <td className='data-value' key={this.props.runInfos[i].run_uuid}>
              <span
                className='truncate-text single-line'
                style={styles.compareRunTableCellContents}
              >
                {value === undefined ? '' : formatter(value)}
              </span>
            </td>
          ))}
        </tr>
      );
    });
  }
}

const styles = {
  compareRunTableCellContents: {
    maxWidth: '200px',
  },
};

const mapStateToProps = (state, ownProps) => {
  const runInfos = [];
  const metricLists = [];
  const paramLists = [];
  const runNames = [];
  const runDisplayNames = [];
  const { experimentId, runUuids } = ownProps;
  const experiment = getExperiment(experimentId, state);
  runUuids.forEach((runUuid) => {
    runInfos.push(getRunInfo(runUuid, state));
    metricLists.push(Object.values(getLatestMetrics(runUuid, state)));
    paramLists.push(Object.values(getParams(runUuid, state)));
    const runTags = getRunTags(runUuid, state);
    runDisplayNames.push(Utils.getRunDisplayName(runTags, runUuid));
    runNames.push(Utils.getRunName(runTags));
  });
  return { experiment, runInfos, metricLists, paramLists, runNames, runDisplayNames };
};

export default connect(mapStateToProps)(injectIntl(CompareRunView));

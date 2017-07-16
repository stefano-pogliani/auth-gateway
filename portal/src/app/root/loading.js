import React from 'react';
import { connect } from 'react-redux';


class LoadingApp extends React.Component {
  _renderStage(stage, name) {
    // Define default icon and message.
    let icon = <i className="fa fa-hourglass-o"></i>;
    let message = `Not yet started loading ${name}`;

    // Figure out state of the stage.
    if (stage.error) {
      icon = <i className="fa fa-exclamation-circle"></i>;
      message = `Failed to load ${name}: ${stage.error.message}`;

    } else if (stage.loaded) {
      icon = <i className="fa fa-check"></i>;
      message = `Successfully loaded ${name}`;

    } else if (stage.started) {
      icon = <i className="fa fa-spin fa-spinner"></i>;
      message = `Loading ${name} ...`;
    }

    // Return the stage status.
    return <p>{icon} {message}</p>;
  }

  renderApps() {
    return this._renderStage(this.props.apps, "apps");
  }

  renderOverall() {
    if (this.props.failed) {
      return (
        <h1><i className="fa fa-exclamation-circle"></i> Failed to load!</h1>
      );
    }
    return (
      <h1><i className="fa fa-spin fa-spinner"></i> Loading ...</h1>
    );
  }

  renderSettings() {
    return this._renderStage(this.props.settings, "settings");
  }

  renderUser() {
    return this._renderStage(this.props.user, "user information");
  }

  render() {
    return (
      <div className="container">
        <div className="jumbotron text-center">
          {this.renderOverall()}
          <hr />
          {this.renderApps()}
          {this.renderSettings()}
          {this.renderUser()}
        </div>
      </div>
    );
  }
};


const mapStateToProps = (state) => {
  return {
    failed: state.loader.failed,
    apps: state.loader.stages.apps,
    settings: state.loader.stages.settings,
    user: state.loader.stages.user
  };
};
export default connect(mapStateToProps, null)(LoadingApp);

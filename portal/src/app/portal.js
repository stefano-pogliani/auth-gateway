import React from 'react';
import { connect } from 'react-redux';


class Portal extends React.Component {
  renderApps() {
    return (
      <div className="row">
        TODO
      </div>
    );
  }

  renderSearch() {
    return (
      <div className="row">
        <div className="col-12">
          <input
                type="email" className="form-control"
                placeholder="Search apps ..." />
        </div>
      </div>
    );
  }

  render() {
    if (this.props.authenticated) {
      return (
        <div className="container">
          {this.renderSearch()}
          {this.renderApps()}
        </div>
      );

    } else {
      return (
        <div className="container">
          <div className="alert alert-warning" role="alert">
            <h4 className="alert-heading">Login required</h4>
            <p>
              You are currently not logged in. <br />
              To see the list of available applications you have
              to login first!
            </p>
          </div>
        </div>
      );
    }
  }
};


const mapStateToProps = (state) => {
  return {
    authenticated: state.user.authenticated
  };
};
export default connect(mapStateToProps, null)(Portal);

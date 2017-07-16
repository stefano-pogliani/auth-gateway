import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Route } from 'react-router-dom';
import { Link } from 'react-router-dom';

import { connect } from 'react-redux';

import Login from '../login';
import Portal from '../portal';
import Profile from '../profile';


/*
 * This is the core application component which renders the
 * React router and the navigation bar.
 *
 * Pages are rendered as child components by ReactRouter.
 */
class LoadedApp extends React.Component {
  renderLogin() {
    return <Link className="btn btn-primary" to="/portal/login">Login</Link>;
  }

  renderUser() {
    return (
      <div className="col-1">
        <div className="dropdown">
          <img
              className="navbar-gravatar dropdown-toggle"
              id="dropdownUserMenu" data-toggle="dropdown"
              aria-haspopup="true" aria-expanded="false"
              src={this.props.avatar} />

          <div className="dropdown-menu" aria-labelledby="dropdownUserMenu">
            <Link className="dropdown-item" to="/portal/profile">Profile</Link>
            <div className="dropdown-divider"></div>
            <Link className="dropdown-item" to="/portal/logout">Logout</Link>
          </div>
        </div>
      </div>
    );
  }

  renderUserOrLogin() {
    if (this.props.authenticated) {
      return this.renderUser();
    } else {
      return this.renderLogin();
    }
  }

  renderNavBar() {
    return (
      <nav className="navbar sticky-top navbar-inverse bg-success">
        <div className="container">
          <div className="row justify-content-between">
            <div className="col-4">
              <Link className="navbar-brand" to="/portal/">AuthGateway</Link>
            </div>
            {this.renderUserOrLogin()}
          </div>
        </div>
      </nav>
    );
  }

  render() {
    return (
      <Router>
        <div>
          {this.renderNavBar()}
          <Route exact path="/portal/" component={Portal}/>
          <Route path="/portal/login" component={Login}/>
          <Route path="/portal/profile" component={Profile}/>
        </div>
      </Router>
    );
  }
};


const mapStateToProps = (state) => {
  return {
    authenticated: state.user.authenticated,
    avatar: state.user.avatar
  };
};
export default connect(mapStateToProps, null)(LoadedApp);

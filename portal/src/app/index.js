import React from 'react';
import { connect } from 'react-redux';

import LoadedApp from './root/loaded';
import LoadingApp from './root/loading';


/*
 * The root appliaction changes behaviour based on the state.
 *
 * This allows us to show a loading screen while the required
 * information is fatched through the API (by the LoadingApp
 * component).
 *
 * Once all required information is loaded we switch to
 * rendering a fully functional application (provided by the
 * LoadedApp component).
 */
class App extends React.Component {
  render() {
    if (this.props.loaded) {
      return <LoadedApp />;
    }
    return <LoadingApp />;
  }
};


const mapStateToProps = (state) => {
  return {
    loaded: state.loader.loaded
  }
};
export default connect(mapStateToProps, null)(App);

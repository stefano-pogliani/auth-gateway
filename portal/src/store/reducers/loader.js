import { FAIL_APPS } from '../actions';
import { FAIL_SETTINGS } from '../actions';
import { FAIL_USER } from '../actions';

import { FETCH_APPS } from '../actions';
import { FETCH_SETTINGS } from '../actions';
import { FETCH_USER } from '../actions';

import { STORE_APPS } from '../actions';
import { STORE_SETTINGS } from '../actions';
import { STORE_USER } from '../actions';


/*
 * The appliaction loads data in parallel.
 * The following details are loaded:
 *
 *   * General settings (portal details, login providers, ...).
 *   * User information.
 *   * Applications.
 */
let DefaultState = {
  failed: false,
  loaded: false,
  stages: {
    apps: {
      error: null,
      loaded: false,
      started: false
    },
    settings: {
      error: null,
      loaded: false,
      started: false
    },
    user: {
      error: null,
      loaded: false,
      started: false
    }
  }
};


const LoaderReducer = (state = DefaultState, action) => {
  // Deep-clone the current state for future updates.
  let newState = {
    ...state,
    stages: {
      apps: {...state.stages.apps},
      settings: {...state.stages.settings},
      user: {...state.stages.user}
    }
  };

  switch (action.type) {
    case FAIL_APPS:
      newState.failed = true;
      newState.stages.apps.error = action.message;
      return newState;

    case FAIL_SETTINGS:
      newState.failed = true;
      newState.stages.settings.error = action.message;
      return newState;

    case FAIL_USER:
      newState.failed = true;
      newState.stages.user.error = action.message;
      return newState;

    case FETCH_APPS:
      newState.stages.apps.started = true;
      return newState;

    case FETCH_SETTINGS:
      newState.stages.settings.started = true;
      return newState;

    case FETCH_USER:
      newState.stages.user.started = true;
      return newState;

    case STORE_APPS:
      newState.stages.apps.loaded = true;
      newState.loaded = (
        newState.stages.apps.loaded &&
        newState.stages.settings.loaded &&
        newState.stages.user.loaded
      );
      return newState;

    case STORE_SETTINGS:
      newState.stages.settings.loaded = true;
      newState.loaded = (
        newState.stages.apps.loaded &&
        newState.stages.settings.loaded &&
        newState.stages.user.loaded
      );
      return newState;

    case STORE_USER:
      newState.stages.user.loaded = true;
      newState.loaded = (
        newState.stages.apps.loaded &&
        newState.stages.settings.loaded &&
        newState.stages.user.loaded
      );
      return newState;

    default:
      return state;
  }
};
export default LoaderReducer;

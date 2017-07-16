import { failApps } from './actions';
import { failSettings } from './actions';
import { failUser } from './actions';

import { fetchApps } from './actions';
import { fetchSettings } from './actions';
import { fetchUser } from './actions';

import { storeApps } from './actions';
import { storeSettings } from './actions';
import { storeUser } from './actions';


export function fetchAll(store) {
  let state = store.getState().loader.stages;
  let dispatch = store.dispatch;

  // Fetch apps data.
  fetchData(
    dispatch, state.apps, "apps", "/portal/api/apps",
    failApps, fetchApps,
    (data) => storeApps(data.apps)
  );

  // Fetch settings data.
  fetchData(
    dispatch, state.settings, "settings", "/portal/api/settings",
    failSettings, fetchSettings,
    (data) => storeSettings(data)
  );

  // Fetch user data.
  fetchData(
    dispatch, state.user, "user information", "/portal/api/user",
    failUser, fetchUser,
    (data) => storeUser(data)
  );
}


function fetchData(
  dispatch, stage, stage_name, uri,
  fail_action, fetch_action, store_action
) {
  // Skip if aldready fetching.
  if (stage.started) {
    console.debug(`Not re-fetching ${stage_name}`);
    return;
  }

  // Fetch the data.
  dispatch(fetch_action());
  return fetch(uri, {
    credentials: "same-origin"

  }).then((response) => {
    if (!response.ok) {
      throw Error(`${response.statusText} [${response.status}]`);
    }
    return response.json().then((data) => {
      dispatch(store_action(data));
    });

  }).catch((err) => {
    dispatch(fail_action(err))
  });
};

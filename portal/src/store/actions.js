// Constants for the action types.
export const FAIL_APPS  = 'FAIL_APPS';
export const FAIL_SETTINGS = 'FAIL_SETTINGS';
export const FAIL_USER = 'FAIL_USER';

export const FETCH_APPS = 'FETCH_APPS';
export const FETCH_SETTINGS = 'FETCH_SETTINGS';
export const FETCH_USER = 'FETCH_USER';

export const STORE_APPS = 'STORE_APPS';
export const STORE_SETTINGS = 'STORE_SETTINGS';
export const STORE_USER = 'STORE_USER';


// Function retruning action objects.
export const failApps = (error) => {
  return {
    type: FAIL_APPS,
    message: error
  };
};

export const failSettings = (error) => {
  return {
    type: FAIL_SETTINGS,
    message: error
  };
};

export const failUser = (error) => {
  return {
    type: FAIL_USER,
    message: error
  };
};


export const fetchApps = () => {
  return { type: FETCH_APPS };
};

export const fetchSettings = () => {
  return { type: FETCH_SETTINGS };
};

export const fetchUser = () => {
  return { type: FETCH_USER };
};


export const storeApps = (apps) => {
  return {
    type: STORE_APPS,
    message: apps
  };
};

export const storeSettings = (settings) => {
  return {
    type: STORE_SETTINGS,
    message: settings
  };
};

export const storeUser = (user) => {
  return {
    type: STORE_USER,
    message: user
  };
};

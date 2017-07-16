// Include bootstrap (webpack automatically styles to <head>).
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.css';

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

// Import UI application and its style.
import { fetchAll } from './store/fetchers';
import store from './store';

import App from './app';
import AppStyle from './main.css';


ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("app")
);
fetchAll(store);

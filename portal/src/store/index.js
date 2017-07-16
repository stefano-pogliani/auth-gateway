import { createStore } from 'redux';
import MainReducer from './reducers/main';


const store = createStore(MainReducer);
export default store;

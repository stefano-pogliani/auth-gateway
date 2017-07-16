import { combineReducers } from 'redux';
import LoaderReducer from './loader';
import UserReducer from './user';


const MainReducer = combineReducers({
  loader: LoaderReducer,
  user: UserReducer
});
export default MainReducer;

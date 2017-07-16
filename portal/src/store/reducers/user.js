import { STORE_USER } from '../actions';


let DefaultState = {
  authenticated: false,
  avatar: 'https://www.gravatar.com/avatar/0?d=identicon',
  email: '',
  name: '',
  sessions: []
};


const UserReducer = (state = DefaultState, action) => {
  switch (action.type) {
    case STORE_USER:
      return action.message;

    default:
      return state;
  }
};
export default UserReducer;

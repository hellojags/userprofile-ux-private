import { ACT_TY_SET_USER_SESSION } from "../SnActionConstants"

//export default (state = getUserSession(), action) => {
const  SnUserSessionReducer = (state = null, action) => {
  switch (action.type) {
    case ACT_TY_SET_USER_SESSION:
      return action.payload
    default:
      return state
  }
};
export default SnUserSessionReducer;

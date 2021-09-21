import { ACT_TY_CHANGE_LOADER_STATE } from "../SnActionConstants"

const SnLoaderReducer = (state = false, action) => {
  switch (action.type) {
    case ACT_TY_CHANGE_LOADER_STATE:
      return action.payload
    default:
      return state
  }
};
export default SnLoaderReducer ;
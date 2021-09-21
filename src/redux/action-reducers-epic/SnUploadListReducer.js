import { ACT_TY_SET_UPLOAD_LIST } from "../SnActionConstants";

const SnUploadListReducer = (state = {}, action)=> {
    switch(action.type){
        case ACT_TY_SET_UPLOAD_LIST:
            return Object.assign({}, action.payload);
        default:
            return state;
    }
};
export default SnUploadListReducer;
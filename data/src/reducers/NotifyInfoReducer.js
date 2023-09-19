export default (state = null, action) => {
  switch(action.type){
    case 'set_notifyinfo':
      return action.payload;
    default:
      return state;
  }
}

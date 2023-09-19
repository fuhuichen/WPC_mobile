export default (state = null, action) => {
  switch(action.type){
    case 'set_lastpage':
      return action.payload;
    default:
      return state;
  }
}

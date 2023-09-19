export default (state = null, action) => {
  switch(action.type){
    case 'set_temprulelist':
      return action.payload;
    default:
      return state;
  }
}

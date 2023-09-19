export default (state = null, action) => {
  switch(action.type){
    case 'set_token':
      return action.payload;
    default:
      return state;
  }
  return null;
}

export default (state = false, action) => {
  switch(action.type){
    case 'set_logininfo':
      return action.payload;
    default:
      return state;
  }
  return null;
}

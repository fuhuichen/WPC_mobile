export default (state = null, action) => {
  switch(action.type){
    case 'set_loading':
      return action.payload;
    default:
      return state;
  }
  return null;
}

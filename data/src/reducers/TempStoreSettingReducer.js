export default (state = null, action) => {
  switch(action.type){
    case 'set_tempstoresetting':
      return action.payload;
    default:
      return state;
  }
  return null;
}

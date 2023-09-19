export default (state ='', action) => {
  switch(action.type){
    case 'set_serveraddress':
      return action.payload;
    default:
      return state;
  }
  return null;
}

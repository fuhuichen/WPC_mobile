export default (state = {}, action) => {
  switch(action.type){
    case 'set_ccmfilter':
      return action.payload;
    default:
      return state;
  }
  return null;
}

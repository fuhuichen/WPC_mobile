export default (state = null, action) => {
  switch(action.type){
    case 'select_storelist':
      return action.payload;
    default:
      return state;
  }
  return null;
}

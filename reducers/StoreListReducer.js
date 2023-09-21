export default (state = [], action) => {
  switch(action.type){
    case 'set_storelist':
      return action.payload;
    default:
      return state;
  }
  return null;
}

export default (state = { type:'全部門店'}, action) => {
  switch(action.type){
    case 'set_storesetting':
      return action.payload;
    default:
      return state;
  }
  return null;
}

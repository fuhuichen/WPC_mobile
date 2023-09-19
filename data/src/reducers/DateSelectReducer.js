export default (state = null, action) => {
  switch(action.type){
    case 'select_date':
      return action.payload;
    default:
      return state;
  }
  return null;
}

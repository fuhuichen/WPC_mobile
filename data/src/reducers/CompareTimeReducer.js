export default (state = '今天', action) => {
  switch(action.type){
    case 'set_comparetime':
      return action.payload;
    default:
      return state;
  }
}

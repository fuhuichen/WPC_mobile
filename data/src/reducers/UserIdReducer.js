export default (state = '', action) => {
  switch(action.type){
    case 'set_userid':
      return action.payload;
    default:
      return state;
  }
}

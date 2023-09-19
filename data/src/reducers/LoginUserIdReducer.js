export default (state = '', action) => {
  switch(action.type){
    case 'set_loginuserid':
      return action.payload;
    default:
      return state;
  }
}

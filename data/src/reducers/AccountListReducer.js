export default (state =null, action) => {
  switch(action.type){
    case 'set_accountlist':
      return action.payload;
    default:
      return state;
  }
}

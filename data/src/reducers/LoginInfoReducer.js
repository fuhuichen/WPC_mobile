export default (state ={email:'', password:''}, action) => {
  switch(action.type){
    case 'set_logininfo':
      return action.payload;
    default:
      return state;
  }
}

export default (state = false, action) => {
  switch(action.type){
    case 'set_smallphone':
      return action.payload;
    default:
      return state;
  }
}

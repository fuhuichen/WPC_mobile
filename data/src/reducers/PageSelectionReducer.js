export default (state = 'PageLaunch', action) => {
  switch(action.type){
    case 'select_page':
      return action.payload;
    default:
      return state;
  }
}

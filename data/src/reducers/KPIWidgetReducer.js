export default (state = null, action) => {
  switch(action.type){
    case 'select_kpiwidget':
      return action.payload;
    default:
      return state;
  }
  return null;
}

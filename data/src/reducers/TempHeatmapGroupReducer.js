export default (state = null, action) => {
  switch(action.type){
    case 'set_tempheatmapgroup':
      return action.payload;
    default:
      return state;
  }
}

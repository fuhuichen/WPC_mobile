export default (state ={      mode:'資料比較',
                              setting:{
                                資料比較:{
                                  data:'客流量',
                                  period:{},
                                  store:{ type:'region', country:'全部門店'}
                                },
                                跨店比較:{
                                  period:{},
                                  stores:[{selected:true, type:'region', country:'全部門店'},
                                          {selected:false, type:'region', country:'全部門店'},
                                          {selected:false, type:'region', country:'全部門店'}]
                                },
                                跨時比較:{
                                  period:{},
                                  store:{ type:'region', country:'全部門店'},
                                  compare:[{selected:true,time:{},period:{}},{selected:false,time:{},period:{}}]
                                },
                             }
                        }, action) => {
  switch(action.type){
    case 'set_comparation':
      return action.payload;
    default:
      return state;
  }
  return null;
}

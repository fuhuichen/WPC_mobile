const TYPE_COLOR= function(type){
   if(type=="temperature")
    return "#8EA473"
   else if(type=='humidity')
     return "#006AB7"
  else if(type=='switch')
       return "#6E328B"
   else
     return "#006AB7"
}
export default TYPE_COLOR;

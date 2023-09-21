

const UNITS= function(type){
   if(type=="temperature")
    return "°C"
  else if(type=='humidity')
    return "%"
  else
    return ""
}
export default UNITS;

const DEVICE_TYPES=[
  //{name:" iDS.SignageCMS ",model:'iDS.SignageCMS',isLeoSensor:false,category:'g',sepScan:false,displayName:"iDS.SignageCMS",limitSN:12,limitID:32},
  {name:" LEO Gateway ",model:'USM-S67-0',isLeoSensor:false,category:'g',sepScan:true,displayName:"USM-S67-G00P0",limitSN:12,limitID:12},
  {name:" LEO Gateway ",model:'USM-S67-W',isLeoSensor:false,category:'g',sepScan:true,displayName:"USM-S67-G0WP0",limitSN:12,limitID:12},
  {name:" LEO Sensor ",model:'LEO-S552',isLeoSensor:true,category:'s',sepScan:true,displayName:"LEO-S552-THG0",limitSN:16,limitID:16},
  {name:" LEO Sensor ",model:'LEO-S572',isLeoSensor:true,category:'s',sepScan:true,displayName:"LEO-S572-TPG0",limitSN:16,limitID:16},
//  {name:" LEO Sensor ",model:'LEO-S592-AQG0',isLeoSensor:true,category:'s',sepScan:true,displayName:"LEO-S592-AQG0",limitSN:16,limitID:16},
  {name:" LEO Sensor ",model:'LEO-S595-B',isLeoSensor:true,category:'s',sepScan:true,displayName:"LEO-S595-WBG0",limitSN:12,limitID:16},
  {name:" LEO Sensor ",model:'LEO-S595-S',isLeoSensor:true,category:'s',sepScan:true,displayName:"LEO-S595-MSG0",limitSN:12,limitID:16},
  {name:" TREK Sensor ",model:'TREK-120G2',isLeoSensor:false,category:'s',sepScan:false,displayName:"TREK-120",limitSN:10,limitID:16},
  {name:" TREK Gateway ",model:'USM-S62',isLeoSensor:false,category:'g',sepScan:false,displayName:"USM-S62",limitSN:10,limitID:16},
]
export default DEVICE_TYPES;

exports.analysisType = {
    inspectionProgress:1, //巡檢進度
    storeSpecialEvent:2,  //門店特殊事件
    missingRecord:3,      //缺失處理狀態
    missingStatistcs:4,   //缺失妥善率
    PatrolStatistics:5,   //巡店次數
    PatrolAmount:6,       //巡店總數
}
exports.analysisObject=[
    {
        id:1,
        type:1,
        objTitle:'門店巡檢進度',
        objOrder:2,
        objTop:0,
        objHeight:200,
        objData:{

        },
    },
    {
        id:2,
        type:2,
        objTitle:'門店特殊事件',
        objOrder:0,
        objTop:220,
        objHeight:200,
        objData:{},
    },
    {
        id:3,
        type:3,
        objTitle:'缺失處理狀態',
        objOrder:1,
        objTop:440,
        objHeight:200,
        objData:{},
    },
    {
        id:4,
        type:2,
        objTitle:'門店特殊事件',
        objOrder:4,
        objTop:640,
        objHeight:200,
        objData:{},
    }
]
    



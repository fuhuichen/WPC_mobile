export const selectLibrary = (libraryId) => {
  console.log('ID=' + libraryId);
  return {
      type: 'select_library',
      payload : libraryId
  };

}
export const setLastPage = (pageId) => {
  console.log('Select Last Page ID=' + pageId);
  return {
      type: 'set_lastpage',
      payload : pageId
  };

}

export const setServerAddress= (address) => {
  return {
      type: 'set_serveraddress',
      payload : address
  };

}

export const selectPage = (pageId) => {
  console.log('Select Page ID=' + pageId);
  return {
      type: 'select_page',
      payload : pageId
  };

}

export const selectKPIWidget = (widget) => {
  return {
      type: 'select_kpiwidget',
      payload : widget
  };

}

export const setWidgetList = (list) => {
  return {
      type: 'set_widgetlist',
      payload : list
  };

}
export const setStoreList = (list) => {
  console.log("setStoreList:",list);
  return {
      type: 'set_storelist',
      payload : list
  };

}

export const setStoreSetting= (info) => {
  return {
      type: 'set_storesetting',
      payload : info
  };

}
export const setPosStoreSetting= (info) => {
  return {
      type: 'set_posstoresetting',
      payload : info
  };

}

export const setExportMode= (info) => {
  return {
      type: 'set_exportmode',
      payload : info
  };

}
export const setTempStoreSetting= (info) => {
  return {
      type: 'set_tempstoresetting',
      payload : info
  };

}

export const selectSotreList = (list) => {
  return {
      type: 'select_storelist',
      payload : list
  };

}
export const selectOverviewUnit = (unit) => {
  return {
      type: 'select_overview_unit',
      payload : unit
  };

}

export const selectDate = (date) => {
  return {
      type: 'select_date',
      payload : date
  };

}


export const selectOverviewRange= (range) => {
  return {
      type: 'select_overview_range',
      payload : range
  };

}


export const setUserId  = (id) => {
  return {
      type: 'set_userid',
      payload : id
  };

}
export const setLoginUserId  = (id) => {
  return {
      type: 'set_loginuserid',
      payload : id
  };

}

export const setUserInfo  = (info) => {
  return {
      type: 'set_userinfo',
      payload : info
  };

}

export const setLoginInfo  = (info) => {
  return {
      type: 'set_logininfo',
      payload : info
  };

}

export const setToken  = (token) => {
  return {
      type: 'set_token',
      payload : token
  };

}

export const setCompareTime  = (compare) => {
  return {
      type: 'set_comparetime',
      payload : compare
  };

}

export const setTagList = (list) => {
  return {
      type: 'set_taglist',
      payload : list
  };

}

export const setGroupList = (list) => {
  return {
      type: 'set_grouplist',
      payload : list
  };

}


export const setComparation = (setting) => {
  return {
      type: 'set_comparation',
      payload : setting
  };

}

export const setPosStore = (store)=>{
  return {
      type: 'select_posstore',
      payload : store
  };
}
export const setTempGroupId= (id)=>{
  return {
      type: 'set_tempgroupid',
      payload : id
  };
}

export const setSmallPhone= (small)=>{
  return {
      type: 'set_smallphone',
      payload : small
  };
}
export const setReportSetting= (setting)=>{
  return {
      type: 'set_reportsetting',
      payload : setting
  };
}
export const setReportDaySetting= (setting)=>{
  return {
      type: 'set_reportdaysetting',
      payload : setting
  };
}

export const setReportWeekSetting= (setting)=>{
  return {
      type: 'set_reportweeksetting',
      payload : setting
  };
}

export const setReportTrendSetting= (setting)=>{
  return {
      type: 'set_reporttrendsetting',
      payload : setting
  };
}

export const setReportAirSetting= (setting)=>{
  return {
      type: 'set_reportairsetting',
      payload : setting
  };
}


export const setRankSetting= (setting)=>{
  return {
      type: 'set_ranksetting',
      payload : setting
  };
}

export const setTempReportStore= (setting)=>{
  return {
      type: 'set_tempreportstore',
      payload : setting
  };
}

export const setHeatmapInfo= (setting)=>{
  return {
      type: 'set_heatmapinfo',
      payload : setting
  };
}

export const setTempRuleList= (list)=>{
  return {
      type: 'set_temprulelist',
      payload : list
  };
}

export const setHeatmapGroups= (groups)=>{
  return {
      type: 'set_heatmapgroup',
      payload : groups
  };
}

export const setTempHeatmapGroups= (groups)=>{
  return {
      type: 'set_tempheatmapgroup',
      payload : groups
  };
}

export const setAccountList= (groups)=>{
  return {
      type: 'set_accountlist',
      payload : groups
  };
}

export const setSignupInfo= (groups)=>{
  return {
      type: 'set_signupinfo',
      payload : groups
  };
}

export const setStudentReviewMode = (mode)=>{
  return {
      type: 'set_studentreviewmode',
      payload : mode
  };
}

export const setNotifyInfo = (mode)=>{
  return {
      type: 'set_notifyinfo',
      payload : mode
  };
}

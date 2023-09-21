export const setLoading = (loading) => {
  return {
      type: 'set_loading',
      payload : loading
  };

}
export const setLoginInfo = (payload) => {
  return {
      type: 'set_logininfo',
      payload : payload
  };

}
export const setStoreList = (payload) => {
  return {
      type: 'set_storelist',
      payload : payload
  };

}

export const setCcmFilter = (payload) => {
  return {
      type: 'set_ccmfilter',
      payload : payload
  };

}

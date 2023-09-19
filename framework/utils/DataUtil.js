import AsyncStorage from '@react-native-async-storage/async-storage';

export default class StorageUtil{

  static get= async(key) => {
      return await AsyncStorage.getItem(key);
  };
  static set =async(key,value)=>{
    return await AsyncStorage.setItem(key,value);
  }
  static remove =async(key,value)=>{
    return await AsyncStorage.removeItem(key)
  }
  static getObj= async(key) => {
      let res=  await AsyncStorage.getItem(key);
      if(res){
        return JSON.parse(res)
      }
      else {
        return res;
      }
  };
  static setObj =async(key,value)=>{
    let data = ""
    if(value){
      data = JSON.stringify(value)
    }
    return await AsyncStorage.setItem(key,data);
  }
  static set =async(key,value)=>{
    return await AsyncStorage.setItem(key,value);
  }
}

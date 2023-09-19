import React from 'react';
import {Provider} from  'react-redux';
import {createStore} from 'redux';
import reducers from './reducers'
import PageRouter from './app/PageRouter';
import {Dimensions,Text,TextInput} from 'react-native';

import {Appearance} from 'react-native';

if (Text.defaultProps == null) {
    Text.defaultProps = {};
    Text.defaultProps.allowFontScaling = false;
}

if (TextInput.defaultProps == null) {
    TextInput.defaultProps = {};
    TextInput.defaultProps.allowFontScaling = false;
}

const APP = ()=>{
  return(<Provider store={createStore(reducers)}>
              <PageRouter>App</PageRouter>
         </Provider>);
}


export default APP;

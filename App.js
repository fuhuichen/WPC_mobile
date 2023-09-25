
import React from 'react';
import {Provider} from  'react-redux';
import PageRouter from './app/PageRouter';
import {createStore} from 'redux';
import reducers from './reducers'

const APP = () => {
  return (
    <Provider store={createStore(reducers)}>
      <PageRouter>App</PageRouter>
    </Provider>
  )
}

export default APP;

import React from 'react';
import {Actions} from "react-native-router-flux";

export default class RouteCore{
    static isContain(screen){
        return (Actions.state.routes.findIndex(p => p.routeName === screen) !== -1);
    }
}

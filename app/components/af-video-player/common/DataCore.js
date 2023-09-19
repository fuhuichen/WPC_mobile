import React from 'react';

export default class DataCore {
    static getCities(data){
       return [...new Set(data.map(p => p.city))];
    }

    static getDomains(data, city){
        return  [...new Set(data.filter(p => p.city === city)
            .map(v => v.domain))];
    }

    static getCells(data, city, domain){
        return [...new Set(data.filter(p => ((p.city === city) && (p.domain === domain))))];
    }
 }

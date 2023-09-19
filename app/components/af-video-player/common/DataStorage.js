import React from 'react';
import store from 'react-native-simple-store';

export default class DataStorage {
    static async save(key, value){
        await store.save(key, value);
    }

    static async get(key){
        await store.get(key);
    }

    static async delete(key){
        await store.delete(key);
    }
 }

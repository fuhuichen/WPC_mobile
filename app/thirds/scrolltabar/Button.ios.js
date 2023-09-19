const React = require('react');
const ReactNative = require('react-native');
const {
    TouchableOpacity,
    View,
} = ReactNative;

const ButtonIos = (props) => {
    return <TouchableOpacity {...props}>
    {props.children}
</TouchableOpacity>;
};

module.exports = ButtonIos;
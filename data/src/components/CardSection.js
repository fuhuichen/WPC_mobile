import React from 'react';
import {StyleSheet, View} from 'react-native';

export default class CardSection extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
  }

  render () {
    return (<View  style={styles.containerStyle}>
              {this.props.children}
          </View>);
  }
}

CardSection.propTypes = {   children: React.PropTypes.any};
CardSection.defaultProps = {   children:undefined};

const styles = StyleSheet.create({
  containerStyle:{
    flexWrap :'nowrap',
    padding:5,
    justifyContent : 'center',
    flexDirection: 'column',
    paddingTop : 10,
    paddingBottom : 10,
    paddingLeft : 20,
    paddingRight : 20,
  },
});

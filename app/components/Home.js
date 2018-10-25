// @flow
import { ipcRenderer } from 'electron';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
import styles from './Home.css';

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

  state = {
    title: 'FlashTray'
  }

  toggleTray() {
    const { title } = this.state;
    if (title === 'FlashTray') {
      ipcRenderer.send('flashTray');
      this.setState({
        title: 'CancelFlashTray'
      });
    } else {
      ipcRenderer.send('cancelFlashTray');
      this.setState({
        title: 'FlashTray'
      });
    }
  }

  render() {
    const { ...state } = this.state;
    return (
      <div className={styles.container} data-tid="container">
        <h2>Home</h2>
        <button type="button" onClick={this.toggleTray.bind(this)} data-role="ddd">{state.title}</button>
        <Link to={routes.COUNTER}>to Counter</Link>
      </div>
    );
  }
}

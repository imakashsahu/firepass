import {LitElement, html, css} from 'lit-element';
import {property, query, customElement} from 'lit-element';

import {EventsMixin} from '../mixins/events-mixin';
import {State} from '../modules/state-types';
import {StateMixin} from '../mixins/state-mixin';
import {FpPassGenerator} from './fp-pass-generator';
import {FpSettings} from './fp-settings';
import {appConfig} from '../config/application';
import {sharedStyles} from './fp-styles'
import '../oxygen/oxy-button';
import '../oxygen/oxy-icon';
import '../oxygen/oxy-icons-base';
import '../oxygen/oxy-icons-communication';
import '../oxygen/oxy-icons-logos';
import './fp-pass-generator';
import './fp-settings';

@customElement('fp-app-toolbar')
export class FpAppToolbar extends StateMixin(EventsMixin(LitElement)) {
  static get styles() {
    return css`
      ${sharedStyles}
      #toolbar {
        display: flex;
        flex-direction: row;
        align-items: center;
        background-color: rgba(255, 255, 255, 0.1);
        box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
      }
      #lock-button {
        position: relative;
      }
      #lock-button > div {
        position: absolute;
        font-size: 0.7em;
        color: black;
        background-color: var(--secondary-text-color);
        bottom: 14px;
      }
      #logo {
        display: flex;
        align-items: center;
        flex-grow: 1;
      }
      #logo > oxy-icon {
        color: var(--theme-color-fire3);
        padding: 10px;
      }
      #logo > oxy-button {
        color: var(--theme-color-fire3);
        display: none;
        padding: 6px;
        margin: 4px;
        border-radius: 18px;
      }
      #logo h1 {
        color: var(--tertiary-text-color);
        font-size: 1.2em;
        margin: 0;
      }
      oxy-button {
        color: var(--secondary-text-color);
        padding: 12px;
        border-radius: 0;
      }

      @media screen and (max-width: 700px) {
        #logo > oxy-icon {
          display: none;
        }
        #logo > oxy-button {
          display: inline-flex;
        }
        :host([sidebar]) #logo > oxy-icon {
          display: flex;
        }
        :host([sidebar]) #logo > oxy-button {
          display: none;
        }
      }
    `;
  }

  private idleTimeoutIntervalHandle: number = -1;

  @query('fp-pass-generator') generator: FpPassGenerator|undefined;
  @query('fp-settings') settings: FpSettings|undefined;

  @property({type: Boolean}) dbUnlocked = false;
  @property({type: String}) idleTimeout = '';
  @property({type: Boolean, reflect: true}) sidebar = false;

  connectedCallback() {
    super.connectedCallback();
    this.resetIdleTimeoutInterval();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.clearIdleTimeoutInterval();
  }

  updated(changedProps: Map<string, unknown>) {
    if (changedProps.has('dbUnlocked')) {
      this.resetIdleTimeoutInterval();
    }
  }

  stateChanged(newState: State, oldState: State|null) {
    if (!oldState || newState.lastActivityMs !== oldState.lastActivityMs) {
      this.resetIdleTimeoutInterval();
    }
    this.sidebar = newState.sidebarVisible;
  }

  render() {
    return html`
      <div id="toolbar">
        <!-- Logo. -->
        <div id="logo">
          <oxy-icon icon="logos:firepass"></oxy-icon>
          <oxy-button
              title="Show entry list"
              @click=${this.onShowSidebar}>
            <oxy-icon icon="icons:arrow-back"></oxy-icon>
          </oxy-button>
          <h1>Firepass</h1>
        </div>

        <!-- Buttons. -->
        <oxy-button
            title="Generate Password"
            @click=${this.onOpenGenerator}>
          <oxy-icon icon="communication:vpn-key"></oxy-icon>
        </oxy-button>
        <oxy-button
            title="Settings"
            @click=${this.onOpenSettings}>
          <oxy-icon icon="icons:settings"></oxy-icon>
        </oxy-button>
        <oxy-button
            title="Log out"
            @click=${this.onLogout}>
          <oxy-icon icon="icons:power-settings-new"></oxy-icon>
        </oxy-button>
        <oxy-button
            id="lock-button"
            title="Lock database"
            ?disabled=${!this.dbUnlocked}
            @click=${this.onLock}>
          <oxy-icon icon="icons:lock"></oxy-icon>
          <div ?hidden=${!this.idleTimeout}>${this.idleTimeout}</div>
        </oxy-button>
      </div>

      <fp-pass-generator></fp-pass-generator>
      <fp-settings></fp-settings>
    `;
  }

  private onShowSidebar() {
    window.history.back();
  }

  private onOpenGenerator() {
    const generator = this.generator;
    if (!generator) return;
    generator.open();
  }

  private onOpenSettings() {
    const settings = this.settings;
    if (!settings) return;
    settings.open();
  }

  private onLogout() {
    this.dispatch(this.USER_SIGNOFF);
  }

  private onLock() {
    this.dispatch(this.DB_LOCK);
  }

  private resetIdleTimeoutInterval() {
    this.clearIdleTimeoutInterval();
    this.idleTimeoutIntervalHandle = window.setInterval(
          this.updateIdleTimeout.bind(this), 1000);
    this.updateIdleTimeout();
  }

  private clearIdleTimeoutInterval() {
    if (this.idleTimeoutIntervalHandle < 0) return;
    window.clearInterval(this.idleTimeoutIntervalHandle);
    this.idleTimeoutIntervalHandle = -1;
  }

  private updateIdleTimeout() {
    if (!this.dbUnlocked) {
      this.idleTimeout = '';
      return;
    }

    const elapsedMs = Date.now() - this.getState().lastActivityMs;
    const remainingMs = Math.max(0, appConfig.idleTimeoutMs - elapsedMs);
    const remainingSecs = Math.ceil(remainingMs / 1000);
    const remainingMins = Math.ceil(remainingSecs / 60);
    if (remainingSecs >= 60) {
      this.idleTimeout = remainingMins.toString();
    } else if (remainingSecs > 0) {
      this.idleTimeout = remainingSecs.toString();
    } else {
      this.idleTimeout = '';
    }
  }
}

import {LitElement, html, css} from 'lit-element';
import {customElement, property} from 'lit-element';

import {DbEntry} from '../database/db-types';
import {FpDbEntryIcons} from './fp-db-entry-icons';
import {OxyDialog} from '../oxygen/oxy-dialog';
import {OxyInput} from '../oxygen/oxy-input';
import {OxyTextarea} from '../oxygen/oxy-textarea';
import {sharedStyles} from './fp-styles'
import {OxyToast} from '../oxygen/oxy-toast';
import './fp-db-entry-icons';
import '../oxygen/oxy-button';
import '../oxygen/oxy-dialog';
import '../oxygen/oxy-input';
import '../oxygen/oxy-textarea';
import '../oxygen/oxy-toast';

@customElement('fp-db-entry')
export class FpDbEntry extends LitElement {
  static get styles() {
    return css`
      ${sharedStyles}
      :host {
        display: flex;
        flex-direction: column;
        margin: 16px;
      }

      #empty {
        font-size: 1.2em;
        color: var(--separator-color);
        text-align: center;
        margin: 128px 32px;
      }

      #header {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-bottom: 12px;
      }
      #header #icon {
        width: 32px;
        height: 32px;
        padding: 2px;
        margin-right: 8px;
      }
      #header #icon-change {
        padding: 6px;
        margin: 0 8px 0 0;
        background-color: var(--theme-color-ice1);
      }
      #header #icon-change oxy-icon {
        width: 24px;
        height: 24px;
      }
      #header oxy-input {
        font-size: 1.2em;
        flex-grow: 1;
      }
      #header oxy-input[readonly] {
        --oxy-input-border-color: transparent;
        --oxy-input-border-color-focused: transparent;
      }

      #button-bar {
        display: flex;
        justify-content: flex-end;
      }
      #button-bar oxy-button {
        margin-left: 16px;
        min-width: 72px;
        background-color: var(--separator-color);
      }
      #button-bar oxy-button oxy-icon {
        margin-right: 8px;
      }
      #button-bar #save-button {
        background-color: var(--theme-color-ice1);
      }

      #delete-dialog {
        display: flex;
        flex-direction: column;
        align-items: center;
        top: 20%;
        left: 20%;
        right: 20%;
        max-height: 60%;
        background-color: #333;
        border-radius: 8px;
        transform: none;
      }
      #delete-dialog oxy-icon {
        margin-right: 8px;
      }
      #delete-dialog #delete-cancel-button {
        background-color: var(--theme-color-gray);
        margin: 32px 8px;
      }
      #delete-dialog #delete-confirm-button {
        background-color: var(--theme-color-fire1);
        margin: 32px 8px;
      }

      table {
        border-collapse: separate;
        border-spacing: 0 2px;
      }
      table th {
        font-weight: normal;
        width: 1px;
        white-space: nowrap;
        text-align: left;
        padding: 2px 8px;
        color: var(--tertiary-text-color);
      }
      oxy-input[readonly] {
        --oxy-input-background-color: transparent;
        --oxy-input-background-color-focused: transparent;
        --oxy-input-border-color: var(--separator-color-faint);
        --oxy-input-border-color-focused: var(--separator-color-faint);
        --oxy-input-box-shadow: none;
        --oxy-input-box-shadow-focused: none;
      }
      oxy-input [slot="after"] {
        margin-right: 4px;
      }
      oxy-input oxy-button {
        color: var(--tertiary-text-color);
        padding: 4px;
      }
      oxy-input oxy-button oxy-icon {
        width: 16px;
        height: 16px;
      }

      oxy-textarea {
        min-height: 8em;
        margin: 4px 0;
      }
      oxy-textarea[readonly] {
        --oxy-textarea-background-color: transparent;
        --oxy-textarea-background-color-focused: transparent;
        --oxy-textarea-border-color: var(--separator-color-faint);
        --oxy-textarea-border-color-focused: var(--separator-color-faint);
        --oxy-textarea-box-shadow: none;
        --oxy-textarea-box-shadow-focused: none;
      }

      [show-password] {
        color: var(--theme-color-fire3);
      }
      [flex-row] {
        display: flex;
        flex-direction: row;
        align-items: center;
      }
      [flex-grow] {
        flex-grow: 1;
      }
      [hidden] {
        display: none !important;
      }
    `;
  }

  private iconSelector: FpDbEntryIcons|null = null;
  private deleteDialog: OxyDialog|null = null;
  private toast: OxyToast|null = null;

  @property({type: Object}) entry: DbEntry|null = null;
  @property({type: Boolean}) editing: boolean = false;
  @property({type: Boolean}) showPassword: boolean = false;
  @property({type: String}) entryIcon: string = '';

  firstUpdated() {
    if (!this.shadowRoot) return;
    this.iconSelector =
        <FpDbEntryIcons>this.shadowRoot.getElementById('icon-selector');
    this.deleteDialog =
        <OxyDialog>this.shadowRoot.getElementById('delete-dialog');
    this.toast = <OxyToast>this.shadowRoot.getElementById('toast');
  }

  updated(changedProps: Map<string, any>) {
    if (changedProps.has('entry')) {
      this.editing = false;
      this.showPassword = false;
      this.copyEntryToInputs();
    }
  }

  render() {
    return html`
      ${!this.entry ? this.renderEmpty() : this.renderView()}

      <fp-db-entry-icons
          id="icon-selector"
          @changed=${this.onIconSelected}>
      </fp-db-entry-icons>

      <oxy-dialog id="delete-dialog" backdrop>
        <h1>Delete entry?</h1>
        <div flex-row>
          <oxy-icon icon=${this.entryIcon}></oxy-icon>
          <div>${this.entry ? this.entry.name : ''}</div>
        </div>
        <div class="dialog-buttons">
          <oxy-button
              id="delete-cancel-button"
              raised
              @click=${this.closeDeleteDialog}>
            Cancel
          </oxy-button>
          <oxy-button
              id="delete-confirm-button"
              raised
              @click=${this.confirmDeleteDialog}>
            Delete
          </oxy-button>
        </div>
      </oxy-dialog>

      <oxy-toast id="toast"></oxy-toast>
    `;
  }

  private renderEmpty() {
    return html`<div id="empty">Select an entry</div>`;
  }

  private renderView() {
    if (!this.entry) return html``;
    return html`
      <div id="header">
        <oxy-icon
            id="icon"
            icon=${this.entryIcon}
            ?hidden=${this.editing}>
        </oxy-icon>
        <oxy-button
            id="icon-change"
            title="Change icon"
            raised
            ?hidden=${!this.editing}
            @click=${this.onSelectIcon}>
          <oxy-icon icon=${this.entryIcon}></oxy-icon>
        </oxy-button>
        <oxy-input id="name" ?readonly=${!this.editing}></oxy-input>
      </div>

      <table>
        <tr>
          <th>URL</th>
          <td>
            <oxy-input id="url" ?readonly=${!this.editing}>
              <div flex-row slot="after">
                <oxy-button
                    ?disabled=${!this.entry.url}
                    ?hidden=${this.editing}
                    @click=${this.onOpenUrl}>
                  <oxy-icon icon="icons:open-in-new"></oxy-icon>
                </oxy-button>
                <oxy-button
                    ?disabled=${!this.entry.url}
                    @click=${this.onCopyUrl}>
                  <oxy-icon icon="icons:content-copy"></oxy-icon>
                </oxy-button>
              </div>
            </oxy-input>
          </td>
        </tr>

        <tr>
          <th>Email</th>
          <td>
            <oxy-input id="email" ?readonly=${!this.editing}>
              <div flex-row slot="after">
                <oxy-button
                    ?disabled=${!this.entry.email}
                    @click=${this.onCopyEmail}>
                  <oxy-icon icon="icons:content-copy"></oxy-icon>
                </oxy-button>
              </div>
            </oxy-input>
          </td>
        </tr>

        <tr>
          <th>Login</th>
          <td>
            <oxy-input id="login" ?readonly=${!this.editing}>
              <div flex-row slot="after">
                <oxy-button
                    ?disabled=${!this.entry.login}
                    @click=${this.onCopyLogin}>
                  <oxy-icon icon="icons:content-copy"></oxy-icon>
                </oxy-button>
              </div>
            </oxy-input>
          </td>
        </tr>

        <tr>
          <th>Pasword</th>
          <td>
            <oxy-input
                id="password"
                ?readonly=${!this.editing}
                .type=${this.showPassword ? 'text' : 'password'}>
              <div flex-row slot="after">
                <oxy-button
                    ?show-password=${this.showPassword}
                    @click=${this.onToggleShowPasswordClick}>
                  <oxy-icon icon="icons:visibility"></oxy-icon>
                </oxy-button>
                <oxy-button
                    ?hidden=${!this.editing}
                    @click=${this.onGeneratePassword}>
                  <oxy-icon icon="communication:vpn-key"></oxy-icon>
                </oxy-button>
                <oxy-button
                    ?hidden=${this.editing}
                    ?disabled=${!this.entry.password}
                    @click=${this.onCopyPassword}>
                  <oxy-icon icon="icons:content-copy"></oxy-icon>
                </oxy-button>
              </div>
            </oxy-input>
          </td>
        </tr>

        <tr>
          <td colspan="3">
            <oxy-textarea
                id="notes"
                placeholder="Notes"
                ?readonly=${!this.editing}>
            </oxy-textarea>
          </td>
        </tr>
      </table>

      <div flex-grow></div>

      <div id="button-bar">
        <oxy-button
            id="delete-button"
            title="Delete entry"
            raised
            ?hidden=${this.editing}
            @click=${this.openDeleteDialog}>
          <oxy-icon icon="icons:delete"></oxy-icon>
          Delete
        </oxy-button>
        <oxy-button
            id="edit-button"
            title="Edit entry"
            raised
            ?hidden=${this.editing}
            @click=${this.onEditClick}>
          <oxy-icon icon="icons:create"></oxy-icon>
          Edit
        </oxy-button>
        <oxy-button
            id="revert-button"
            title="Revert changes"
            raised
            ?hidden=${!this.editing}
            @click=${this.onRevertClick}>
          <oxy-icon icon="icons:settings-backup-restore"></oxy-icon>
          Revert
        </oxy-button>
        <oxy-button
            id="save-button"
            title="Save entry"
            raised
            ?hidden=${!this.editing}
            @click=${this.onSaveClick}>
          <oxy-icon icon="icons:save"></oxy-icon>
          Save
        </oxy-button>
      </div>
    `;
  }

  private onEditClick() {
    this.editing = true;
  }

  private openDeleteDialog() {
    if (!this.deleteDialog) return;
    this.deleteDialog.open();
  }

  private closeDeleteDialog() {
    if (!this.deleteDialog) return;
    this.deleteDialog.close();
  }

  private confirmDeleteDialog() {
    this.closeDeleteDialog();
    this.dispatchEvent(new CustomEvent('delete', {detail: this.entry}));
  }

  private onSaveClick() {
    this.copyInputsToEntry();
    this.editing = false;
    this.dispatchEvent(new CustomEvent('save', {detail: this.entry}));
  }

  private onRevertClick() {
    this.copyEntryToInputs();
    this.editing = false;
  }

  private onOpenUrl() {
    if (!this.entry) return;
    window.open(this.entry.url, '_blank');
  }

  private onGeneratePassword() {
  }

  private onCopyUrl() {
    this.copyToClipboard('url');
    this.openToast('URL copied to clipboard');
  }

  private onCopyEmail() {
    this.copyToClipboard('email');
    this.openToast('Email copied to clipboard');
  }

  private onCopyLogin() {
    this.copyToClipboard('login');
    this.openToast('Login copied to clipboard');
  }

  private onCopyPassword() {
    this.copyToClipboard('password');
    this.openToast('Password copied to clipboard');
  }

  private copyToClipboard(inputId: string) {
    if (!this.shadowRoot) return;
    const input = <OxyInput>this.shadowRoot.getElementById(inputId);
    input.copyToClipboard();
  }

  private openToast(message: string) {
    if (!this.toast) return;
    this.toast.openNormal(message);
  }

  private onSelectIcon() {
    if (!this.iconSelector) return;
    this.iconSelector.open();
  }

  private onIconSelected(event: CustomEvent<string>) {
    if (!event.detail) return;
    this.entryIcon = event.detail;
  }

  private onToggleShowPasswordClick() {
    this.showPassword = !this.showPassword;
  }

  private copyEntryToInputs() {
    this.copyBetweenEntryAndInputs(/*entryToInputs=*/true);
  }

  private copyInputsToEntry() {
    this.copyBetweenEntryAndInputs(/*entryToInputs=*/false);
  }

  private copyBetweenEntryAndInputs(entryToInputs: boolean) {
    if (!this.entry) return;
    if (!this.shadowRoot) return;
    const nameInput = <OxyInput>this.shadowRoot.getElementById('name');
    const urlInput = <OxyInput>this.shadowRoot.getElementById('url');
    const emailInput = <OxyInput>this.shadowRoot.getElementById('email');
    const loginInput = <OxyInput>this.shadowRoot.getElementById('login');
    const passwordInput = <OxyInput>this.shadowRoot.getElementById('password');
    const notesInput = <OxyTextarea>this.shadowRoot.getElementById('notes');

    if (entryToInputs) {
      this.entryIcon = this.entry.icon;
      nameInput.value = this.entry.name;
      urlInput.value = this.entry.url;
      emailInput.value = this.entry.email;
      loginInput.value = this.entry.login;
      passwordInput.value = this.entry.password;
      notesInput.value = this.entry.notes;
    } else {
      this.entry = {
        name: nameInput.value,
        icon: this.entryIcon,
        url: urlInput.value,
        email: emailInput.value,
        login: loginInput.value,
        aesIv: '',
        password: passwordInput.value,
        notes: notesInput.value,
      };
    }
  }
}

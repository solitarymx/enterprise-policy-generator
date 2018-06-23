'use strict';

/* global output, serializer */

const elListConfigurationsLink = document.getElementById('list-configurations');
const elSaveConfigurationLink = document.getElementById('save-configuration');

/**
 * @exports management
 */
const management = {
  /**
   * The init() method. Defines the event listeners for the configuration management links.
   *
   * @returns {void}
   */
  init () {
    elListConfigurationsLink.addEventListener('click', (e) => {
      e.preventDefault();
      management.showListConfigurationsDialog();
    });

    elSaveConfigurationLink.addEventListener('click', (e) => {
      e.preventDefault();
      management.showSaveConfigurationDialog();
    });
  },

  /**
   * Show the "save configuration" dialog. This method also defines the behaviour of the dialog.
   *
   * @returns {void}
   */
  showSaveConfigurationDialog () {
    // show dialog
    const elModal = document.getElementById('modal-save-dialog');
    elModal.classList.add('visible');

    const elName = elModal.querySelector('#save-dialog-name');
    const elSubmitButton = elModal.querySelector('#button-save-dialog-ok');
    const elCloseButton = elModal.querySelector('#button-save-dialog-cancel');

    // focus the name input field
    elName.focus();

    // the name field must not be empty
    elName.addEventListener('input', () => {
      if (elName.value) {
        elSubmitButton.removeAttribute('disabled');
      }
      else {
        elSubmitButton.setAttribute('disabled', true);
      }
    });

    // close dialog by clicking the cancel button
    elCloseButton.addEventListener('click', () => {
      management.closeSaveConfigurationDialog(elModal, elSubmitButton);
    });

    // close dialog by pressing ESC
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        management.closeSaveConfigurationDialog(elModal, elSubmitButton);
      }
    });

    // submit button
    const submitListener = (e) => {
      e.preventDefault();

      management.saveConfiguration(elName.value);
      management.closeSaveConfigurationDialog(elModal, elSubmitButton);

      elSubmitButton.removeEventListener('click', submitListener);
    };

    elSubmitButton.addEventListener('click', submitListener);
  },

  /**
   * Close the "save configuration" dialog.
   *
   * @param {HTMLElement} elModal - the DOM element of the modal dialog
   * @param {HTMLElement} elSubmitButton - the DOM element of the submit button
   *
   * @returns {void}
   */
  closeSaveConfigurationDialog (elModal, elSubmitButton) {
    elModal.classList.remove('visible');
    elModal.querySelector('#save-dialog-name').value = '';
    elSubmitButton.setAttribute('disabled', true);
  },

  /**
   * Saves the current configuration with a name and the current date and time.
   *
   * @param {string} name - the name of the configuration
   *
   * @returns {void}
   */
  async saveConfiguration (name) {
    const { configurations } = await browser.storage.local.get({ configurations : [] });

    const configuration = {
      name : name,
      time : new Date(),
      configuration : serializer.serialize()
    };

    configurations.push(configuration);

    browser.storage.local.set({ configurations : configurations });
  },

  /**
   * Show the "list configurations" dialog. This method also defines the behaviour of the dialog.
   *
   * @returns {void}
   */
  showListConfigurationsDialog () {
    // show dialog
    const elModal = document.getElementById('modal-list-dialog');
    elModal.classList.add('visible');

    // close dialog by clicking the cancel button
    const elCloseButton = elModal.querySelector('#button-list-dialog-cancel');
    elCloseButton.addEventListener('click', () => {
      management.closeListConfigurationsDialog(elModal);
    });

    // close dialog by pressing ESC
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        management.closeListConfigurationsDialog(elModal);
      }
    });

    management.listConfigurations(elModal);
  },

  /**
   * Close the "list configurations" dialog.
   *
   * @param {HTMLElement} elModal - the DOM element of the modal dialog
   *
   * @returns {void}
   */
  closeListConfigurationsDialog (elModal) {
    elModal.classList.remove('visible');
  },

  /**
   * List the saved configurations.
   *
   * @param {HTMLElement} elModal - the DOM element of the modal dialog
   *
   * @returns {void}
   */
  async listConfigurations (elModal) {
    const { configurations } = await browser.storage.local.get({ configurations : [] });

    // tbody element, configuration rows will be added here
    const elTableBody = elModal.querySelector('#list-configurations-table tbody');

    // remove old content
    while (elTableBody.firstChild) {
      elTableBody.removeChild(elTableBody.firstChild);
    }

    // add configurations to table
    const configurationLength = configurations.length;
    for (let i = 0; i < configurationLength; i++) {
      // row
      const elRow = document.createElement('tr');
      elTableBody.appendChild(elRow);

      // name column
      const elNameColumn = document.createElement('td');
      elNameColumn.textContent = configurations[i].name;
      elRow.appendChild(elNameColumn);

      // time column
      const elTimeColumn = document.createElement('td');
      elTimeColumn.textContent = configurations[i].time.toLocaleString();
      elRow.appendChild(elTimeColumn);

      // icon column
      const elIconColumn = document.createElement('td');
      elRow.appendChild(elIconColumn);

      // remove icon
      const elRemoveLink = document.createElement('a');
      elRemoveLink.setAttribute('href', '#');
      elRemoveLink.setAttribute('title', browser.i18n.getMessage('title_remove_configuration'));
      elRemoveLink.setAttribute('data-idx', i);
      elRemoveLink.classList.add('icon');
      elRemoveLink.addEventListener('click', management.removeConfiguration);
      elIconColumn.appendChild(elRemoveLink);

      const elRemoveIcon = document.createElement('img');
      elRemoveIcon.src = '/images/trash.svg';
      elRemoveIcon.setAttribute('alt', browser.i18n.getMessage('title_remove_configuration'));
      elRemoveLink.appendChild(elRemoveIcon);

      // load icon
      const elLoadLink = document.createElement('a');
      elLoadLink.setAttribute('href', '#');
      elLoadLink.setAttribute('title', browser.i18n.getMessage('title_apply_configuration'));
      elLoadLink.setAttribute('data-idx', i);
      elLoadLink.classList.add('icon');
      elLoadLink.addEventListener('click', management.applyConfiguration);
      elIconColumn.appendChild(elLoadLink);

      const elLoadIcon = document.createElement('img');
      elLoadIcon.src = '/images/check-square.svg';
      elLoadIcon.setAttribute('alt', browser.i18n.getMessage('title_apply_configuration'));
      elLoadLink.appendChild(elLoadIcon);
    }
  },

  /**
   * Applies the selected configuration.
   *
   * @param {MouseEvent} e - event
   *
   * @returns {void}
   */
  async applyConfiguration (e) {
    e.preventDefault();

    const { configurations } = await browser.storage.local.get({ configurations : [] });
    serializer.unserialize(configurations[e.target.parentNode.getAttribute('data-idx')].configuration);
    management.closeListConfigurationsDialog(document.getElementById('modal-list-dialog'));
    document.getElementById('policy-output').innerText = output.generatePoliciesOutput();
    document.getElementById('action-links').classList.remove('hidden');
  },

  /**
   * Removes the selected configuration.
   *
   * @param {MouseEvent} e - event
   *
   * @returns {void}
   */
  async removeConfiguration (e) {
    e.preventDefault();

    const { configurations } = await browser.storage.local.get({ configurations : [] });
    configurations.splice(e.target.parentNode.getAttribute('data-idx'), 1);
    browser.storage.local.set({ configurations : configurations });
    management.listConfigurations(document.getElementById('modal-list-dialog'));
  }
};

management.init();
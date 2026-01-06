/**
 * Integration tests for ConfigPage immediate updates
 */

const { mount } = require('@vue/test-utils');
const ConfigPage = require('../src/ConfigPage.vue').default;

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('ConfigPage Integration - Immediate Updates', () => {
  let wrapper;
  let configChangedSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    configChangedSpy = jest.fn();
    
    wrapper = mount(ConfigPage, {
      props: {
        gameActive: false
      },
      global: {
        mocks: {
          $emit: configChangedSpy
        }
      }
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('immediate configuration updates', () => {
    it('should emit configChanged immediately when max guesses changes', async () => {
      // Find the radio button for 6 guesses
      const sixGuessesRadio = wrapper.find('input[value="6"]');
      expect(sixGuessesRadio.exists()).toBe(true);
      
      // Click the radio button
      await sixGuessesRadio.trigger('change');
      
      // Should emit configChanged immediately
      expect(wrapper.emitted('configChanged')).toBeTruthy();
      expect(wrapper.emitted('configChanged')[0]).toEqual(['maxGuesses', 6]);
    });

    it('should emit configChanged immediately when difficulty changes', async () => {
      // Find the radio button for hard difficulty
      const hardRadio = wrapper.find('input[value="hard"]');
      expect(hardRadio.exists()).toBe(true);
      
      // Click the radio button
      await hardRadio.trigger('change');
      
      // Should emit configChanged immediately
      expect(wrapper.emitted('configChanged')).toBeTruthy();
      expect(wrapper.emitted('configChanged')[0]).toEqual(['difficulty', 'hard']);
    });

    it('should emit configChanged immediately when show definitions changes', async () => {
      // Find the checkbox for show definitions
      const definitionsCheckbox = wrapper.find('input[type="checkbox"]');
      expect(definitionsCheckbox.exists()).toBe(true);
      
      // Toggle the checkbox
      await definitionsCheckbox.trigger('change');
      
      // Should emit configChanged immediately
      expect(wrapper.emitted('configChanged')).toBeTruthy();
      expect(wrapper.emitted('configChanged')[0]).toEqual(['showDefinitions', expect.any(Boolean)]);
    });

    it('should emit configChanged immediately when reset is clicked', async () => {
      // Find the reset button
      const resetButton = wrapper.find('.reset-btn');
      expect(resetButton.exists()).toBe(true);
      
      // Click the reset button
      await resetButton.trigger('click');
      
      // Should emit configChanged immediately
      expect(wrapper.emitted('configChanged')).toBeTruthy();
      expect(wrapper.emitted('configChanged')[0]).toEqual(['reset', null]);
    });
  });

  describe('disabled state during active game', () => {
    beforeEach(async () => {
      await wrapper.setProps({ gameActive: true });
    });

    it('should show warning when game is active', () => {
      const warning = wrapper.find('.game-active-warning');
      expect(warning.exists()).toBe(true);
      expect(warning.text()).toContain('Game In Progress');
    });

    it('should disable all form controls when game is active', () => {
      const radioButtons = wrapper.findAll('input[type="radio"]');
      const checkbox = wrapper.find('input[type="checkbox"]');
      const resetButton = wrapper.find('.reset-btn');

      radioButtons.forEach(radio => {
        expect(radio.attributes('disabled')).toBeDefined();
      });
      
      expect(checkbox.attributes('disabled')).toBeDefined();
      expect(resetButton.attributes('disabled')).toBeDefined();
    });

    it('should not emit configChanged when controls are disabled', async () => {
      const radioButton = wrapper.find('input[type="radio"]');
      
      // Try to trigger change on disabled control
      await radioButton.trigger('change');
      
      // Should not emit configChanged
      expect(wrapper.emitted('configChanged')).toBeFalsy();
    });
  });
});
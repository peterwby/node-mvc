/* eslint-disable max-len */
const plugin = require('tailwindcss/plugin');

module.exports = plugin(({addVariant, config}) => {
  const screens = config().theme.screens;

  for (const screen of Object.keys(screens)) {
    addVariant(`below-${screen}`, `@media screen and (max-width: theme('screens.${screen}'))`);
  }
});